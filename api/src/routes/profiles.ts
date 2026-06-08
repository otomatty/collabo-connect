import { Router, type Request, type Response } from "express";
import { pool } from "../db.js";
import { normalizeDateOnlyInput } from "../date-utils.js";
import { requireAuth } from "../middleware/auth.js";
import { syncProfileTags } from "../services/tags.js";
import {
  generateConversationTopics,
  saveConversationTopics,
} from "../services/conversation-topics.js";
import { CONVERSATION_TOPICS_COUNT } from "../prompts/conversation-topics.js";
import type {
  Activity,
  ConversationTopic,
  ParticipantAction,
  Posting,
  Profile,
  ProfilePublicTag,
  ProfileTagDetail,
} from "../types.js";

const CONVERSATION_TOPICS_MAX = 5;
const TOPIC_EMOJI_MAX = 16;
const TOPIC_TITLE_MAX = 100;
const TOPIC_DESCRIPTION_MAX = 500;
const NICKNAME_MAX = 50;
const ACTIVITY_LIMIT_DEFAULT = 3;
const ACTIVITY_LIMIT_MAX = 20;

/** Raw row shape returned by the activity UNION query before hydration. */
interface ActivityRow {
  type: Activity["type"];
  at: string | null;
  posting_id: string | null;
  action: string | null;
  question: string | null;
  answer: string | null;
}

/**
 * Validate `conversation_topics` payload coming from PUT /api/profiles/me.
 *
 * Returns the sanitized (trimmed, length-bounded) array on success or an error
 * string on failure so the caller can respond 400. Empty arrays are valid
 * (clears the field). `description` may be empty; `title` is required.
 */
function parseConversationTopics(
  raw: unknown
): { ok: true; value: ConversationTopic[] } | { ok: false; error: string } {
  if (!Array.isArray(raw)) {
    return { ok: false, error: "conversation_topics must be an array" };
  }
  if (raw.length > CONVERSATION_TOPICS_MAX) {
    return {
      ok: false,
      error: `conversation_topics accepts at most ${CONVERSATION_TOPICS_MAX} items`,
    };
  }
  const result: ConversationTopic[] = [];
  for (let i = 0; i < raw.length; i++) {
    const item = raw[i];
    if (!item || typeof item !== "object") {
      return { ok: false, error: `conversation_topics[${i}] must be an object` };
    }
    const { emoji, title, description } = item as Record<string, unknown>;
    if (typeof emoji !== "string" || typeof title !== "string" || typeof description !== "string") {
      return {
        ok: false,
        error: `conversation_topics[${i}] requires string emoji/title/description`,
      };
    }
    const trimmedEmoji = emoji.trim();
    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();
    if (!trimmedTitle) {
      return { ok: false, error: `conversation_topics[${i}].title is required` };
    }
    if (trimmedEmoji.length > TOPIC_EMOJI_MAX) {
      return {
        ok: false,
        error: `conversation_topics[${i}].emoji exceeds ${TOPIC_EMOJI_MAX} chars`,
      };
    }
    if (trimmedTitle.length > TOPIC_TITLE_MAX) {
      return {
        ok: false,
        error: `conversation_topics[${i}].title exceeds ${TOPIC_TITLE_MAX} chars`,
      };
    }
    if (trimmedDescription.length > TOPIC_DESCRIPTION_MAX) {
      return {
        ok: false,
        error: `conversation_topics[${i}].description exceeds ${TOPIC_DESCRIPTION_MAX} chars`,
      };
    }
    result.push({
      emoji: trimmedEmoji,
      title: trimmedTitle,
      description: trimmedDescription,
    });
  }
  return { ok: true, value: result };
}

const router = Router();

/**
 * SELECT clause that attaches the computed `tags: text[]` column via the
 * `public.get_profile_tags(id)` SQL function. API responses keep the original
 * `tags: string[]` shape so the frontend does not need to change.
 */
const PROFILE_SELECT = "p.*, public.get_profile_tags(p.id) AS tags";

/** GET /api/profiles - list all profiles (for members list) */
router.get("/", async (_req: Request, res: Response): Promise<void> => {
  const r = await pool.query<Profile>(
    `SELECT ${PROFILE_SELECT} FROM public.profiles p ORDER BY p.name`
  );
  res.json(r.rows);
});

