import { Hono } from "hono";
import { requireAuth } from "../middleware/auth.js";
import { upsertTag } from "../services/tags.js";
import { tagJsonObject } from "../sql-helpers.js";
import type { DbClient } from "../db.js";
import type { AppContext } from "../bindings.js";
import type { SuggestedTag, Tag } from "../types.js";

const router = new Hono<AppContext>();

const ALLOWED_STATUSES = ["pending", "accepted", "rejected"] as const;
type SuggestedTagStatus = (typeof ALLOWED_STATUSES)[number];

function isStatus(v: unknown): v is SuggestedTagStatus {
  return typeof v === "string" && (ALLOWED_STATUSES as readonly string[]).includes(v);
}

function parseLimit(raw: unknown, fallback: number, max: number): number {
  const n = Number.parseInt(String(raw ?? ""), 10);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(n, max);
}

function parseOffset(raw: unknown): number {
  const n = Number.parseInt(String(raw ?? ""), 10);
  if (!Number.isFinite(n) || n < 0) return 0;
  return n;
}

/** Validate id format up front so a malformed value yields 400, not a 500. */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface SuggestedTagWithTag extends SuggestedTag {
  tag: Tag | null;
}

type LookupResult =
  | { ok: true; suggestion: SuggestedTag }
  | { ok: false; status: 404 | 403 | 409; message: string };

/**
 * Look up a suggested_tag by id and verify it (a) exists, (b) belongs to the
 * caller, and (c) is still pending. Shared by accept and reject so the
 * 404 / 403 / 409 contract stays in lockstep across both handlers.
 */
async function lookupPendingSuggestionForUser(
  db: DbClient,
  id: string,
  userId: string
): Promise<LookupResult> {
  const r = await db.query<SuggestedTag>(
    "SELECT * FROM suggested_tags WHERE id = $1",
    [id]
  );
  if (r.rows.length === 0) {
    return { ok: false, status: 404, message: "Suggested tag not found" };
  }
  const suggestion = r.rows[0];
  if (suggestion.user_id !== userId) {
    return { ok: false, status: 403, message: "Not allowed to operate on this suggested tag" };
  }
  if (suggestion.status !== "pending") {
    return { ok: false, status: 409, message: "Suggested tag is not pending" };
  }
  return { ok: true, suggestion };
}

/**
 * GET /api/suggested-tags?status=pending&limit=50&offset=0
 * Defaults to status=pending. The joined `tag` is null for proposed_name-only
 * suggestions (the tag row doesn't exist yet).
 */
router.get("/", requireAuth, async (c) => {
  const db = c.get("db");
  const userId = c.get("userId")!;
  const status: SuggestedTagStatus = isStatus(c.req.query("status"))
    ? (c.req.query("status") as SuggestedTagStatus)
    : "pending";
  const limit = parseLimit(c.req.query("limit"), 50, 100);
  const offset = parseOffset(c.req.query("offset"));

  const r = await db.query<SuggestedTagWithTag>(
    `SELECT s.*, ${tagJsonObject("t")} AS tag
       FROM suggested_tags s
  LEFT JOIN tags t ON t.id = s.tag_id
      WHERE s.user_id = $1
        AND s.status = $2
   ORDER BY s.created_at DESC
      LIMIT $3 OFFSET $4`,
    [userId, status, limit, offset]
  );
  return c.json(r.rows);
});

/**
 * POST /api/suggested-tags/:id/accept
 *
 * Resolve the target tag (inserting a new tags row for a proposed_name-only
 * suggestion), link it to the profile with source='auto', mark the suggestion
 * accepted, and refresh tags.usage_count.
 *
 * 404 if the suggestion does not exist, 403 if it belongs to another user,
 * 409 if it is no longer pending.
 */
