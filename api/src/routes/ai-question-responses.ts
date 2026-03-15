import { Router, type Request, type Response } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import type { AiQuestion, AiQuestionResponse } from "../types.js";

const router = Router();

/** POST /api/ai-question-responses - body: { question_id, answer }. Upsert by (question_id, user_id). */
router.post("/", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId!;
  const { question_id: questionId, answer } = req.body;
  if (!questionId || typeof answer !== "string") {
    res.status(400).json({ error: "question_id and answer are required" });
    return;
  }
  await pool.query(
    `INSERT INTO public.ai_question_responses (question_id, user_id, answer)
     VALUES ($1, $2, $3)
     ON CONFLICT (question_id, user_id) DO UPDATE SET answer = $3`,
    [questionId, userId, answer.trim()]
  );
  const r = await pool.query<AiQuestionResponse>(
    "SELECT * FROM public.ai_question_responses WHERE question_id = $1 AND user_id = $2",
    [questionId, userId]
  );
  res.status(201).json(r.rows[0]);
});

/** PUT /api/ai-question-responses/:id - update own response */
router.put("/:id", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId!;
  const { id } = req.params;
  const { answer } = req.body;
  if (typeof answer !== "string") {
    res.status(400).json({ error: "answer is required" });
    return;
  }
  const r = await pool.query<AiQuestionResponse>(
    "UPDATE public.ai_question_responses SET answer = $1 WHERE id = $2 AND user_id = $3 RETURNING *",
    [answer.trim(), id, userId]
  );
  if (r.rows.length === 0) {
    res.status(404).json({ error: "Response not found" });
    return;
  }
  res.json(r.rows[0]);
});

/** GET /api/ai-question-responses/me - current user's responses with question (for "my responses" list) */
router.get("/me", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId!;
  const r = await pool.query(
    `SELECT r.*, row_to_json(q) as question
     FROM public.ai_question_responses r
     LEFT JOIN public.ai_questions q ON r.question_id = q.id
     WHERE r.user_id = $1
     ORDER BY r.created_at DESC`,
    [userId]
  );
  const rows = r.rows.map((row: { question: AiQuestion }) => ({
    ...row,
    question: row.question as AiQuestion,
  }));
  res.json(rows);
});

export default router;
