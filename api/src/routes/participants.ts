import { Hono } from "hono";
import { requireAuth } from "../middleware/auth.js";
import { profileTagsSubquery } from "../sql-helpers.js";
import type { AppContext } from "../bindings.js";

const router = new Hono<AppContext>();

/** json_object projection of a participant's profile (replacing jsonb_build_object). */
const PARTICIPANT_PROFILE = `CASE
  WHEN pr.id IS NULL THEN NULL
  ELSE json_object(
    'id', pr.id,
    'name', pr.name,
    'avatar_url', pr.avatar_url,
    'role', pr.role,
    'areas', json(coalesce(pr.areas, '[]')),
    'job_type', pr.job_type,
    'ai_intro', pr.ai_intro,
    'joined_date', pr.joined_date,
    'created_at', pr.created_at,
    'updated_at', pr.updated_at,
    'tags', json(${profileTagsSubquery("pr.id")})
  )
END AS profile`;

/** GET /api/postings/:postingId/participants */
router.get("/:postingId/participants", async (c) => {
  const db = c.get("db");
  const r = await db.query(
    `SELECT pp.*, ${PARTICIPANT_PROFILE}
       FROM posting_participants pp
       LEFT JOIN profiles pr ON pp.user_id = pr.id
      WHERE pp.posting_id = $1`,
    [c.req.param("postingId")]
  );
  return c.json(r.rows);
});

/** POST /api/postings/:postingId/participants - body: { action: 'join'|'interested'|'online' } */
router.post("/:postingId/participants", requireAuth, async (c) => {
  const db = c.get("db");
  const userId = c.get("userId")!;
  const postingId = c.req.param("postingId");
  const body = (await c.req.json().catch(() => ({}))) as { action?: string };
  const action = body.action;
  if (!action || !["join", "interested", "online"].includes(action)) {
    return c.json({ error: "action must be join, interested, or online" }, 400);
  }
  await db.query(
    `INSERT INTO posting_participants (posting_id, user_id, action)
     VALUES ($1, $2, $3)
     ON CONFLICT (posting_id, user_id) DO UPDATE SET action = $3`,
    [postingId, userId, action]
  );
  const r = await db.query(
    "SELECT * FROM posting_participants WHERE posting_id = $1 AND user_id = $2",
    [postingId, userId]
  );
  return c.json(r.rows[0], 201);
});

/** PUT /api/postings/:postingId/participants/me - update own participation */
router.put("/:postingId/participants/me", requireAuth, async (c) => {
  const db = c.get("db");
  const userId = c.get("userId")!;
  const postingId = c.req.param("postingId");
  const body = (await c.req.json().catch(() => ({}))) as { action?: string };
  const action = body.action;
  if (!action || !["join", "interested", "online"].includes(action)) {
    return c.json({ error: "action must be join, interested, or online" }, 400);
  }
  const r = await db.query(
    "UPDATE posting_participants SET action = $1 WHERE posting_id = $2 AND user_id = $3 RETURNING *",
    [action, postingId, userId]
  );
  if (r.rows.length === 0) {
    return c.json({ error: "Participation not found" }, 404);
  }
  return c.json(r.rows[0]);
});

/** DELETE /api/postings/:postingId/participants/me */
router.delete("/:postingId/participants/me", requireAuth, async (c) => {
  const db = c.get("db");
  const userId = c.get("userId")!;
  const postingId = c.req.param("postingId");
  const r = await db.query(
    "DELETE FROM posting_participants WHERE posting_id = $1 AND user_id = $2 RETURNING id",
    [postingId, userId]
  );
  if (r.rowCount === 0) {
    return c.json({ error: "Participation not found" }, 404);
  }
  return c.body(null, 204);
});

export default router;
