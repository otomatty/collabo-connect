import { Hono } from "hono";
import { requireAuth } from "../middleware/auth.js";
import { aiQuestionJsonObject } from "../sql-helpers.js";
import type { AppContext } from "../bindings.js";
import type { AiQuestionResponse } from "../types.js";

const router = new Hono<AppContext>();

/** POST /api/ai-question-responses - body: { question_id, answer }. Upsert by (question_id, user_id). */
router.post("/", requireAuth, async (c) => {
  const db = c.get("db");
  const userId = c.get("userId")!;
  const body = (await c.req.json().catch(() => ({}))) as {
    question_id?: string;
    answer?: unknown;
  };
  const questionId = body.question_id;
  const answer = body.answer;
  if (!questionId || typeof answer !== "string" || !answer.trim()) {
    return c.json({ error: "question_id and answer are required" }, 400);
  }
  await db.query(
    `INSERT INTO ai_question_responses (question_id, user_id, answer)
     VALUES ($1, $2, $3)
     ON CONFLICT (question_id, user_id) DO UPDATE SET answer = $3`,
    [questionId, userId, answer.trim()]
  );
  const r = await db.query<AiQuestionResponse>(
    "SELECT * FROM ai_question_responses WHERE question_id = $1 AND user_id = $2",
    [questionId, userId]
  );
  return c.json(r.rows[0], 201);
});

/** PUT /api/ai-question-responses/:id - update own response */
router.put("/:id", requireAuth, async (c) => {
  const db = c.get("db");
  const userId = c.get("userId")!;
  const id = c.req.param("id");
  const body = (await c.req.json().catch(() => ({}))) as { answer?: unknown };
  if (typeof body.answer !== "string" || !body.answer.trim()) {
    return c.json({ error: "answer is required" }, 400);
  }
  const r = await db.query<AiQuestionResponse>(
    "UPDATE ai_question_responses SET answer = $1 WHERE id = $2 AND user_id = $3 RETURNING *",
    [body.answer.trim(), id, userId]
  );
  if (r.rows.length === 0) {
    return c.json({ error: "Response not found" }, 404);
  }
  return c.json(r.rows[0]);
});

/** GET /api/ai-question-responses/me - current user's responses with question */
router.get("/me", requireAuth, async (c) => {
  const db = c.get("db");
  const userId = c.get("userId")!;
  const r = await db.query(
    `SELECT r.*, ${aiQuestionJsonObject("q")} as question
     FROM ai_question_responses r
     LEFT JOIN ai_questions q ON r.question_id = q.id
     WHERE r.user_id = $1
     ORDER BY r.created_at DESC`,
    [userId]
  );
  return c.json(r.rows);
});

export default router;
