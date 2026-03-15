import type { Request, Response, NextFunction } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../auth.js";

/** Require Better Auth session (cookie). Set req.userId to session.user.id. Returns 401 if no session. */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });
  if (!session?.user?.id) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  req.userId = session.user.id;
  next();
}

/** Optional auth: set req.userId if session exists. */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });
  if (session?.user?.id) {
    req.userId = session.user.id;
  }
  next();
}
