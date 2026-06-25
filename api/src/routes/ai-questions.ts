import { Hono } from "hono";
import { getTodayInJst } from "../date-utils.js";
import { requireAuth } from "../middleware/auth.js";
import { aiQuestionJsonObject } from "../sql-helpers.js";
import type { AppContext } from "../bindings.js";
import type { AiQuestion } from "../types.js";

const router = new Hono<AppContext>();

/** GET /api/ai-questions - list all, newest first */
router.get("/", async (c) => {
  const db = c.get("db");
  const r = await db.query<AiQuestion>(
    "SELECT * FROM ai_questions ORDER BY date DESC, created_at DESC"
  );
  return c.json(r.rows);
});

/** GET /api/ai-questions/today - single question for today (by date) */
router.get("/today", async (c) => {
  const db = c.get("db");
  const today = getTodayInJst();
  const r = await db.query<AiQuestion>(
    "SELECT * FROM ai_questions WHERE date = $1 LIMIT 1",
    [today]
  );
  if (r.rows.length === 0) {
    return c.json({ error: "No question for today" }, 404);
  }
  return c.json(r.rows[0]);
});

/** GET /api/ai-questions/:id */
router.get("/:id", async (c) => {
  const db = c.get("db");
  const r = await db.query<AiQuestion>("SELECT * FROM ai_questions WHERE id = $1", [
    c.req.param("id"),
  ]);
  if (r.rows.length === 0) {
    return c.json({ error: "Question not found" }, 404);
  }
  return c.json(r.rows[0]);
});

/** GET /api/ai-questions/:id/responses/me - current user's response for this question (auth) */
router.get("/:id/responses/me", requireAuth, async (c) => {
  const db = c.get("db");
  const userId = c.get("userId")!;
  const questionId = c.req.param("id");
  const r = await db.query(
    "SELECT * FROM ai_question_responses WHERE question_id = $1 AND user_id = $2",
    [questionId, userId]
  );
  if (r.rows.length === 0) {
    return c.json({ error: "Response not found" }, 404);
  }
  return c.json(r.rows[0]);
});

/** GET /api/ai-questions/:id/responses */
router.get("/:id/responses", async (c) => {
  const db = c.get("db");
  const questionId = c.req.param("id");
  const r = await db.query(
    `SELECT r.*, ${aiQuestionJsonObject("q")} as question
     FROM ai_question_responses r
     LEFT JOIN ai_questions q ON r.question_id = q.id
     WHERE r.question_id = $1 ORDER BY r.created_at DESC`,
    [questionId]
  );
  return c.json(r.rows);
});

export default router;
