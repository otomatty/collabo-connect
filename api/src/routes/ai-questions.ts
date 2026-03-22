import { Router, type Request, type Response } from "express";
import { pool } from "../db.js";
import { getTodayInJst } from "../date-utils.js";
import { requireAuth } from "../middleware/auth.js";
import type { AiQuestion } from "../types.js";

const router = Router();

/** GET /api/ai-questions - list all, newest first */
router.get("/", async (_req: Request, res: Response): Promise<void> => {
  const r = await pool.query<AiQuestion>(
    "SELECT * FROM public.ai_questions ORDER BY date DESC, created_at DESC"
  );
  res.json(r.rows);
});

/** GET /api/ai-questions/today - single question for today (by date) */
router.get("/today", async (_req: Request, res: Response): Promise<void> => {
  const today = getTodayInJst();
  const r = await pool.query<AiQuestion>(
    "SELECT * FROM public.ai_questions WHERE date = $1 LIMIT 1",
    [today]
  );
  if (r.rows.length === 0) {
    res.status(404).json({ error: "No question for today" });
    return;
  }
  res.json(r.rows[0]);
});

/** GET /api/ai-questions/:id */
router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const r = await pool.query<AiQuestion>("SELECT * FROM public.ai_questions WHERE id = $1", [id]);
  if (r.rows.length === 0) {
    res.status(404).json({ error: "Question not found" });
    return;
  }
  res.json(r.rows[0]);
});

/** GET /api/ai-questions/:id/responses/me - current user's response for this question (auth) */
router.get("/:id/responses/me", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId!;
  const { id: questionId } = req.params;
  const r = await pool.query(
    "SELECT * FROM public.ai_question_responses WHERE question_id = $1 AND user_id = $2",
    [questionId, userId]
  );
  if (r.rows.length === 0) {
    res.status(404).json({ error: "Response not found" });
    return;
  }
  res.json(r.rows[0]);
});

/** GET /api/ai-questions/:id/responses */
router.get("/:id/responses", async (req: Request, res: Response): Promise<void> => {
  const { id: questionId } = req.params;
  const r = await pool.query(
    `SELECT r.*, row_to_json(q) as question
     FROM public.ai_question_responses r
     LEFT JOIN public.ai_questions q ON r.question_id = q.id
     WHERE r.question_id = $1 ORDER BY r.created_at DESC`,
    [questionId]
  );
  res.json(r.rows);
});

export default router;