/** GET /api/profiles/me - current user's profile (auth required). Creates a default row if none exists (e.g. new magic-link user). */
router.get("/me", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId!;
  let r = await pool.query<Profile>(
    `SELECT ${PROFILE_SELECT} FROM public.profiles p WHERE p.id = $1`,
    [userId]
  );
  if (r.rows.length === 0) {
    await pool.query(
      `INSERT INTO public.profiles (id, name, avatar_url, job_type)
       VALUES ($1, 'User', '', '')
       ON CONFLICT (id) DO NOTHING`,
      [userId]
    );
    r = await pool.query<Profile>(
      `SELECT ${PROFILE_SELECT} FROM public.profiles p WHERE p.id = $1`,
      [userId]
    );
  }
  if (r.rows.length === 0) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }
  res.json(r.rows[0]);
});

/** POST /api/profiles - create profile for current user (id = JWT sub) */
router.post("/", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId!;
  const { name, avatar_url } = req.body as { name?: string; avatar_url?: string };
  const displayName = typeof name === "string" && name.trim() ? name.trim() : "User";
  const avatar = typeof avatar_url === "string" ? avatar_url : "";

  await pool.query(
    `INSERT INTO public.profiles (id, name, avatar_url, job_type)
     VALUES ($1, $2, $3, '')
     ON CONFLICT (id) DO NOTHING`,
    [userId, displayName, avatar]
  );
  const r = await pool.query<Profile>(
    `SELECT ${PROFILE_SELECT} FROM public.profiles p WHERE p.id = $1`,
    [userId]
  );
  if (r.rows.length === 0) {
    res.status(409).json({ error: "Profile already exists or conflict" });
    return;
  }
  res.status(201).json(r.rows[0]);
});

/**
 * GET /api/profiles/me/tags - current user's profile_tags joined with tag rows.
 *
 * Unlike `profiles.tags` (a flat string[]) this exposes per-row metadata —
 * `source` and `created_at` — needed by the MyPage suggested-tag UI to mark
 * recently auto-applied tags with a "NEW" badge. Ordered by recency so the
 * client can take a prefix without sorting.
 */
router.get("/me/tags", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId!;
  const r = await pool.query<ProfileTagDetail>(
    `SELECT t.id AS tag_id,
            t.name,
            t.category,
            t.aliases,
            pt.source,
            pt.created_at
       FROM public.profile_tags pt
       JOIN public.tags t ON t.id = pt.tag_id
      WHERE pt.profile_id = $1
   ORDER BY pt.created_at DESC NULLS LAST, t.name ASC`,
    [userId]
  );
  res.json(r.rows);
});

/**
 * POST /api/profiles/me/conversation-topics/regenerate
 *
 * Used by the MyPage "再生成" button (Phase 3-7). Runs Gemini synchronously so
 * the client immediately renders the new topics. Reuses the same generator as
 * the post-interview fire-and-forget path, but pulls input from the persisted
 * profile (name / role / job_type / tags / ai_intro) since personCard is not
 * stored — it lives only inside the AI interview session.
 *
 * Failure modes follow the issue's acceptance criteria: if generation returns
 * no topics (Gemini error, empty payload, etc.) we leave the existing value
 * untouched and respond 502 so the UI can show an error toast without losing
 * the previous topics.
 */
router.post(
  "/me/conversation-topics/regenerate",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.userId!;
      const r = await pool.query<Profile>(
        `SELECT ${PROFILE_SELECT} FROM public.profiles p WHERE p.id = $1`,
        [userId]
      );
      if (r.rows.length === 0) {
        res.status(404).json({ error: "Profile not found" });
        return;
      }
      const profile = r.rows[0];
      const topics = await generateConversationTopics({
        profile: {
          name: profile.name,
          role: profile.role,
          job_type: profile.job_type,
          tags: profile.tags,
        },
        aiIntro: profile.ai_intro,
      });
      // Insist on the full set so a partial Gemini response doesn't replace
      // a complete prior set with a worse one. Mirrors the fire-and-forget
      // path's preserve-on-incomplete behavior.
      if (topics.length < CONVERSATION_TOPICS_COUNT) {
        res.status(502).json({ error: "Failed to generate conversation topics" });
        return;
      }
      const saved = await saveConversationTopics(userId, topics);
      if (!saved) {
        res.status(404).json({ error: "Profile not found" });
        return;
      }
      const updated = await pool.query<Profile>(
        `SELECT ${PROFILE_SELECT} FROM public.profiles p WHERE p.id = $1`,
        [userId]
      );
      if (updated.rows.length === 0) {
        res.status(404).json({ error: "Profile not found" });
        return;
      }
      res.json(updated.rows[0]);
    } catch (err) {
      console.error("POST /api/profiles/me/conversation-topics/regenerate error:", err);
      res.status(500).json({ error: "Failed to regenerate conversation topics" });
    }
  }
);

