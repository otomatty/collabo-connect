import type { PoolClient } from "pg";
import { pool } from "../db.js";
import { findTagByName, normalizeTagName } from "./tags.js";
import type { ExtractedTag } from "../agents/tag-extractor.js";
import type { Tag } from "../types.js";

export type SuggestionSource = "interview" | "daily_question" | "posting";

export interface PersistSuggestionsResult {
  /** Number of high-confidence tags inserted into profile_tags. */
  applied: number;
  /** Number of medium-confidence tags inserted into suggested_tags. */
  pending: number;
  /** Number of suggestions skipped (already on profile, duplicate pending, invalid, etc.). */
  skipped: number;
}

/**
 * Resolve an extracted tag to an existing tags row when possible.
 *
 * Priority:
 * 1. existing_id, when it actually points to a row (the agent occasionally
 *    fabricates UUIDs, so we verify).
 * 2. Case-insensitive name / alias lookup (handles the agent picking the right
 *    tag but omitting the id, and the upsert race window in tags table).
 */
async function resolveExistingTag(
  client: PoolClient,
  suggestion: ExtractedTag
): Promise<Tag | null> {
  if (suggestion.existing_id) {
    const r = await client.query<Tag>(
      "SELECT * FROM public.tags WHERE id = $1",
      [suggestion.existing_id]
    );
    if (r.rows[0]) return r.rows[0];
  }
  return findTagByName(client, suggestion.name);
}

async function profileAlreadyHasTag(
  client: PoolClient,
  userId: string,
  tagId: string
): Promise<boolean> {
  const r = await client.query(
    "SELECT 1 FROM public.profile_tags WHERE profile_id = $1 AND tag_id = $2",
    [userId, tagId]
  );
  return r.rows.length > 0;
}

async function pendingSuggestionExistsForTag(
  client: PoolClient,
  userId: string,
  tagId: string
): Promise<boolean> {
  const r = await client.query(
    `SELECT 1 FROM public.suggested_tags
      WHERE user_id = $1 AND tag_id = $2 AND status = 'pending'`,
    [userId, tagId]
  );
  return r.rows.length > 0;
}

async function pendingSuggestionExistsForName(
  client: PoolClient,
  userId: string,
  proposedName: string
): Promise<boolean> {
  const r = await client.query(
    `SELECT 1 FROM public.suggested_tags
      WHERE user_id = $1
        AND tag_id IS NULL
        AND lower(proposed_name) = lower($2)
        AND status = 'pending'`,
    [userId, proposedName]
  );
  return r.rows.length > 0;
}

/**
 * Insert a profile_tag row and refresh the affected tag's usage_count.
 *
 * Mirrors syncProfileTags' approach: take a row-level lock on the tag and
 * recount profile_tags rather than incrementing, so that concurrent writers
 * never drift the count from the source of truth.
 */
async function applyHighConfidenceTag(
  client: PoolClient,
  userId: string,
  tagId: string
): Promise<boolean> {
  await client.query("SELECT 1 FROM public.tags WHERE id = $1 FOR UPDATE", [tagId]);
  const ins = await client.query(
    `INSERT INTO public.profile_tags (profile_id, tag_id, source)
          VALUES ($1, $2, 'auto')
     ON CONFLICT (profile_id, tag_id) DO NOTHING`,
    [userId, tagId]
  );
  if ((ins.rowCount ?? 0) === 0) return false;
  await client.query(
    `UPDATE public.tags
        SET usage_count = (
          SELECT count(*)::int FROM public.profile_tags WHERE tag_id = $1
        )
      WHERE id = $1`,
    [tagId]
  );
  return true;
}

/**
 * Persist tag-extractor results for a user.
 *
 * - confidence "high" + tag exists → INSERT into profile_tags with source='auto'
 * - confidence "high" + tag does not exist → downgrade to medium pending review
 *   (the extractor should have called propose_new_tag in this case anyway, but
 *   we never auto-apply a tag that hasn't been admin-vetted via the suggested
 *   queue, since profile_tags requires a real tags.id)
 * - confidence "medium" → INSERT into suggested_tags with status='pending'
 * - skip when the user already has the tag, or when an identical pending
 *   suggestion is queued
 *
 * propose_new_tag results never INSERT into the tags table here. The tag row
 * is created only when an admin/user accepts the suggestion (out of scope).
 */
export async function persistSuggestions(
  userId: string,
  source: SuggestionSource,
  suggestions: ExtractedTag[]
): Promise<PersistSuggestionsResult> {
  const result: PersistSuggestionsResult = { applied: 0, pending: 0, skipped: 0 };
  if (!Array.isArray(suggestions) || suggestions.length === 0) return result;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Serialize concurrent persistSuggestions calls for the same user so
    // counters and dedupe checks see a consistent view.
    await client.query(
      "SELECT 1 FROM public.profiles WHERE id = $1 FOR UPDATE",
      [userId]
    );

    for (const suggestion of suggestions) {
      const normalizedName = normalizeTagName(suggestion.name);
      if (!normalizedName) {
        result.skipped++;
        continue;
      }
      const cleaned: ExtractedTag = { ...suggestion, name: normalizedName };

      const existing = await resolveExistingTag(client, cleaned);

      if (cleaned.confidence === "high" && existing) {
        if (await profileAlreadyHasTag(client, userId, existing.id)) {
          result.skipped++;
          continue;
        }
        const inserted = await applyHighConfidenceTag(client, userId, existing.id);
        if (inserted) result.applied++;
        else result.skipped++;
        continue;
      }

      if (cleaned.confidence === "high" && !existing) {
        // Defensive downgrade — see function docblock.
        cleaned.confidence = "medium";
      }

      if (existing) {
        if (await profileAlreadyHasTag(client, userId, existing.id)) {
          result.skipped++;
          continue;
        }
        if (await pendingSuggestionExistsForTag(client, userId, existing.id)) {
          result.skipped++;
          continue;
        }
        await client.query(
          `INSERT INTO public.suggested_tags
              (user_id, tag_id, proposed_category, source, confidence, reason, status)
           VALUES ($1, $2, $3, $4, 'medium', $5, 'pending')`,
          [userId, existing.id, cleaned.category, source, cleaned.reason]
        );
        result.pending++;
        continue;
      }

      // No existing tag — proposed_name path. Do NOT insert into tags here.
      if (await pendingSuggestionExistsForName(client, userId, cleaned.name)) {
        result.skipped++;
        continue;
      }
      await client.query(
        `INSERT INTO public.suggested_tags
            (user_id, tag_id, proposed_name, proposed_category, source, confidence, reason, status)
         VALUES ($1, NULL, $2, $3, $4, 'medium', $5, 'pending')`,
        [userId, cleaned.name, cleaned.category, source, cleaned.reason]
      );
      result.pending++;
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  return result;
}
