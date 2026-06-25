import type { MiddlewareHandler } from "hono";
import type { AppContext } from "../bindings.js";

/** Require the `x-cron-secret` header to match CRON_SECRET. Used for /api/cron/*. */
export const requireCronSecret: MiddlewareHandler<AppContext> = async (c, next) => {
  const secret = c.env.CRON_SECRET;
  if (!secret) {
    return c.json({ error: "CRON_SECRET is not configured" }, 503);
  }
  if (c.req.header("x-cron-secret") !== secret) {
    return c.json({ error: "Invalid or missing x-cron-secret" }, 403);
  }
  await next();
};
