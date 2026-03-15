import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

/** Verify Supabase JWT and set req.userId to sub. Returns 401 if invalid. */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const secret = process.env.SUPABASE_JWT_SECRET;
  if (!secret) {
    res.status(503).json({ error: "SUPABASE_JWT_SECRET is not configured" });
    return;
  }
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid Authorization header" });
    return;
  }
  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, secret) as { sub?: string };
    if (!decoded.sub) {
      res.status(401).json({ error: "Invalid token: missing sub" });
      return;
    }
    req.userId = decoded.sub;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

/** Optional auth: set req.userId if valid Bearer present, otherwise continue without it. */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const secret = process.env.SUPABASE_JWT_SECRET;
  if (!secret) {
    next();
    return;
  }
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    next();
    return;
  }
  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, secret) as { sub?: string };
    if (decoded.sub) req.userId = decoded.sub;
  } catch {
    // ignore
  }
  next();
}
