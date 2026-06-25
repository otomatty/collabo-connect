import { Hono } from "hono";
import { normalizeDateOnlyInput } from "../date-utils.js";
import { requireAuth } from "../middleware/auth.js";
import { syncProfileTags } from "../services/tags.js";
import {
  generateConversationTopics,
  saveConversationTopics,
} from "../services/conversation-topics.js";
import { CONVERSATION_TOPICS_COUNT } from "../prompts/conversation-topics.js";
import { profileTagsSubquery } from "../sql-helpers.js";
import type { AppContext } from "../bindings.js";
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
 * Returns the sanitized array on success or an error string on failure.
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
      return { ok: false, error: `conversation_topics[${i}].emoji exceeds ${TOPIC_EMOJI_MAX} chars` };
    }
    if (trimmedTitle.length > TOPIC_TITLE_MAX) {
      return { ok: false, error: `conversation_topics[${i}].title exceeds ${TOPIC_TITLE_MAX} chars` };
    }
    if (trimmedDescription.length > TOPIC_DESCRIPTION_MAX) {
      return {
        ok: false,
        error: `conversation_topics[${i}].description exceeds ${TOPIC_DESCRIPTION_MAX} chars`,
      };
    }
    result.push({ emoji: trimmedEmoji, title: trimmedTitle, description: trimmedDescription });
  }
  return { ok: true, value: result };
}

const router = new Hono<AppContext>();

/** SELECT clause attaching the computed `tags: string[]` column. */
const PROFILE_SELECT = `p.*, ${profileTagsSubquery("p.id")} AS tags`;

/** GET /api/profiles - list all profiles (for members list) */
router.get("/", async (c) => {
  const db = c.get("db");
  const r = await db.query<Profile>(
    `SELECT ${PROFILE_SELECT} FROM profiles p ORDER BY p.name`
  );
  return c.json(r.rows);
});

/** GET /api/profiles/me - current user's profile. Creates a default row if none. */
router.get("/me", requireAuth, async (c) => {
  const db = c.get("db");
  const userId = c.get("userId")!;
  let r = await db.query<Profile>(
    `SELECT ${PROFILE_SELECT} FROM profiles p WHERE p.id = $1`,
    [userId]
  );
  if (r.rows.length === 0) {
    await db.query(
      `INSERT INTO profiles (id, name, avatar_url, job_type)
       VALUES ($1, 'User', '', '')
       ON CONFLICT (id) DO NOTHING`,
      [userId]
    );
    r = await db.query<Profile>(
      `SELECT ${PROFILE_SELECT} FROM profiles p WHERE p.id = $1`,
      [userId]
    );
  }
  if (r.rows.length === 0) {
    return c.json({ error: "Profile not found" }, 404);
  }
  return c.json(r.rows[0]);
});

/** POST /api/profiles - create profile for current user (id = session user id) */
router.post("/", requireAuth, async (c) => {
  const db = c.get("db");
  const userId = c.get("userId")!;
  const body = (await c.req.json().catch(() => ({}))) as { name?: string; avatar_url?: string };
  const displayName =
    typeof body.name === "string" && body.name.trim() ? body.name.trim() : "User";
  const avatar = typeof body.avatar_url === "string" ? body.avatar_url : "";

  await db.query(
    `INSERT INTO profiles (id, name, avatar_url, job_type)
     VALUES ($1, $2, $3, '')
     ON CONFLICT (id) DO NOTHING`,
    [userId, displayName, avatar]
  );
  const r = await db.query<Profile>(
    `SELECT ${PROFILE_SELECT} FROM profiles p WHERE p.id = $1`,
    [userId]
  );
  if (r.rows.length === 0) {
    return c.json({ error: "Profile already exists or conflict" }, 409);
  }
  return c.json(r.rows[0], 201);
});

/** GET /api/profiles/me/tags - current user's profile_tags joined with tag rows. */
router.get("/me/tags", requireAuth, async (c) => {
  const db = c.get("db");
  const userId = c.get("userId")!;
  const r = await db.query<ProfileTagDetail>(
    `SELECT t.id AS tag_id,
            t.name,
            t.category,
            t.aliases,
            pt.source,
            pt.created_at
       FROM profile_tags pt
       JOIN tags t ON t.id = pt.tag_id
      WHERE pt.profile_id = $1
   ORDER BY pt.created_at DESC, t.name ASC`,
    [userId]
  );
  return c.json(r.rows);
});

