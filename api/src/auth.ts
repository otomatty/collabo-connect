import { randomUUID } from "node:crypto";
import { betterAuth } from "better-auth";
import { magicLink } from "better-auth/plugins";
import { getMagicLinkEmailHtml } from "./email-templates/magic-link.js";
import { pool } from "./db.js";

const baseURL = process.env.BETTER_AUTH_URL ?? process.env.RAILWAY_STATIC_URL ?? "http://localhost:3000";
const trustedOrigins = process.env.BETTER_AUTH_TRUSTED_ORIGINS
  ? process.env.BETTER_AUTH_TRUSTED_ORIGINS.split(",").map((s) => s.trim())
  : undefined;

export const auth = betterAuth({
  database: pool,
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL,
  trustedOrigins,
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        if (process.env.NODE_ENV === "production" && !process.env.RESEND_API_KEY) {
          console.error("Magic link requested but RESEND_API_KEY is not set. Configure an email provider.");
          throw new Error("Email sending is not configured. Set RESEND_API_KEY or configure sendMagicLink.");
        }
        if (process.env.RESEND_API_KEY) {
          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            },
            body: JSON.stringify({
              from: process.env.RESEND_FROM ?? "onboarding@resend.dev",
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
      generateId: () => randomUUID(),
    },
  },
});
