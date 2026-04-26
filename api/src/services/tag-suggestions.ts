import { createHash } from "node:crypto";
import type { PoolClient } from "pg";
import { pool } from "../db.js";
import { findTagByName, isTagCategory, normalizeTagName } from "./tags.js";
import {
  extractTags,
  type ExtractedTag,
  type ExtractInputProfile,
} from "../agents/tag-extractor.js";
import type { Tag } from "../types.js";

export type SuggestionSource = "interview" | "daily_question" | "posting";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
 * Two safety checks beyond a plain `WHERE id = $1` lookup:
 * 1. UUID-format guard — Gemini occasionally hallucinates non-UUID strings;
 *    sending those to a `uuid` column raises `invalid input syntax for type
 *    uuid` and aborts the surrounding transaction.
 * 2. name / alias cross-check — even when the id is well-formed, the model
 *    can swap fields and pair the right name with the wrong existing row.
 *    Requiring the row's name (or one of its aliases) to match the proposed
 *    name avoids creating a misattributed profile_tag link.
 *
 * Falls back to case-insensitive name lookup when the id-based path doesn't
 * confirm a match.
 */
async function resolveExistingTag(
  client: PoolClient,
  suggestion: ExtractedTag
): Promise<Tag | null> {
  const candidateId = suggestion.existing_id;
  if (candidateId && UUID_REGEX.test(candidateId)) {
    const r = await client.query<Tag>(
      `SELECT * FROM public.tags
        WHERE id = $1
          AND (
            lower(name) = lower($2)
            OR EXISTS (
              SELECT 1 FROM unnest(coalesce(aliases, '{}'::text[])) a
               WHERE lower(a) = lower($2)
            )
          )`,
      [candidateId, suggestion.name]
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

interface ResolvedSuggestion {
  cleaned: ExtractedTag;
  existing: Tag | null;
}

/**
 * Mark stale pending suggestions for this (user, tag) as accepted.
 *
 * Resolves entries reachable two ways:
 * 1. `tag_id = $tagId` — typical "medium pending against the same row".
 * 2. `tag_id IS NULL AND lower(proposed_name) ∈ {canonical name, aliases...}`
 *    — older proposed_name rows that pre-date the tag's creation in the
 *    dictionary. We match against the canonical name *and* aliases so a
 *    pending row stored under "JavaScript" still resolves when the model
 *    extracts the same tag via the "JS" alias. Backfills `tag_id` on those
 *    rows so historical audit links still resolve.
 *
 * Called on every path that applies or skips an existing tag, so the approval
 * UI never keeps showing a pending row for a tag the user already has.
 */
async function acceptResolvedPending(
  client: PoolClient,
  userId: string,
  tag: Tag
): Promise<void> {
  const lowerCandidates = lowerNameAndAliases(tag);
  await client.query(
    `UPDATE public.suggested_tags
        SET status = 'accepted',
            resolved_at = now(),
            tag_id = COALESCE(tag_id, $2)
      WHERE user_id = $1
        AND status = 'pending'
        AND (
          tag_id = $2
          OR (tag_id IS NULL AND lower(proposed_name) = ANY($3::text[]))
        )`,
    [userId, tag.id, lowerCandidates]
  );
}

function lowerNameAndAliases(tag: Tag): string[] {
  return [tag.name, ...(tag.aliases ?? [])]
    .filter((n): n is string => typeof n === "string" && n.length > 0)
    .map((n) => n.toLowerCase());
}

/**
 * Reuse a prior pending suggested_tags row for the same logical tag in the
 * medium-confidence path, instead of inserting a parallel duplicate.
 *
 * Matches on either:
 * - `tag_id = $tagId` (an earlier medium suggestion against the same row), or
 * - `tag_id IS NULL AND lower(proposed_name) ∈ {canonical name, aliases...}`
 *   (a row queued before the tag was added to the dictionary).
 *
 * Backfills `tag_id` on the proposed_name rows so the audit trail links to the
 * actual tag, but leaves `status = 'pending'` so the user still reviews it.
 *
 * Returns true when at least one row was reused, signalling the caller to skip
 * the INSERT.
 */
async function linkPendingSuggestionToTag(
  client: PoolClient,
  userId: string,
  tag: Tag
): Promise<boolean> {
  const lowerCandidates = lowerNameAndAliases(tag);
  const r = await client.query(
    `UPDATE public.suggested_tags
        SET tag_id = COALESCE(tag_id, $2)
      WHERE user_id = $1
        AND status = 'pending'
        AND (
          tag_id = $2
          OR (tag_id IS NULL AND lower(proposed_name) = ANY($3::text[]))
        )`,
    [userId, tag.id, lowerCandidates]
  );
  return (r.rowCount ?? 0) > 0;
}

/**
 * Persist tag-extractor results for a user.
 *
 * - confidence "high" + tag exists → INSERT into profile_tags with source='auto',
 *   then resolve any pre-existing pending suggested_tags rows for that tag —
 *   reachable both by tag_id and by an older proposed_name match — so the
 *   approval UI doesn't show stale entries.
 * - confidence "high" + tag does not exist → downgrade to medium pending review
 *   (we never auto-apply a tag that has no row yet, since profile_tags requires
 *   a real tags.id).
 * - confidence "medium" → INSERT into suggested_tags with status='pending'.
 * - skip when the user already has the tag, when an identical pending
 *   suggestion is queued, or when category fails the TagCategory check.
 *
 * propose_new_tag results never INSERT into the tags table here. The tag row
 * is created only when an admin/user accepts the suggestion (out of scope).
 *
 * Concurrency notes:
 * - Per-user serialization: a `FOR UPDATE` on the profile row keeps two
 *   concurrent persistSuggestions calls for the same user from racing on
 *   dedupe checks.
 * - Cross-user deadlock prevention: tag rows we plan to apply are pre-locked
 *   in sorted UUID order via a single `ORDER BY id FOR UPDATE`. Without this,
 *   two transactions for different users that touch overlapping tags in
 *   opposite orders could deadlock.
 * - usage_count refresh is batched into a single UPDATE at the end so we
 *   don't run a count subquery per insert.
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

    await client.query(
      "SELECT 1 FROM public.profiles WHERE id = $1 FOR UPDATE",
      [userId]
    );

    // Pass 1: validate input + resolve to existing tag rows. No write locks yet.
    const resolved: ResolvedSuggestion[] = [];
    for (const suggestion of suggestions) {
      const normalizedName = normalizeTagName(suggestion.name);
      if (!normalizedName || !isTagCategory(suggestion.category)) {
        result.skipped++;
        continue;
      }
      const cleaned: ExtractedTag = { ...suggestion, name: normalizedName };
      const existing = await resolveExistingTag(client, cleaned);
      resolved.push({ cleaned, existing });
    }

    // Lock every tag row we may write to, in deterministic UUID order, to
    // prevent the cross-user deadlock described above.
    const lockIds = Array.from(
      new Set(
        resolved
          .filter((r) => r.existing && r.cleaned.confidence === "high")
          .map((r) => r.existing!.id)
      )
    ).sort();
    if (lockIds.length > 0) {
      await client.query(
        "SELECT 1 FROM public.tags WHERE id = ANY($1::uuid[]) ORDER BY id FOR UPDATE",
        [lockIds]
      );
    }

    // Pass 2: apply or queue.
    const appliedTagIds = new Set<string>();
    for (const { cleaned, existing } of resolved) {
      if (cleaned.confidence === "high" && existing) {
        if (await profileAlreadyHasTag(client, userId, existing.id)) {
          await acceptResolvedPending(client, userId, existing);
          result.skipped++;
          continue;
        }
        const ins = await client.query(
          `INSERT INTO public.profile_tags (profile_id, tag_id, source)
                VALUES ($1, $2, 'auto')
           ON CONFLICT (profile_id, tag_id) DO NOTHING`,
          [userId, existing.id]
        );
        if ((ins.rowCount ?? 0) === 0) {
          result.skipped++;
          continue;
        }
        await acceptResolvedPending(client, userId, existing);
        appliedTagIds.add(existing.id);
        result.applied++;
        continue;
      }

      // High confidence but no existing tag → defensively defer to the
      // approval queue. profile_tags requires tag_id NOT NULL.
      const queued: ExtractedTag =
        cleaned.confidence === "high" && !existing
          ? { ...cleaned, confidence: "medium" }
          : cleaned;

      if (existing) {
        if (await profileAlreadyHasTag(client, userId, existing.id)) {
          await acceptResolvedPending(client, userId, existing);
          result.skipped++;
          continue;
        }
        // Reuse a prior pending row (either same tag_id, or an older
        // proposed_name that matches this tag's canonical name / alias) so we
        // don't end up with two parallel pending entries for the same logical
        // suggestion. linkPendingSuggestionToTag returns true iff a row was
        // reused — in that case there's nothing left to insert.
        if (await linkPendingSuggestionToTag(client, userId, existing)) {
          result.skipped++;
          continue;
        }
        await client.query(
          `INSERT INTO public.suggested_tags
              (user_id, tag_id, proposed_category, source, confidence, reason, status)
           VALUES ($1, $2, $3, $4, $5, $6, 'pending')`,
          [userId, existing.id, queued.category, source, queued.confidence, queued.reason]
        );
        result.pending++;
        continue;
      }

      if (await pendingSuggestionExistsForName(client, userId, queued.name)) {
        result.skipped++;
        continue;
      }
      await client.query(
        `INSERT INTO public.suggested_tags
            (user_id, tag_id, proposed_name, proposed_category, source, confidence, reason, status)
         VALUES ($1, NULL, $2, $3, $4, $5, $6, 'pending')`,
        [userId, queued.name, queued.category, source, queued.confidence, queued.reason]
      );
      result.pending++;
    }

    if (appliedTagIds.size > 0) {
      const ids = [...appliedTagIds];
      await client.query(
        `UPDATE public.tags t
            SET usage_count = sub.cnt
           FROM (
             SELECT tag_id, count(*)::int AS cnt
               FROM public.profile_tags
              WHERE tag_id = ANY($1::uuid[])
              GROUP BY tag_id
           ) sub
          WHERE t.id = sub.tag_id`,
        [ids]
      );
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

export interface InterviewMessage {
  role: "ai" | "user";
  content: string;
}

export interface ExtractAndPersistInput {
  messages: InterviewMessage[];
  personCard?: string | null;
  profile: ExtractInputProfile;
}

/**
 * Idempotency window for fire-and-forget invocations of the same interview.
 *
 * The frontend can resubmit the `generate` action (retry, double click, route
 * remount) within seconds. Without dedup the agent would run twice for the
 * same conversation. persistSuggestions already filters duplicate writes, but
 * we'd still spend a Gemini round trip + tool calls. Cap the in-memory hash
 * cache so a long-lived process can't grow unbounded.
 */
const RECENT_INTERVIEW_TTL_MS = 5 * 60 * 1000;
const RECENT_INTERVIEW_MAX_ENTRIES = 1000;
const recentInterviewHashes = new Map<string, number>();

function pruneRecentInterviewHashes(now: number): void {
  for (const [key, ts] of recentInterviewHashes) {
    if (now - ts > RECENT_INTERVIEW_TTL_MS) {
      recentInterviewHashes.delete(key);
    }
  }
  if (recentInterviewHashes.size > RECENT_INTERVIEW_MAX_ENTRIES) {
    const overflow = recentInterviewHashes.size - RECENT_INTERVIEW_MAX_ENTRIES;
    const it = recentInterviewHashes.keys();
    for (let i = 0; i < overflow; i++) {
      const k = it.next().value;
      if (k === undefined) break;
      recentInterviewHashes.delete(k);
    }
  }
}

function fingerprintInterview(userId: string, conversation: string): string {
  return createHash("sha256")
    .update(userId)
    .update(" ")
    .update(conversation)
    .digest("hex");
}

function buildInterviewConversation(
  messages: InterviewMessage[],
  personCard?: string | null
): string {
  const parts: string[] = [];
  const trimmedCard = typeof personCard === "string" ? personCard.trim() : "";
  if (trimmedCard) {
    parts.push("## 人物カード");
    parts.push(trimmedCard);
    parts.push("");
  }
  if (messages.length > 0) {
    parts.push("## インタビュー対話");
    for (const m of messages) {
      if (!m || typeof m.content !== "string") continue;
      const text = m.content.trim();
      if (!text) continue;
      const speaker = m.role === "user" ? "ユーザー" : "インタビュアー";
      parts.push(`${speaker}: ${text}`);
    }
  }
  return parts.join("\n");
}

/**
 * Run the tag-extractor agent on a finished AI interview and persist the
 * results. Designed for fire-and-forget invocation from the interview route:
 * never throws, never awaits anything the caller cares about.
 *
 * Idempotency: the (userId + conversation + personCard) hash is cached for a
 * short window. A repeat call within the window is dropped before the Gemini
 * request, which avoids the duplicate spend that persistSuggestions's row-
 * level dedupe would otherwise paper over after the fact.
 */
export async function extractAndPersistTags(
  userId: string,
  input: ExtractAndPersistInput
): Promise<void> {
  if (!userId) {
    console.warn("extractAndPersistTags: missing userId; skipping");
    return;
  }
  const messages = Array.isArray(input.messages) ? input.messages : [];
  const conversation = buildInterviewConversation(messages, input.personCard);
  if (!conversation.trim()) {
    return;
  }

  const key = fingerprintInterview(userId, conversation);
  const now = Date.now();
  pruneRecentInterviewHashes(now);
  const seenAt = recentInterviewHashes.get(key);
  if (seenAt !== undefined && now - seenAt <= RECENT_INTERVIEW_TTL_MS) {
    return;
  }
  // Reserve the slot up front so two concurrent generate retries (e.g. a
  // double-clicked button) don't both spawn the agent. Cleared in the
  // failure paths below — extractTags swallows transient Gemini errors and
  // returns [], so caching that empty result would suppress legitimate
  // retries until the TTL expired.
  recentInterviewHashes.set(key, now);

  let committed = false;
  try {
    const suggestions = await extractTags({
      conversation,
      profile: input.profile,
    });
    if (suggestions.length === 0) {
      return;
    }

    const result = await persistSuggestions(userId, "interview", suggestions);
    committed = true;
    console.log(
      `extractAndPersistTags: user=${userId} applied=${result.applied} pending=${result.pending} skipped=${result.skipped}`
    );
  } catch (err) {
    console.error("extractAndPersistTags: failed:", err);
  } finally {
    if (!committed) {
      recentInterviewHashes.delete(key);
    }
  }
}