/**
 * GET /api/profiles/:id/activity?limit=3 - public "最近の活動" timeline.
 *
 * Merges three event sources into a single time-descending list so other
 * members can spot shared experiences (same posting, same daily question):
 *   - postings the user created            → posting_created
 *   - postings the user joined / liked     → posting_participated
 *   - daily AI questions the user answered → question_answered
 *
 * Privacy: intentionally public (no auth) — answers and participation are
 * already visible elsewhere, matching the existing spec. `limit` is clamped to
 * [1, ACTIVITY_LIMIT_MAX] and defaults to 3.
 *
 * The UNION ALL is ordered + limited in SQL so we only hydrate the few
 * postings that actually surface, then attach them in JS preserving order.
 */
router.get("/:id/activity", async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const rawLimit = Number.parseInt(String(req.query.limit ?? ""), 10);
  const limit = Number.isFinite(rawLimit)
    ? Math.min(Math.max(rawLimit, 1), ACTIVITY_LIMIT_MAX)
    : ACTIVITY_LIMIT_DEFAULT;

  const combined = await pool.query<ActivityRow>(
    `SELECT type, at, posting_id, action, question, answer
       FROM (
         SELECT 'posting_created' AS type, p.created_at AS at,
                p.id AS posting_id, NULL::text AS action,
                NULL::text AS question, NULL::text AS answer
           FROM public.postings p
          WHERE p.creator_id = $1
         UNION ALL
         SELECT 'posting_participated' AS type, pp.created_at AS at,
                pp.posting_id AS posting_id, pp.action AS action,
                NULL::text AS question, NULL::text AS answer
           FROM public.posting_participants pp
           JOIN public.postings p2 ON p2.id = pp.posting_id
          WHERE pp.user_id = $1 AND p2.creator_id <> $1
         UNION ALL
         SELECT 'question_answered' AS type, r.created_at AS at,
                NULL::uuid AS posting_id, NULL::text AS action,
                q.question AS question, r.answer AS answer
           FROM public.ai_question_responses r
           JOIN public.ai_questions q ON q.id = r.question_id
          WHERE r.user_id = $1
       ) combined
      ORDER BY at DESC NULLS LAST
      LIMIT $2`,
    [id, limit]
  );

  // Hydrate the postings referenced by posting_* entries in one round-trip.
  const postingIds = [
    ...new Set(
      combined.rows
        .map((row) => row.posting_id)
        .filter((pid): pid is string => pid !== null)
    ),
  ];
  const postingMap = new Map<string, Posting>();
  if (postingIds.length > 0) {
    const pr = await pool.query<Posting>(
      "SELECT * FROM public.postings WHERE id = ANY($1)",
      [postingIds]
    );
    for (const p of pr.rows) postingMap.set(p.id, p);
  }

  const activities: Activity[] = [];
  for (const row of combined.rows) {
    // pg returns timestamptz as a Date; serialize to ISO for a stable string.
    const at = row.at ? new Date(row.at).toISOString() : "";
    if (row.type === "question_answered") {
      activities.push({
        type: "question_answered",
        question: row.question ?? "",
        answer: row.answer ?? "",
        at,
      });
      continue;
    }
    const posting = row.posting_id ? postingMap.get(row.posting_id) : undefined;
    // Skip entries whose posting vanished between the two queries (rare).
    if (!posting) continue;
    if (row.type === "posting_created") {
      activities.push({ type: "posting_created", posting, at });
    } else {
      activities.push({
        type: "posting_participated",
        posting,
        action: (row.action ?? "join") as ParticipantAction,
        at,
      });
    }
  }

  res.json(activities);
});

/**
 * GET /api/profiles/:id/tags - public projection of a profile's tags with
 * category info. Used by MemberDetailPage to group tags by category without
 * bloating the main `GET /api/profiles/:id` payload (which is also shared by
 * the members list endpoint). Returns an empty array for profiles with no
 * tags — we don't distinguish 404 here because the parent profile fetch
 * already handles existence.
 */
