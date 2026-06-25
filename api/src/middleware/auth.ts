import type { MiddlewareHandler } from "hono";
import { getAuth } from "../auth.js";
import type { AppContext } from "../bindings.js";

/** Require a Better Auth session (cookie). Sets `userId` in context. 401 if absent. */
export const requireAuth: MiddlewareHandler<AppContext> = async (c, next) => {
  const auth = getAuth(c.env);
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user?.id) {
    return c.json({ error: "Not authenticated" }, 401);
  }
  c.set("userId", session.user.id);
  await next();
};

/** Optional auth: set `userId` in context when a session exists, else continue. */
export const optionalAuth: MiddlewareHandler<AppContext> = async (c, next) => {
  const auth = getAuth(c.env);
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (session?.user?.id) {
    c.set("userId", session.user.id);
  }
  await next();
};
