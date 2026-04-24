import { Router, type Request, type Response } from "express";
import { pool } from "../db.js";
import { normalizeDateOnlyInput } from "../date-utils.js";
import { requireAuth } from "../middleware/auth.js";
import { syncProfileTags } from "../services/tags.js";
import type { Profile } from "../types.js";

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

    const scalarCols = [
      "name", "avatar_url", "role", "areas", "job_type", "ai_intro", "joined_date",
    ] as const;

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

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
      if (updates.length > 0) {
        values.push(userId);
        await client.query(
          `UPDATE public.profiles SET ${updates.join(", ")} WHERE id = $${i}`,
          values
        );
      }

      if ("tags" in body && Array.isArray(body.tags)) {
        await syncProfileTags(client, userId, body.tags as string[]);
      }

      const r = await client.query<Profile>(
        `SELECT ${PROFILE_SELECT} FROM public.profiles p WHERE p.id = $1`,
        [userId]
      );
      if (r.rows.length === 0) {
        await client.query("ROLLBACK");
        res.status(404).json({ error: "Profile not found" });
        return;
      }
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
