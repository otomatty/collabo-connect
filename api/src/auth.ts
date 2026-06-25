import { betterAuth } from "better-auth";
import { magicLink } from "better-auth/plugins";
import { D1Dialect } from "kysely-d1";
import { getMagicLinkEmailHtml } from "./email-templates/magic-link.js";
import { parseCommaSeparatedList } from "./env-utils.js";
import type { Env } from "./bindings.js";

function createAuth(env: Env) {
  const isProduction = env.NODE_ENV === "production";
  const trustedOriginsList = parseCommaSeparatedList(env.BETTER_AUTH_TRUSTED_ORIGINS);
  const trustedOrigins = trustedOriginsList.length > 0 ? trustedOriginsList : undefined;

  return betterAuth({
    // Better Auth talks to D1 through its Kysely SQLite dialect.
    database: {
      dialect: new D1Dialect({ database: env.DB }),
      type: "sqlite",
    },
    secret: env.BETTER_AUTH_SECRET,
    // Magic-link URLs are generated against this origin. It must be the API
    // origin (the Worker that serves /api/auth), not the frontend.
    baseURL: env.BETTER_AUTH_URL ?? "http://localhost:8787",
    trustedOrigins,
    emailAndPassword: {
      enabled: true,
    },
    plugins: [
      magicLink({
        sendMagicLink: async ({ email, url }) => {
          if (isProduction && !env.RESEND_API_KEY) {
            console.error(
              "Magic link requested but RESEND_API_KEY is not set. Configure an email provider."
            );
            throw new Error(
              "Email sending is not configured. Set RESEND_API_KEY or configure sendMagicLink."
            );
          }
          if (env.RESEND_API_KEY) {
            const res = await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${env.RESEND_API_KEY}`,
              },
              body: JSON.stringify({
                from: env.RESEND_FROM ?? "onboarding@resend.dev",
                to: email,
                subject: "Collabo Connect ログインリンク",
                html: getMagicLinkEmailHtml(url),
              }),
            });
            if (!res.ok) {
              const err = await res.text();
              console.error("Resend error:", err);
              throw new Error("Failed to send magic link email");
            }
          } else {
            console.log("[Dev] Magic link for", email, ":", url);
          }
        },
      }),
    ],
    advanced: {
      database: {
        generateId: () => crypto.randomUUID(),
      },
      // When API and frontend are on different origins, the session cookie must
      // be SameSite=None; Secure so the browser sends it on cross-site fetches.
      ...(isProduction && {
        defaultCookieAttributes: {
          sameSite: "none" as const,
          secure: true,
        },
      }),
    },
  });
}

type Auth = ReturnType<typeof createAuth>;

// One Better Auth instance per Worker `env` (i.e. per isolate). betterAuth() is
// comparatively heavy to construct, and the D1 binding lives on `env`, so we
// memoize against the env object rather than rebuilding it on every request.
const authCache = new WeakMap<Env, Auth>();

/** Get (or lazily create) the Better Auth instance for this Worker env. */
export function getAuth(env: Env): Auth {
  const cached = authCache.get(env);
  if (cached) return cached;
  const auth = createAuth(env);
  authCache.set(env, auth);
  return auth;
}
