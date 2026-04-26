import { Router, type Request, type Response } from "express";
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

/** Row shape returned by the listing endpoint: suggested_tag plus the joined canonical tag (if any). */
interface SuggestedTagWithTag extends SuggestedTag {
  tag: Tag | null;
}

/**
 * GET /api/suggested-tags?status=pending
 * Defaults to status=pending when omitted. The joined `tag` column is null for
 * proposed_name-only suggestions (the tag row doesn't exist yet).
 */
router.get("/", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId!;
  const statusRaw = req.query.status;
  const status: SuggestedTagStatus = isStatus(statusRaw) ? statusRaw : "pending";

  const r = await pool.query<SuggestedTagWithTag>(
    `SELECT s.*, to_jsonb(t.*) AS tag
       FROM public.suggested_tags s
  LEFT JOIN public.tags t ON t.id = s.tag_id
      WHERE s.user_id = $1
        AND s.status = $2
   ORDER BY s.created_at DESC`,
    [userId, status]
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

    const lookup = await client.query<SuggestedTag>(
      "SELECT * FROM public.suggested_tags WHERE id = $1 FOR UPDATE",
      [id]
    );
    if (lookup.rows.length === 0) {
      await client.query("ROLLBACK");
      res.status(404).json({ error: "Suggested tag not found" });
      return;
    }
    const suggestion = lookup.rows[0];
    if (suggestion.user_id !== userId) {
      await client.query("ROLLBACK");
      res.status(403).json({ error: "Not allowed to operate on this suggested tag" });
      return;
    }
    if (suggestion.status !== "pending") {
      await client.query("ROLLBACK");
      res.status(409).json({ error: "Suggested tag is not pending" });
      return;
    }

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

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const lookup = await client.query<SuggestedTag>(
      "SELECT * FROM public.suggested_tags WHERE id = $1 FOR UPDATE",
      [id]
    );
    if (lookup.rows.length === 0) {
      await client.query("ROLLBACK");
      res.status(404).json({ error: "Suggested tag not found" });
      return;
    }
    const suggestion = lookup.rows[0];
    if (suggestion.user_id !== userId) {
      await client.query("ROLLBACK");
      res.status(403).json({ error: "Not allowed to operate on this suggested tag" });
      return;
    }
    if (suggestion.status !== "pending") {
      await client.query("ROLLBACK");
      res.status(409).json({ error: "Suggested tag is not pending" });
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
