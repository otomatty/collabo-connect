import type { DbClient } from "../db.js";
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

/**
 * Normalize a raw tag input into its canonical stored form.
 *
 * - Strips a leading hashtag marker (half-width `#` or full-width `＃`) plus any
 *   surrounding whitespace, so `"#React"`, `"＃React"` and `"# react"` all
 *   canonicalize to `"React"`. The `#` is purely a display affordance; it must
 *   not leak into `tags.name`, otherwise `#React` and `React` would coexist as
 *   separate rows and split search hits / usage_count (see issue #25).
 * - Trims surrounding whitespace and collapses internal runs to a single space.
 * - A trailing or internal `#` (e.g. `"C#"`) is preserved — only a *leading*
 *   marker is treated as decoration.
 *
 * Returns null when nothing meaningful remains (empty or marker-only input).
 */
export function normalizeTagName(raw: string): string | null {
  const normalized = raw
    .replace(/^[#＃\s]+/, "")
    .trim()
    .replace(/\s+/g, " ");
  return normalized === "" ? null : normalized;
}

/**
 * Find a tag row by name or alias, case-insensitively.
 * Ensures "React" / "react" / "REACT" resolve to the same canonical entry.
 */
export async function findTagByName(
  client: DbClient,
  name: string
): Promise<Tag | null> {
  const r = await client.query<Tag>(
    `SELECT *
       FROM tags
      WHERE lower(name) = lower($1)
         OR EXISTS (
              SELECT 1 FROM json_each(coalesce(aliases, '[]'))
               WHERE lower(value) = lower($1)
            )
      LIMIT 1`,
    [name]
  );
  return r.rows[0] ?? null;
}

/**
 * Ensure a tag exists by name. If missing, INSERT it with the given category and creator.
 *
 * The uniqueness target is the case-insensitive `tags_name_lower_unique_idx`
 * (an index on `lower(name)`). We INSERT ... ON CONFLICT DO NOTHING, then
 * re-resolve via findTagByName — a fresh statement so it also sees a row a
 * concurrent insert committed between our check and our insert.
 */
export async function upsertTag(
  client: DbClient,
  name: string,
  opts: { category?: TagCategory; createdBy?: string | null } = {}
): Promise<Tag> {
  const existing = await findTagByName(client, name);
  if (existing) return existing;
  await client.query(
    `INSERT INTO tags (name, category, created_by)
          VALUES ($1, $2, $3)
     ON CONFLICT (lower(name)) DO NOTHING`,
    [name, opts.category ?? "other", opts.createdBy ?? null]
  );
  const resolved = await findTagByName(client, name);
  if (resolved) return resolved;
  throw new Error(`upsertTag: failed to resolve tag "${name}"`);
}

/**
 * Replace a user's profile_tags with the given list of names.
 *
 * Preserves source metadata of tags that remain (e.g. a previously auto-applied
 * tag stays marked "auto" if the user keeps it). New rows are inserted with
 * source = "manual" since this path is driven by the profile editor.
 *
 * Also refreshes tags.usage_count for every affected tag so popular-tag ranking
 * stays accurate.
 */
export async function syncProfileTags(
  client: DbClient,
  userId: string,
  rawNames: unknown[]
): Promise<void> {
  // Defensive: body.tags is untrusted JSON, drop non-strings before normalizing.
  const names = Array.from(
    new Set(
      rawNames
        .filter((raw): raw is string => typeof raw === "string")
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
    "SELECT tag_id FROM profile_tags WHERE profile_id = $1",
    [userId]
  );
  const currentIds = new Set(current.rows.map((r) => r.tag_id));
  const nextIds = new Set(tagIds);

  const toDelete = [...currentIds].filter((id) => !nextIds.has(id));
  const toInsert = [...nextIds].filter((id) => !currentIds.has(id));

  if (toDelete.length > 0) {
    const inList = toDelete.map((_id, i) => `$${i + 2}`).join(", ");
    await client.query(
      `DELETE FROM profile_tags WHERE profile_id = $1 AND tag_id IN (${inList})`,
      [userId, ...toDelete]
    );
  }
  for (const tagId of toInsert) {
    await client.query(
      `INSERT INTO profile_tags (profile_id, tag_id, source)
            VALUES ($1, $2, 'manual')
       ON CONFLICT (profile_id, tag_id) DO NOTHING`,
      [userId, tagId]
    );
  }

  const changed = [...toDelete, ...toInsert];
  if (changed.length > 0) {
    // A correlated count handles both "still used → real count" and "no longer
    // used → 0" in a single statement.
    const inList = changed.map((_id, i) => `$${i + 1}`).join(", ");
    await client.query(
      `UPDATE tags
          SET usage_count = (SELECT count(*) FROM profile_tags pt WHERE pt.tag_id = tags.id)
        WHERE id IN (${inList})`,
      [...changed]
    );
  }
}
