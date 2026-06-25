import { Hono } from "hono";
import { isTagCategory } from "../services/tags.js";
import type { AppContext } from "../bindings.js";
import type { Tag, TagCategory } from "../types.js";

const router = new Hono<AppContext>();

function parseLimit(raw: unknown, fallback: number, max: number): number {
  const n = Number.parseInt(String(raw ?? ""), 10);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(n, max);
}

/**
 * Escape LIKE metacharacters (%, _, \) in user input so they are matched
 * literally rather than interpreted as wildcards. Used together with ESCAPE '\'.
 */
function escapeLikePattern(s: string): string {
  return s.replace(/[\\%_]/g, "\\$&");
}

/**
 * GET /api/tags?q=<query>&category=<category>&limit=<n>
 * Substring search (case-insensitive) over name and aliases.
 * Results ordered by usage_count desc so popular tags surface first.
 */
router.get("/", async (c) => {
  const db = c.get("db");
  const qRaw = c.req.query("q");
  const q = typeof qRaw === "string" ? qRaw.trim() : "";
  const categoryRaw = c.req.query("category");
  const limit = parseLimit(c.req.query("limit"), 20, 100);

  const category: TagCategory | null = isTagCategory(categoryRaw) ? categoryRaw : null;

  const params: unknown[] = [];
  const where: string[] = [];

  if (q !== "") {
    params.push(`%${escapeLikePattern(q)}%`);
    const p = params.length;
    where.push(
      `(name LIKE $${p} ESCAPE '\\' OR EXISTS (
          SELECT 1 FROM json_each(coalesce(aliases, '[]')) WHERE value LIKE $${p} ESCAPE '\\'
        ))`
    );
  }
  if (category) {
    params.push(category);
    where.push(`category = $${params.length}`);
  }
  params.push(limit);
  const limitParam = `$${params.length}`;

  const sql = `SELECT * FROM tags
              ${where.length > 0 ? "WHERE " + where.join(" AND ") : ""}
              ORDER BY usage_count DESC, name ASC
              LIMIT ${limitParam}`;
  const r = await db.query<Tag>(sql, params);
  return c.json(r.rows);
});

/**
 * GET /api/tags/popular?category=<category>&limit=<n>
 * Top-N tags ordered by usage_count.
 */
router.get("/popular", async (c) => {
  const db = c.get("db");
  const categoryRaw = c.req.query("category");
  const limit = parseLimit(c.req.query("limit"), 10, 50);
  const category: TagCategory | null = isTagCategory(categoryRaw) ? categoryRaw : null;

  const params: unknown[] = [];
  const where: string[] = ["usage_count > 0"];
  if (category) {
    params.push(category);
    where.push(`category = $${params.length}`);
  }
  params.push(limit);
  const sql = `SELECT * FROM tags
              WHERE ${where.join(" AND ")}
              ORDER BY usage_count DESC, name ASC
              LIMIT $${params.length}`;
  const r = await db.query<Tag>(sql, params);
  return c.json(r.rows);
});

/** GET /api/tags/:id - fetch a single tag row. */
router.get("/:id", async (c) => {
  const db = c.get("db");
  const r = await db.query<Tag>("SELECT * FROM tags WHERE id = $1", [c.req.param("id")]);
  if (r.rows.length === 0) {
    return c.json({ error: "Tag not found" }, 404);
  }
  return c.json(r.rows[0]);
});

export default router;
