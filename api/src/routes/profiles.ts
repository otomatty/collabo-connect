import { Router, type Request, type Response } from "express";
import { pool } from "../db.js";
import { normalizeDateOnlyInput } from "../date-utils.js";
import { requireAuth } from "../middleware/auth.js";
import { syncProfileTags } from "../services/tags.js";
import type { ConversationTopic, Profile, ProfileTagDetail } from "../types.js";

const CONVERSATION_TOPICS_MAX = 5;
const TOPIC_EMOJI_MAX = 16;
const TOPIC_TITLE_MAX = 100;
const TOPIC_DESCRIPTION_MAX = 500;
const NICKNAME_MAX = 50;

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
