/**
 * SQL fragment builders shared across routes.
 *
 * These replace Postgres-only constructs that the generic db translator can't
 * handle: the `public.get_profile_tags(id)` SQL function and the
 * `to_jsonb` / `jsonb_build_object` projections used to embed a related row.
 */

/**
 * Correlated subquery that returns a profile's tag names as a JSON array,
 * replacing the Postgres `get_profile_tags(id)` function. `idExpr` is the SQL
 * expression for the profile id (e.g. `"p.id"`). Hydrated back to `string[]`
 * by the db layer (the `tags` column is in its JSON allowlist).
 */
export function profileTagsSubquery(idExpr: string): string {
  return `coalesce((SELECT json_group_array(name) FROM (SELECT t.name FROM profile_tags pt JOIN tags t ON t.id = pt.tag_id WHERE pt.profile_id = ${idExpr} ORDER BY t.name)), '[]')`;
}

/**
 * `json_object(...)` projection of a tags row (replacing `to_jsonb(t.*)`).
 * `aliases` is wrapped in `json()` so it embeds as a nested array rather than a
 * JSON string. Yields NULL when the row is absent (LEFT JOIN miss).
 */
export function tagJsonObject(alias: string): string {
  return `CASE WHEN ${alias}.id IS NULL THEN NULL ELSE json_object(
    'id', ${alias}.id,
    'name', ${alias}.name,
    'aliases', json(coalesce(${alias}.aliases, '[]')),
    'category', ${alias}.category,
    'usage_count', ${alias}.usage_count,
    'created_by', ${alias}.created_by,
    'created_at', ${alias}.created_at,
    'updated_at', ${alias}.updated_at
  ) END`;
}

/**
 * `json_object(...)` projection of an ai_questions row (replacing
 * `row_to_json(q)`). `options` embeds as a nested array via `json()`.
 */
export function aiQuestionJsonObject(alias: string): string {
  return `CASE WHEN ${alias}.id IS NULL THEN NULL ELSE json_object(
    'id', ${alias}.id,
    'question', ${alias}.question,
    'options', json(coalesce(${alias}.options, '[]')),
    'date', ${alias}.date,
    'created_at', ${alias}.created_at
  ) END`;
}
