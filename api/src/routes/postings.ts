import { Router, type Request, type Response } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import type { Posting, Profile, PostingParticipant, PostingWithDetails } from "../types.js";

const router = Router();

async function enrichPostings(postings: Posting[]): Promise<PostingWithDetails[]> {
  if (postings.length === 0) return [];
  const ids = postings.map((p) => p.id);
  const creatorIds = [...new Set(postings.map((p) => p.creator_id))];
  const ppRows = await pool.query<PostingParticipant>(
    "SELECT * FROM public.posting_participants WHERE posting_id = ANY($1)",
    [ids]
  );
  const participantUserIds = [...new Set(ppRows.rows.map((p) => p.user_id))];
  const allUserIds = [...new Set([...creatorIds, ...participantUserIds])];
  const profilesRows = await pool.query<Profile>(
    "SELECT p.*, public.get_profile_tags(p.id) AS tags FROM public.profiles p WHERE p.id = ANY($1)",
    [allUserIds]
  );
  const profileMap = new Map(profilesRows.rows.map((r) => [r.id, r]));
  const participantsByPosting = new Map<string, (PostingParticipant & { profile: Profile | null })[]>();
  for (const pp of ppRows.rows) {
    const list = participantsByPosting.get(pp.posting_id) ?? [];
    list.push({ ...pp, profile: profileMap.get(pp.user_id) ?? null });
    participantsByPosting.set(pp.posting_id, list);
  }
  return postings.map((p) => ({
    ...p,
    creator: profileMap.get(p.creator_id) ?? null,
    participants: participantsByPosting.get(p.id) ?? [],
  }));
}

/** GET /api/postings/mine - postings created by or participated in by current user */
router.get("/mine", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId!;
  const created = await pool.query<Posting>(
    "SELECT * FROM public.postings WHERE creator_id = $1 ORDER BY created_at DESC",
    [userId]
  );
  const participated = await pool.query<{ posting_id: string }>(
    "SELECT posting_id FROM public.posting_participants WHERE user_id = $1",
    [userId]
  );
  const createdIds = new Set(created.rows.map((p) => p.id));
  const otherIds = participated.rows.map((p) => p.posting_id).filter((id) => !createdIds.has(id));
  let allRows = [...created.rows];
  if (otherIds.length > 0) {
    const other = await pool.query<Posting>(
      "SELECT * FROM public.postings WHERE id = ANY($1) ORDER BY created_at DESC",
      [otherIds]
    );
    allRows = [...allRows, ...other.rows];
  }
  const enriched = await enrichPostings(allRows);
  res.json(enriched);
});

/** GET /api/postings?category=food|study|event - list (category optional) */
router.get("/", async (req: Request, res: Response): Promise<void> => {
  const category = req.query.category as string | undefined;
  let q = "SELECT * FROM public.postings ORDER BY created_at DESC";
  const params: string[] = [];
  if (category && category !== "all") {
    params.push(category);
    q = "SELECT * FROM public.postings WHERE category = $1 ORDER BY created_at DESC";
  }
  const r = await pool.query<Posting>(q, params);
  const enriched = await enrichPostings(r.rows);
  res.json(enriched);
});

/** GET /api/postings/:id */
router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const r = await pool.query<Posting>("SELECT * FROM public.postings WHERE id = $1", [id]);
  if (r.rows.length === 0) {
    res.status(404).json({ error: "Posting not found" });
    return;
  }
  const [enriched] = await enrichPostings(r.rows);
  res.json(enriched);
});

/** POST /api/postings */
router.post("/", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId!;
  const { title, category, date, date_undecided, area, is_online, description } = req.body;
  if (!title || !category || !area) {
    res.status(400).json({ error: "title, category, area are required" });
    return;
  }
  const r = await pool.query<Posting>(
    `INSERT INTO public.postings (title, category, date, date_undecided, area, is_online, description, creator_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      title,
      category,
      date ?? null,
      date_undecided ?? false,
      area,
      is_online ?? false,
      description ?? "",
      userId,
    ]
  );
  const [enriched] = await enrichPostings(r.rows);
  res.status(201).json(enriched);
});

/** PUT /api/postings/:id - creator only */
router.put("/:id", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId!;
  const { id } = req.params;
  const check = await pool.query<Posting>("SELECT * FROM public.postings WHERE id = $1", [id]);
  if (check.rows.length === 0) {
    res.status(404).json({ error: "Posting not found" });
    return;
  }
  if (check.rows[0].creator_id !== userId) {
    res.status(403).json({ error: "Only creator can update" });
    return;
  }
  const body = req.body as Record<string, unknown>;
  const allowed = ["title", "category", "date", "date_undecided", "area", "is_online", "description"] as const;
  const updates: string[] = [];
  const values: unknown[] = [];
  let i = 1;
  for (const key of allowed) {
    if (key in body) {
      updates.push(`${key} = $${i}`);
      values.push(body[key]);
      i++;
    }
  }
  if (updates.length === 0) {
    const [enriched] = await enrichPostings(check.rows);
    res.json(enriched);
    return;
  }
  values.push(id);
  const q = `UPDATE public.postings SET ${updates.join(", ")} WHERE id = $${i} RETURNING *`;
  const r = await pool.query<Posting>(q, values);
  const [enriched] = await enrichPostings(r.rows);
  res.json(enriched);
});

/** DELETE /api/postings/:id - creator only */
router.delete("/:id", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId!;
  const { id } = req.params;
  const r = await pool.query("DELETE FROM public.postings WHERE id = $1 AND creator_id = $2 RETURNING id", [id, userId]);
  if (r.rowCount === 0) {
    res.status(404).json({ error: "Posting not found or not creator" });
    return;
  }
  res.status(204).send();
});

export default router;
