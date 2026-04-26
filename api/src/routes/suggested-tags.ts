import { Router, type Request, type Response } from "express";
import type { PoolClient } from "pg";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { upsertTag } from "../services/tags.js";
import type { SuggestedTag, Tag } from "../types.js";

const router = Router();

const ALLOWED_STATUSES = ["pending", "accepted", "rejected"] as const;
type SuggestedTagStatus = (typeof ALLOWED_STATUSES)[number];

function isStatus(v: unknown): v is SuggestedTagStatus {
  return typeof v === "string" && (ALLOWED_STATUSES as readonly string[]).includes(v);
}

/** Mirror of tags.ts's parseLimit: clamp to [1, max], fall back when invalid. */
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

/**
 * Same shape as suggested_tags.id (Postgres uuid_generate_v4). Validating up
 * front avoids surfacing `invalid input syntax for type uuid` from the SELECT
 * FOR UPDATE below as a generic 500 to the client.
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Row shape returned by the listing endpoint: suggested_tag plus the joined canonical tag (if any). */
interface SuggestedTagWithTag extends SuggestedTag {
  tag: Tag | null;
}

type LookupResult =
  | { ok: true; suggestion: SuggestedTag }
  | { ok: false; status: 404 | 403 | 409; message: string };

/**
 * Lock a suggested_tag by id and verify it (a) exists, (b) belongs to the
 * caller, and (c) is still pending. Shared by accept and reject so the
 * 404 / 403 / 409 contract stays in lockstep across both handlers. The caller
 * is still responsible for transaction control (BEGIN / ROLLBACK / COMMIT).
 */
