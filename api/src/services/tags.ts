import type { PoolClient } from "pg";
import { pool } from "../db.js";
import type { Tag, TagCategory } from "../types.js";

export const TAG_CATEGORIES: TagCategory[] = [
  "skill",
  "hobby",
  "area",
  "role",
  "other",
];

export function isTagCategory(v: unknown): v is TagCategory {
  return typeof v === "string" && (TAG_CATEGORIES as string[]).includes(v);
}

/** Normalize a raw tag input: trim and collapse internal whitespace. Empty strings return null. */
export function normalizeTagName(raw: string): string | null {
  const trimmed = raw.trim().replace(/\s+/g, " ");
  return trimmed === "" ? null : trimmed;
}

/**
 * Find a tag row by name or alias, case-insensitively.
 * Ensures "React" / "react" / "REACT" resolve to the same canonical entry.
 */
export async function findTagByName(
  client: PoolClient | typeof pool,
  name: string
): Promise<Tag | null> {
  const r = await client.query<Tag>(
    `SELECT *
       FROM public.tags
      WHERE lower(name) = lower($1)
         OR EXISTS (
              SELECT 1 FROM unnest(coalesce(aliases, '{}'::text[])) a
               WHERE lower(a) = lower($1)
            )
      LIMIT 1`,
    [name]
  );
  return r.rows[0] ?? null;
}

/**
 * Ensure a tag exists by name. If missing, INSERT it with the given category and creator.
 *
 * Uses a CTE with ON CONFLICT DO NOTHING and a fallback SELECT so that a race
 * between two concurrent upserts never performs an unnecessary UPDATE (which
 * would bump updated_at pointlessly) and always returns the resulting row.
 * The uniqueness target is `(lower(name))` — see the case-insensitive unique
 * index `tags_name_lower_unique_idx` in schema.sql.
 */
export async function upsertTag(
  client: PoolClient | typeof pool,
  name: string,
  opts: { category?: TagCategory; createdBy?: string | null } = {}
): Promise<Tag> {
  const existing = await findTagByName(client, name);
  if (existing) return existing;
  const r = await client.query<Tag>(
    `WITH ins AS (
       INSERT INTO public.tags (name, category, created_by)
            VALUES ($1, $2, $3)
       ON CONFLICT ((lower(name))) DO NOTHING
       RETURNING *
     )
     SELECT * FROM ins
     UNION ALL
     SELECT * FROM public.tags
      WHERE lower(name) = lower($1)
        AND NOT EXISTS (SELECT 1 FROM ins)
     LIMIT 1`,
    [name, opts.category ?? "other", opts.createdBy ?? null]
  );
  return r.rows[0];
}

/**
 * Replace a user's profile_tags with the given list of names.
 *
 * Preserves source metadata of tags that remain (e.g. a previously auto-applied
 * tag stays marked "auto" if the user keeps it). New rows are inserted with
 * source = "manual" since this path is driven by the profile editor.
 *
 * Also bumps tags.usage_count so popular-tag ranking stays accurate.
 */
export async function syncProfileTags(
  client: PoolClient,
  userId: string,
  rawNames: string[]
): Promise<void> {
  const names = Array.from(
    new Set(
      rawNames
        .map(normalizeTagName)
        .filter((n): n is string => n !== null)
    )
  );

  const tagIds: string[] = [];
  for (const name of names) {
    const tag = await upsertTag(client, name, { createdBy: userId });
    tagIds.push(tag.id);
  }

  const current = await client.query<{ tag_id: string }>(
    "SELECT tag_id FROM public.profile_tags WHERE profile_id = $1",
    [userId]
  );
  const currentIds = new Set(current.rows.map((r) => r.tag_id));
  const nextIds = new Set(tagIds);

  const toDelete = [...currentIds].filter((id) => !nextIds.has(id));
  const toInsert = [...nextIds].filter((id) => !currentIds.has(id));

  if (toDelete.length > 0) {
    await client.query(
      "DELETE FROM public.profile_tags WHERE profile_id = $1 AND tag_id = ANY($2::uuid[])",
      [userId, toDelete]
    );
  }
  if (toInsert.length > 0) {
    await client.query(
      `INSERT INTO public.profile_tags (profile_id, tag_id, source)
            SELECT $1, unnest($2::uuid[]), 'manual'
       ON CONFLICT (profile_id, tag_id) DO NOTHING`,
      [userId, toInsert]
    );
  }

  const changed = [...toDelete, ...toInsert];
  if (changed.length > 0) {
    await client.query(
      `UPDATE public.tags t
          SET usage_count = sub.cnt
         FROM (
           SELECT tag_id, count(*)::int AS cnt
             FROM public.profile_tags
            WHERE tag_id = ANY($1::uuid[])
            GROUP BY tag_id
         ) sub
        WHERE t.id = sub.tag_id`,
      [changed]
    );
    // Tags that no longer appear in profile_tags need usage_count = 0.
    await client.query(
      `UPDATE public.tags t
          SET usage_count = 0
        WHERE t.id = ANY($1::uuid[])
          AND NOT EXISTS (SELECT 1 FROM public.profile_tags pt WHERE pt.tag_id = t.id)`,
      [changed]
    );
  }
}