router.post("/:id/accept", requireAuth, async (c) => {
  const db = c.get("db");
  const userId = c.get("userId")!;
  const id = c.req.param("id");
  if (!UUID_REGEX.test(id)) {
    return c.json({ error: "Invalid suggested tag id" }, 400);
  }

  try {
    const lookup = await lookupPendingSuggestionForUser(db, id, userId);
    if (!lookup.ok) {
      return c.json({ error: lookup.message }, lookup.status);
    }
    const { suggestion } = lookup;

    let resolvedTagId: string;
    if (suggestion.tag_id) {
      const tagExists = await db.query("SELECT 1 FROM tags WHERE id = $1", [
        suggestion.tag_id,
      ]);
      if (tagExists.rows.length === 0) {
        return c.json({ error: "Associated tag not found" }, 404);
      }
      resolvedTagId = suggestion.tag_id;
    } else if (suggestion.proposed_name) {
      const tag = await upsertTag(db, suggestion.proposed_name, {
        category: suggestion.proposed_category,
        createdBy: userId,
      });
      resolvedTagId = tag.id;
    } else {
      // Schema CHECK guarantees one of tag_id / proposed_name is set.
      return c.json({ error: "Suggested tag has neither tag_id nor proposed_name" }, 500);
    }

    // Atomically claim the suggestion: a single conditional UPDATE is the
    // compare-and-swap that serializes concurrent accept/reject (e.g. two tabs).
    // Only the request that flips it from 'pending' proceeds; a loser sees 0
    // affected rows and returns 409 WITHOUT inserting the profile tag, so we
    // can't end up with an accepted-then-rejected row whose tag link lingers.
    const claimed = await db.query<SuggestedTag>(
      `UPDATE suggested_tags
          SET status = 'accepted',
              resolved_at = now(),
              tag_id = COALESCE(tag_id, $2)
        WHERE id = $1 AND status = 'pending'
        RETURNING *`,
      [id, resolvedTagId]
    );
    if (claimed.rows.length === 0) {
      return c.json({ error: "Suggested tag is not pending" }, 409);
    }

    await db.query(
      `INSERT INTO profile_tags (profile_id, tag_id, source)
            VALUES ($1, $2, 'auto')
       ON CONFLICT (profile_id, tag_id) DO NOTHING`,
      [userId, resolvedTagId]
    );

    await db.query(
      `UPDATE tags
          SET usage_count = (SELECT count(*) FROM profile_tags WHERE tag_id = $1)
        WHERE id = $1`,
      [resolvedTagId]
    );

    return c.json(claimed.rows[0]);
  } catch (err) {
    console.error("POST /api/suggested-tags/:id/accept error:", err);
    return c.json({ error: "Failed to accept suggested tag" }, 500);
  }
});

/**
 * POST /api/suggested-tags/:id/reject
 *
 * Marks the suggestion rejected without touching tags or profile_tags so the
 * row remains as audit history. Same 404 / 403 / 409 semantics as accept.
 */
router.post("/:id/reject", requireAuth, async (c) => {
  const db = c.get("db");
  const userId = c.get("userId")!;
  const id = c.req.param("id");
  if (!UUID_REGEX.test(id)) {
    return c.json({ error: "Invalid suggested tag id" }, 400);
  }

  try {
    const lookup = await lookupPendingSuggestionForUser(db, id, userId);
    if (!lookup.ok) {
      return c.json({ error: lookup.message }, lookup.status);
    }

    // Conditional update (compare-and-swap on status) so a concurrent accept
    // can't be silently overwritten — the loser gets 409.
    const updated = await db.query<SuggestedTag>(
      `UPDATE suggested_tags
          SET status = 'rejected',
              resolved_at = now()
        WHERE id = $1 AND status = 'pending'
        RETURNING *`,
      [id]
    );
    if (updated.rows.length === 0) {
      return c.json({ error: "Suggested tag is not pending" }, 409);
    }

    return c.json(updated.rows[0]);
  } catch (err) {
    console.error("POST /api/suggested-tags/:id/reject error:", err);
    return c.json({ error: "Failed to reject suggested tag" }, 500);
  }
});

export default router;