/**
 * POST /api/profiles/me/conversation-topics/regenerate
 * Runs Gemini synchronously and persists the new topics, or 502 on failure.
 */
router.post("/me/conversation-topics/regenerate", requireAuth, async (c) => {
  const db = c.get("db");
  try {
    const userId = c.get("userId")!;
    const r = await db.query<Profile>(
      `SELECT ${PROFILE_SELECT} FROM profiles p WHERE p.id = $1`,
      [userId]
    );
    if (r.rows.length === 0) {
      return c.json({ error: "Profile not found" }, 404);
    }
    const profile = r.rows[0];
    const topics = await generateConversationTopics(
      {
        profile: {
          name: profile.name,
          role: profile.role,
          job_type: profile.job_type,
          tags: profile.tags,
        },
        aiIntro: profile.ai_intro,
      },
      c.env.GEMINI_API_KEY
    );
    if (topics.length < CONVERSATION_TOPICS_COUNT) {
      return c.json({ error: "Failed to generate conversation topics" }, 502);
    }
    const saved = await saveConversationTopics(db, userId, topics);
    if (!saved) {
      return c.json({ error: "Profile not found" }, 404);
    }
    const updated = await db.query<Profile>(
      `SELECT ${PROFILE_SELECT} FROM profiles p WHERE p.id = $1`,
      [userId]
    );
    if (updated.rows.length === 0) {
      return c.json({ error: "Profile not found" }, 404);
    }
    return c.json(updated.rows[0]);
  } catch (err) {
    console.error("POST /api/profiles/me/conversation-topics/regenerate error:", err);
    return c.json({ error: "Failed to regenerate conversation topics" }, 500);
  }
});

/**
 * GET /api/profiles/:id/activity?limit=3 - public "最近の活動" timeline merging
 * created postings, participated postings, and answered daily questions.
 */
router.get("/:id/activity", async (c) => {
  const db = c.get("db");
  try {
    const id = c.req.param("id");
    const rawLimit = Number.parseInt(String(c.req.query("limit") ?? ""), 10);
    const limit = Number.isFinite(rawLimit)
      ? Math.min(Math.max(rawLimit, 1), ACTIVITY_LIMIT_MAX)
      : ACTIVITY_LIMIT_DEFAULT;

    const combined = await db.query<ActivityRow>(
      `SELECT type, at, posting_id, action, question, answer
       FROM (
         SELECT 'posting_created' AS type, p.created_at AS at,
                p.id AS posting_id, NULL AS action,
                NULL AS question, NULL AS answer
           FROM postings p
          WHERE p.creator_id = $1
         UNION ALL
         SELECT 'posting_participated' AS type, pp.created_at AS at,
                pp.posting_id AS posting_id, pp.action AS action,
                NULL AS question, NULL AS answer
           FROM posting_participants pp
           JOIN postings p2 ON p2.id = pp.posting_id
          WHERE pp.user_id = $1 AND p2.creator_id <> $1
         UNION ALL
         SELECT 'question_answered' AS type, r.created_at AS at,
                NULL AS posting_id, NULL AS action,
                q.question AS question, r.answer AS answer
           FROM ai_question_responses r
           JOIN ai_questions q ON q.id = r.question_id
          WHERE r.user_id = $1
       ) combined
      ORDER BY at DESC
      LIMIT $2`,
      [id, limit]
    );

    const postingIds = [
      ...new Set(
        combined.rows
          .map((row) => row.posting_id)
          .filter((pid): pid is string => pid !== null)
      ),
    ];
    const postingMap = new Map<string, Posting>();
    if (postingIds.length > 0) {
      const inList = postingIds.map((_id, i) => `$${i + 1}`).join(", ");
      const pr = await db.query<Posting>(
        `SELECT * FROM postings WHERE id IN (${inList})`,
        [...postingIds]
      );
      for (const p of pr.rows) postingMap.set(p.id, p);
    }

    const activities: Activity[] = [];
    for (const row of combined.rows) {
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
      if (!posting) continue;
      if (row.type === "posting_created") {
        activities.push({ type: "posting_created", posting, at });
      } else {
        const action: ParticipantAction =
          row.action === "interested" || row.action === "online" ? row.action : "join";
        activities.push({ type: "posting_participated", posting, action, at });
      }
    }

    return c.json(activities);
  } catch (err) {
    console.error("GET /api/profiles/:id/activity error:", err);
    return c.json({ error: "Failed to load activity" }, 500);
  }
});

