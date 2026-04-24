import { Router, type Request, type Response } from "express";
import { pool } from "../db.js";
import { isTagCategory } from "../services/tags.js";
import type { Tag, TagCategory } from "../types.js";

const router = Router();

function parseLimit(raw: unknown, fallback: number, max: number): number {
  const n = Number.parseInt(String(raw ?? ""), 10);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(n, max);
}

/**
 * Escape LIKE/ILIKE metacharacters (%, _, \) in user input so they are matched
 * literally rather than interpreted as wildcards. Used together with ESCAPE '\'
 * in the SQL pattern.
 */
function escapeLikePattern(s: string): string {
  return s.replace(/[\\%_]/g, "\\$&");
}

/**
 * GET /api/tags?q=<query>&category=<category>&limit=<n>
 * Substring search (case-insensitive) over name and aliases.
 * Results ordered by usage_count desc so popular tags surface first.
 */
router.get("/", async (req: Request, res: Response): Promise<void> => {
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const categoryRaw = req.query.category;
  const limit = parseLimit(req.query.limit, 20, 100);

  const category: TagCategory | null = isTagCategory(categoryRaw) ? categoryRaw : null;

  const params: unknown[] = [];
  const where: string[] = [];

  if (q !== "") {
    params.push(`%${escapeLikePattern(q)}%`);
    const p = params.length;
    where.push(
      `(name ILIKE $${p} ESCAPE '\\' OR EXISTS (
          SELECT 1 FROM unnest(coalesce(aliases, '{}'::text[])) a WHERE a ILIKE $${p} ESCAPE '\\'
        ))`
    );
  }
  if (category) {
    params.push(category);
    where.push(`category = $${params.length}`);
  }
  params.push(limit);
  const limitParam = `$${params.length}`;

  const sql = `SELECT * FROM public.tags
              ${where.length > 0 ? "WHERE " + where.join(" AND ") : ""}
              ORDER BY usage_count DESC, name ASC
              LIMIT ${limitParam}`;
  const r = await pool.query<Tag>(sql, params);
  res.json(r.rows);
});

/**
 * GET /api/tags/popular?category=<category>&limit=<n>
 * Top-N tags ordered by usage_count. Used by member search quick-filter bar
 * and by the Phase 2 tagging agent as a discovery tool.
 */
router.get("/popular", async (req: Request, res: Response): Promise<void> => {
  const categoryRaw = req.query.category;
  const limit = parseLimit(req.query.limit, 10, 50);
  const category: TagCategory | null = isTagCategory(categoryRaw) ? categoryRaw : null;

  const params: unknown[] = [];
  const where: string[] = ["usage_count > 0"];
  if (category) {
    params.push(category);
    where.push(`category = $${params.length}`);
  }
  params.push(limit);
  const sql = `SELECT * FROM public.tags
              WHERE ${where.join(" AND ")}
              ORDER BY usage_count DESC, name ASC
              LIMIT $${params.length}`;
  const r = await pool.query<Tag>(sql, params);
  res.json(r.rows);
});

/**
 * GET /api/tags/:id - fetch a single tag row.
 */
router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  const r = await pool.query<Tag>(
    "SELECT * FROM public.tags WHERE id = $1",
    [req.params.id]
  );
  if (r.rows.length === 0) {
    res.status(404).json({ error: "Tag not found" });
    return;
  }
  res.json(r.rows[0]);
});

export default router;