async function lookupPendingSuggestionForUser(
  client: PoolClient,
  id: string,
  userId: string
): Promise<LookupResult> {
  const r = await client.query<SuggestedTag>(
    "SELECT * FROM public.suggested_tags WHERE id = $1 FOR UPDATE",
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
 * Defaults to status=pending when omitted. The joined `tag` column is null for
 * proposed_name-only suggestions (the tag row doesn't exist yet).
 *
 * Bounded with a default limit of 50 (cap 100) so a heavy user with hundreds
 * of historical suggestions does not return an unpaginated payload — the
 * limit / offset shape mirrors the existing tags.ts list endpoint.
 */
router.get("/", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId!;
  const statusRaw = req.query.status;
  const status: SuggestedTagStatus = isStatus(statusRaw) ? statusRaw : "pending";
  const limit = parseLimit(req.query.limit, 50, 100);
  const offset = parseOffset(req.query.offset);

  const r = await pool.query<SuggestedTagWithTag>(
    `SELECT s.*, to_jsonb(t.*) AS tag
       FROM public.suggested_tags s
  LEFT JOIN public.tags t ON t.id = s.tag_id
      WHERE s.user_id = $1
        AND s.status = $2
   ORDER BY s.created_at DESC
      LIMIT $3 OFFSET $4`,
    [userId, status, limit, offset]
  );
  res.json(r.rows);
});

/**
 * POST /api/suggested-tags/:id/accept
 *
 * Atomically (in one transaction):
 *  1. Resolve the target tag — INSERT a new tags row when the suggestion only
 *     carries a `proposed_name`. created_by is set to the accepting user so the
 *     dictionary tracks who introduced the tag.
 *  2. INSERT into profile_tags with source='auto' (consistent with the
 *     high-confidence auto-apply path in persistSuggestions).
 *  3. Mark the suggested_tag accepted and backfill tag_id when the row was
 *     proposed_name-only.
 *  4. Refresh tags.usage_count for the affected tag.
 *
 * Returns 404 if the suggestion does not exist, 403 if it belongs to another
 * user, and 409 if it is no longer pending.
 */
router.post("/:id/accept", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId!;
  const { id } = req.params;
  if (!UUID_REGEX.test(id)) {
    res.status(400).json({ error: "Invalid suggested tag id" });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Serialize concurrent profile-tag mutations for this user (matches
    // persistSuggestions / syncProfileTags). Locking the profile row before
    // touching suggested_tags keeps the lock order consistent across paths.
    await client.query(
      "SELECT 1 FROM public.profiles WHERE id = $1 FOR UPDATE",
      [userId]
    );

    const lookup = await lookupPendingSuggestionForUser(client, id, userId);
    if (!lookup.ok) {
      await client.query("ROLLBACK");
      res.status(lookup.status).json({ error: lookup.message });
      return;
    }
    const { suggestion } = lookup;

    let resolvedTagId: string;
    if (suggestion.tag_id) {
      // Lock the existing tag row before the usage_count refresh below to
      // avoid a lost update under concurrent accepts touching the same tag.
      // The ON DELETE CASCADE on suggested_tags.tag_id should make a missing
      // tag impossible while we hold the suggested_tag lock, but check
      // explicitly so a schema-constraint regression surfaces as 404 rather
      // than a FK violation 500 on the profile_tags INSERT below.
      const tagLock = await client.query(
        "SELECT 1 FROM public.tags WHERE id = $1 FOR UPDATE",
        [suggestion.tag_id]
      );
      if (tagLock.rows.length === 0) {
        await client.query("ROLLBACK");
        res.status(404).json({ error: "Associated tag not found" });
        return;
      }
      resolvedTagId = suggestion.tag_id;
    } else if (suggestion.proposed_name) {
      const tag = await upsertTag(client, suggestion.proposed_name, {
        category: suggestion.proposed_category,
        createdBy: userId,
      });
      // upsertTag's existing-tag path goes through findTagByName, which takes
      // no row lock. Lock the tag here for the same reason the tag_id branch
      // does — otherwise the usage_count refresh below can lose updates
      // under a concurrent accept / syncProfileTags touching this tag.
      await client.query(
        "SELECT 1 FROM public.tags WHERE id = $1 FOR UPDATE",
        [tag.id]
      );
      resolvedTagId = tag.id;
    } else {
      // Schema CHECK guarantees one of tag_id / proposed_name is set, so this
      // branch should be unreachable. Fail loud rather than silently corrupt.
      await client.query("ROLLBACK");
      res.status(500).json({ error: "Suggested tag has neither tag_id nor proposed_name" });
      return;
    }

    await client.query(
      `INSERT INTO public.profile_tags (profile_id, tag_id, source)
            VALUES ($1, $2, 'auto')
       ON CONFLICT (profile_id, tag_id) DO NOTHING`,
      [userId, resolvedTagId]
    );

    const updated = await client.query<SuggestedTag>(
      `UPDATE public.suggested_tags
          SET status = 'accepted',
              resolved_at = now(),
              tag_id = COALESCE(tag_id, $2)
        WHERE id = $1
        RETURNING *`,
      [id, resolvedTagId]
    );

    await client.query(
      `UPDATE public.tags
          SET usage_count = (
            SELECT count(*)::int FROM public.profile_tags WHERE tag_id = $1
          )
        WHERE id = $1`,
      [resolvedTagId]
    );

    await client.query("COMMIT");
    res.json(updated.rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("POST /api/suggested-tags/:id/accept error:", err);
    res.status(500).json({ error: "Failed to accept suggested tag" });
  } finally {
    client.release();
  }
});

/**
 * POST /api/suggested-tags/:id/reject
 *
 * Marks the suggestion rejected without touching tags or profile_tags so the
 * row remains as audit history. Same 404 / 403 / 409 semantics as accept.
 */
router.post("/:id/reject", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId!;
  const { id } = req.params;
  if (!UUID_REGEX.test(id)) {
    res.status(400).json({ error: "Invalid suggested tag id" });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const lookup = await lookupPendingSuggestionForUser(client, id, userId);
    if (!lookup.ok) {
      await client.query("ROLLBACK");
      res.status(lookup.status).json({ error: lookup.message });
      return;
    }

    const updated = await client.query<SuggestedTag>(
      `UPDATE public.suggested_tags
          SET status = 'rejected',
              resolved_at = now()
        WHERE id = $1
        RETURNING *`,
      [id]
    );

    await client.query("COMMIT");
    res.json(updated.rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("POST /api/suggested-tags/:id/reject error:", err);
    res.status(500).json({ error: "Failed to reject suggested tag" });
  } finally {
    client.release();
  }
});

export default router;
