import { Hono } from "hono";
import { requireAuth } from "../middleware/auth.js";
import { profileTagsSubquery } from "../sql-helpers.js";
import type { DbClient } from "../db.js";
import type { AppContext } from "../bindings.js";
import type { Posting, Profile, PostingParticipant, PostingWithDetails } from "../types.js";

/** Posting columns stored as INTEGER booleans in D1. */
const BOOLEAN_FIELDS = new Set(["date_undecided", "is_online"]);

/** Allowed posting categories (mirrors the DB CHECK constraint). */
const POSTING_CATEGORIES = ["food", "study", "event"];

/**
 * Coerce an untrusted boolean-ish input to a real boolean before binding.
 * D1's INTEGER column would otherwise store a raw string like "false" verbatim
 * (and hydrateRow only un-maps numeric 0/1), so the API would return a truthy
 * string. Accepts booleans, 0/1, and "true"/"false"/"1"/"0" strings.
 */
function toBool(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const s = value.trim().toLowerCase();
    if (s === "true" || s === "1") return true;
    if (s === "false" || s === "0" || s === "") return false;
  }
  return fallback;
}

async function enrichPostings(
  db: DbClient,
  postings: Posting[]
): Promise<PostingWithDetails[]> {
  if (postings.length === 0) return [];
  const ids = postings.map((p) => p.id);
  const creatorIds = [...new Set(postings.map((p) => p.creator_id))];
  const idsClause = ids.map((_id, i) => `$${i + 1}`).join(", ");
  const ppRows = await db.query<PostingParticipant>(
    `SELECT * FROM posting_participants WHERE posting_id IN (${idsClause})`,
    [...ids]
  );
  const participantUserIds = [...new Set(ppRows.rows.map((p) => p.user_id))];
  const allUserIds = [...new Set([...creatorIds, ...participantUserIds])];
  const usersClause = allUserIds.map((_id, i) => `$${i + 1}`).join(", ");
  const profilesRows = await db.query<Profile>(
    `SELECT p.*, ${profileTagsSubquery("p.id")} AS tags FROM profiles p WHERE p.id IN (${usersClause})`,
    [...allUserIds]
  );
  const profileMap = new Map(profilesRows.rows.map((r) => [r.id, r]));
  const participantsByPosting = new Map<
    string,
    (PostingParticipant & { profile: Profile | null })[]
  >();
  for (const pp of ppRows.rows) {
    const list = participantsByPosting.get(pp.posting_id) ?? [];
    list.push({ ...pp, profile: profileMap.get(pp.user_id) ?? null });
    participantsByPosting.set(pp.posting_id, list);
  }
  return postings.map((p) => ({
    ...p,
    creator: profileMap.get(p.creator_id) ?? null,
    participants: participantsByPosting.get(p.id) ?? [],
  }));
}

const router = new Hono<AppContext>();

/** GET /api/postings/mine - postings created by or participated in by current user */
router.get("/mine", requireAuth, async (c) => {
  const db = c.get("db");
  const userId = c.get("userId")!;
  const created = await db.query<Posting>(
    "SELECT * FROM postings WHERE creator_id = $1 ORDER BY created_at DESC",
    [userId]
  );
  const participated = await db.query<{ posting_id: string }>(
    "SELECT posting_id FROM posting_participants WHERE user_id = $1",
    [userId]
  );
  const createdIds = new Set(created.rows.map((p) => p.id));
  const otherIds = participated.rows
    .map((p) => p.posting_id)
    .filter((id) => !createdIds.has(id));
  let allRows = [...created.rows];
  if (otherIds.length > 0) {
    const inList = otherIds.map((_id, i) => `$${i + 1}`).join(", ");
    const other = await db.query<Posting>(
      `SELECT * FROM postings WHERE id IN (${inList}) ORDER BY created_at DESC`,
      [...otherIds]
    );
    allRows = [...allRows, ...other.rows];
  }
  const enriched = await enrichPostings(db, allRows);
  return c.json(enriched);
});