router.get("/:id/tags", async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const r = await pool.query<ProfilePublicTag>(
    `SELECT t.id AS tag_id, t.name, t.category
       FROM public.profile_tags pt
       JOIN public.tags t ON t.id = pt.tag_id
      WHERE pt.profile_id = $1
   ORDER BY t.category ASC, t.name ASC`,
    [id]
  );
  res.json(r.rows);
});

/** GET /api/profiles/:id - get profile by id (public) */
router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const r = await pool.query<Profile>(
    `SELECT ${PROFILE_SELECT} FROM public.profiles p WHERE p.id = $1`,
    [id]
  );
  if (r.rows.length === 0) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }
  res.json(r.rows[0]);
});

/** PUT /api/profiles/me - update current user's profile */
router.put("/me", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const body = { ...(req.body as Partial<Profile>) };
    if (Object.prototype.hasOwnProperty.call(body, "joined_date")) {
      body.joined_date = normalizeDateOnlyInput(body.joined_date) as Profile["joined_date"];
    }

    if ("nickname" in body) {
      if (typeof body.nickname !== "string") {
        res.status(400).json({ error: "nickname must be a string" });
        return;
      }
      // Empty string is valid (clears the nickname; matches schema default).
      body.nickname = body.nickname.trim();
      if (body.nickname.length > NICKNAME_MAX) {
        res.status(400).json({ error: `nickname exceeds ${NICKNAME_MAX} chars` });
        return;
      }
    }

    let parsedTopics: ConversationTopic[] | undefined;
    if ("conversation_topics" in body) {
      const parsed = parseConversationTopics(body.conversation_topics);
      if (!parsed.ok) {
        res.status(400).json({ error: parsed.error });
        return;
      }
      parsedTopics = parsed.value;
    }

    const scalarCols = [
      "name", "nickname", "avatar_url", "role", "areas", "job_type", "ai_intro", "joined_date",
    ] as const;

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Verify the profile row exists before touching tags. Otherwise
      // syncProfileTags would hit a FK violation on tags.created_by /
      // profile_tags.profile_id and surface as a 500 rather than 404.
      const exists = await client.query(
        "SELECT 1 FROM public.profiles WHERE id = $1",
        [userId]
      );
      if (exists.rowCount === 0) {
        await client.query("ROLLBACK");
        res.status(404).json({ error: "Profile not found" });
        return;
      }

      const updates: string[] = [];
      const values: unknown[] = [];
      let i = 1;
      for (const key of scalarCols) {
        if (key in body) {
          updates.push(`${key} = $${i}`);
          values.push(body[key]);
          i++;
        }
      }
      if (parsedTopics !== undefined) {
        // Bump `conversation_topics_updated_at` only when the value actually
        // changes, so a no-op PUT does not invalidate the topics-specific
        // freshness signal. PG evaluates both RHS expressions against the row
        // BEFORE any SET assignments take effect, so the CASE compares the OLD
        // column value against the new param.
        updates.push(`conversation_topics = $${i}::jsonb`);
        updates.push(
          `conversation_topics_updated_at = CASE
             WHEN conversation_topics IS DISTINCT FROM $${i}::jsonb THEN now()
             ELSE conversation_topics_updated_at
           END`
        );
        values.push(JSON.stringify(parsedTopics));
        i++;
      }
      if (updates.length > 0) {
        values.push(userId);
        await client.query(
          `UPDATE public.profiles SET ${updates.join(", ")} WHERE id = $${i}`,
          values
        );
      }

      if ("tags" in body) {
        // null / undefined / non-array inputs are all treated as "clear all tags".
        // The frontend sends `tags: null` when the user empties the field.
        // syncProfileTags filters out non-string elements defensively.
        const rawTags: unknown[] = Array.isArray(body.tags) ? body.tags : [];
        await syncProfileTags(client, userId, rawTags);
      }

      const r = await client.query<Profile>(
        `SELECT ${PROFILE_SELECT} FROM public.profiles p WHERE p.id = $1`,
        [userId]
      );
      await client.query("COMMIT");
      res.json(r.rows[0]);
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("joined_date")) {
      res.status(400).json({ error: err.message });
      return;
    }
    console.error("PUT /api/profiles/me error:", err);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

export default router;
