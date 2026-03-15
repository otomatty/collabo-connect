import { Router, type Request, type Response } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

/** GET /api/postings/:postingId/participants */
router.get("/:postingId/participants", async (req: Request, res: Response): Promise<void> => {
  const { postingId } = req.params;
  const r = await pool.query(
    `SELECT pp.*, row_to_json(pr) as profile
     FROM public.posting_participants pp
     LEFT JOIN public.profiles pr ON pp.user_id = pr.id
     WHERE pp.posting_id = $1`,
    [postingId]
  );
  const rows = r.rows.map((row: { profile: unknown }) => ({
    ...row,
    profile: row.profile,
  }));
  res.json(rows);
});

/** POST /api/postings/:postingId/participants - body: { action: 'join'|'interested'|'online' } */
router.post("/:postingId/participants", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId!;
  const { postingId } = req.params;
  const { action } = req.body;
  if (!["join", "interested", "online"].includes(action)) {
    res.status(400).json({ error: "action must be join, interested, or online" });
    return;
  }
  await pool.query(
    `INSERT INTO public.posting_participants (posting_id, user_id, action)
     VALUES ($1, $2, $3)
     ON CONFLICT (posting_id, user_id) DO UPDATE SET action = $3`,
    [postingId, userId, action]
  );
  const r = await pool.query(
    "SELECT * FROM public.posting_participants WHERE posting_id = $1 AND user_id = $2",
    [postingId, userId]
  );
  res.status(201).json(r.rows[0]);
});

/** PUT /api/postings/:postingId/participants/me - update own participation */
router.put("/:postingId/participants/me", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId!;
  const { postingId } = req.params;
  const { action } = req.body;
  if (!["join", "interested", "online"].includes(action)) {
    res.status(400).json({ error: "action must be join, interested, or online" });
    return;
  }
  const r = await pool.query(
    `UPDATE public.posting_participants SET action = $1 WHERE posting_id = $2 AND user_id = $3 RETURNING *`,
    [action, postingId, userId]
  );
  if (r.rows.length === 0) {
    res.status(404).json({ error: "Participation not found" });
    return;
  }
  res.json(r.rows[0]);
});

/** DELETE /api/postings/:postingId/participants/me */
router.delete("/:postingId/participants/me", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId!;
  const { postingId } = req.params;
  const r = await pool.query(
    "DELETE FROM public.posting_participants WHERE posting_id = $1 AND user_id = $2 RETURNING id",
    [postingId, userId]
  );
  if (r.rowCount === 0) {
    res.status(404).json({ error: "Participation not found" });
    return;
  }
  res.status(204).send();
});

export default router;
