import type { DbClient } from "./db.js";

/**
 * Cloudflare Worker bindings + vars. Replaces the Railway/Node `process.env`
 * surface — every value that used to be read from `process.env` is now provided
 * through the Worker `env` (wrangler `[vars]` / secrets) and threaded via Hono's
 * context (`c.env`).
 */
export interface Env {
  /** D1 database binding (see wrangler.toml `[[d1_databases]]`). */
  DB: D1Database;
  /** Better Auth signing secret. */
  BETTER_AUTH_SECRET: string;
  /** Public origin that serves `/api/auth` (used to build magic-link URLs). */
  BETTER_AUTH_URL?: string;
  /** Comma-separated origins allowed to complete auth / send cookies. */
  BETTER_AUTH_TRUSTED_ORIGINS?: string;
  /** Comma-separated CORS origins (credentials require an explicit list). */
  CORS_ORIGINS?: string;
  /** Gemini API key for ai-interview / daily-question / tag-extractor. */
  GEMINI_API_KEY?: string;
  /** Shared secret required on the cron endpoint (`x-cron-secret`). */
  CRON_SECRET?: string;
  /** Resend API key for magic-link email delivery. */
  RESEND_API_KEY?: string;
  /** Resend "from" address. */
  RESEND_FROM?: string;
  /** "production" toggles secure/cross-site cookie attributes. */
  NODE_ENV?: string;
}

/** Per-request values set by middleware and read by handlers. */
export interface Variables {
  /** Set by requireAuth / optionalAuth from the Better Auth session. */
  userId?: string;
  /** D1-backed, pg-compatible db client (set once per request). */
  db: DbClient;
}

/** Hono generic binding used across the app: `new Hono<AppContext>()`. */
export interface AppContext {
  Bindings: Env;
  Variables: Variables;
}