/** GET /api/profiles/:id/tags - public projection of a profile's tags with category. */
router.get("/:id/tags", async (c) => {
  const db = c.get("db");
  const r = await db.query<ProfilePublicTag>(
    `SELECT t.id AS tag_id, t.name, t.category
       FROM profile_tags pt
       JOIN tags t ON t.id = pt.tag_id
      WHERE pt.profile_id = $1
   ORDER BY t.category ASC, t.name ASC`,
    [c.req.param("id")]
  );
  return c.json(r.rows);
});

/** GET /api/profiles/:id - get profile by id (public) */
router.get("/:id", async (c) => {
  const db = c.get("db");
  const r = await db.query<Profile>(
    `SELECT ${PROFILE_SELECT} FROM profiles p WHERE p.id = $1`,
    [c.req.param("id")]
  );
  if (r.rows.length === 0) {
    return c.json({ error: "Profile not found" }, 404);
  }
  return c.json(r.rows[0]);
});

/** PUT /api/profiles/me - update current user's profile */
router.put("/me", requireAuth, async (c) => {
  const db = c.get("db");
  try {
    const userId = c.get("userId")!;
    const body = { ...((await c.req.json().catch(() => ({}))) as Partial<Profile>) };
    if (Object.prototype.hasOwnProperty.call(body, "joined_date")) {
      body.joined_date = normalizeDateOnlyInput(body.joined_date) as Profile["joined_date"];
    }

    if ("nickname" in body) {
      if (typeof body.nickname !== "string") {
        return c.json({ error: "nickname must be a string" }, 400);
      }
      body.nickname = body.nickname.trim();
      if (body.nickname.length > NICKNAME_MAX) {
        return c.json({ error: `nickname exceeds ${NICKNAME_MAX} chars` }, 400);
      }
    }

    // Postgres `text[]` rejected non-array values; D1 stores `areas` as TEXT and
    // would persist whatever is bound, so a later read could hydrate a string/
    // object and crash `.map`/`.join` consumers. Enforce the array-of-strings shape.
    if ("areas" in body) {
      if (!Array.isArray(body.areas) || !body.areas.every((a) => typeof a === "string")) {
        return c.json({ error: "areas must be an array of strings" }, 400);
      }
    }

    let parsedTopics: ConversationTopic[] | undefined;
    if ("conversation_topics" in body) {
      const parsed = parseConversationTopics(body.conversation_topics);
      if (!parsed.ok) {
        return c.json({ error: parsed.error }, 400);
      }
      parsedTopics = parsed.value;
    }

    const scalarCols = [
      "name", "nickname", "avatar_url", "role", "areas", "job_type", "ai_intro", "joined_date",
    ] as const;

    // D1 has no interactive transactions; statements run sequentially.
    const exists = await db.query("SELECT 1 FROM profiles WHERE id = $1", [userId]);
    if (exists.rows.length === 0) {
      return c.json({ error: "Profile not found" }, 404);
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
      updates.push(`conversation_topics = $${i}`);
      updates.push(
        `conversation_topics_updated_at = CASE
           WHEN conversation_topics IS DISTINCT FROM $${i} THEN now()
           ELSE conversation_topics_updated_at
         END`
      );
      values.push(JSON.stringify(parsedTopics));
      i++;
    }
    if (updates.length > 0) {
      // Postgres bumped updated_at via a BEFORE UPDATE trigger; D1 has none, so
      // do it here whenever a profiles-row update actually runs.
      updates.push("updated_at = now()");
      values.push(userId);
      await db.query(
        `UPDATE profiles SET ${updates.join(", ")} WHERE id = $${i}`,
        values
      );
    }

    if ("tags" in body) {
      const rawTags: unknown[] = Array.isArray(body.tags) ? body.tags : [];
      await syncProfileTags(db, userId, rawTags);
    }

    const r = await db.query<Profile>(
      `SELECT ${PROFILE_SELECT} FROM profiles p WHERE p.id = $1`,
      [userId]
    );
    return c.json(r.rows[0]);
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("joined_date")) {
      return c.json({ error: err.message }, 400);
    }
    console.error("PUT /api/profiles/me error:", err);
    return c.json({ error: "Failed to update profile" }, 500);
  }
});

export default router;
