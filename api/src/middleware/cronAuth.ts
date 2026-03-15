import type { Request, Response, NextFunction } from "express";

const CRON_SECRET = process.env.CRON_SECRET;

/** Require x-cron-secret header to match CRON_SECRET. Used for /api/cron/* */
export function requireCronSecret(req: Request, res: Response, next: NextFunction): void {
  if (!CRON_SECRET) {
    res.status(503).json({ error: "CRON_SECRET is not configured" });
    return;
  }
  const header = req.headers["x-cron-secret"];
  if (header !== CRON_SECRET) {
    res.status(403).json({ error: "Invalid or missing x-cron-secret" });
    return;
  }
  next();
}