/** GET /api/postings?category=food|study|event - list (category optional) */
router.get("/", async (c) => {
  const db = c.get("db");
  const category = c.req.query("category");
  let q = "SELECT * FROM postings ORDER BY created_at DESC";
  const params: string[] = [];
  if (category && category !== "all") {
    params.push(category);
    q = "SELECT * FROM postings WHERE category = $1 ORDER BY created_at DESC";
  }
  const r = await db.query<Posting>(q, params);
  const enriched = await enrichPostings(db, r.rows);
  return c.json(enriched);
});

/** GET /api/postings/:id */
router.get("/:id", async (c) => {
  const db = c.get("db");
  const r = await db.query<Posting>("SELECT * FROM postings WHERE id = $1", [
    c.req.param("id"),
  ]);
  if (r.rows.length === 0) {
    return c.json({ error: "Posting not found" }, 404);
  }
  const [enriched] = await enrichPostings(db, r.rows);
  return c.json(enriched);
});

/** POST /api/postings */
router.post("/", requireAuth, async (c) => {
  const db = c.get("db");
  const userId = c.get("userId")!;
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const { title, category, date, date_undecided, area, is_online, description } = body;
  if (
    typeof title !== "string" || !title.trim() ||
    typeof area !== "string" || !area.trim() ||
    typeof category !== "string" || !POSTING_CATEGORIES.includes(category)
  ) {
    return c.json(
      { error: "title and area must be non-empty strings; category must be food, study, or event" },
      400
    );
  }
  const r = await db.query<Posting>(
    `INSERT INTO postings (title, category, date, date_undecided, area, is_online, description, creator_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      title,
      category,
      date ?? null,
      toBool(date_undecided),
      area,
      toBool(is_online),
      description ?? "",
      userId,
    ]
  );
  const [enriched] = await enrichPostings(db, r.rows);
  return c.json(enriched, 201);
});

/** PUT /api/postings/:id - creator only */
router.put("/:id", requireAuth, async (c) => {
  const db = c.get("db");
  const userId = c.get("userId")!;
  const id = c.req.param("id");
  const check = await db.query<Posting>("SELECT * FROM postings WHERE id = $1", [id]);
  if (check.rows.length === 0) {
    return c.json({ error: "Posting not found" }, 404);
  }
  if (check.rows[0].creator_id !== userId) {
    return c.json({ error: "Only creator can update" }, 403);
  }
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  // Validate provided fields before they reach the DB (an invalid category would
  // otherwise hit the CHECK constraint and surface as a 500).
  if (
    "category" in body &&
    (typeof body.category !== "string" || !POSTING_CATEGORIES.includes(body.category))
  ) {
    return c.json({ error: "category must be food, study, or event" }, 400);
  }
  for (const key of ["title", "area"] as const) {
    if (key in body && (typeof body[key] !== "string" || !(body[key] as string).trim())) {
      return c.json({ error: `${key} must be a non-empty string` }, 400);
    }
  }
  const allowed = [
    "title",
    "category",
    "date",
    "date_undecided",
    "area",
    "is_online",
    "description",
  ] as const;
  const updates: string[] = [];
  const values: unknown[] = [];
  let i = 1;
  for (const key of allowed) {
    if (key in body) {
      updates.push(`${key} = $${i}`);
      values.push(BOOLEAN_FIELDS.has(key) ? toBool(body[key]) : body[key]);
      i++;
    }
  }
  if (updates.length === 0) {
    const [enriched] = await enrichPostings(db, check.rows);
    return c.json(enriched);
  }
  // Bump updated_at in-app (no DB trigger on D1) now that a real update runs.
  updates.push("updated_at = now()");
  values.push(id);
  const q = `UPDATE postings SET ${updates.join(", ")} WHERE id = $${i} RETURNING *`;
  const r = await db.query<Posting>(q, values);
  const [enriched] = await enrichPostings(db, r.rows);
  return c.json(enriched);
});

/** DELETE /api/postings/:id - creator only */
router.delete("/:id", requireAuth, async (c) => {
  const db = c.get("db");
  const userId = c.get("userId")!;
  const id = c.req.param("id");
  const r = await db.query(
    "DELETE FROM postings WHERE id = $1 AND creator_id = $2 RETURNING id",
    [id, userId]
  );
  if (r.rowCount === 0) {
    return c.json({ error: "Posting not found or not creator" }, 404);
  }
  return c.body(null, 204);
});

export default router;
