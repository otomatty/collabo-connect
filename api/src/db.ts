/**
 * D1-backed, pg-compatible query layer.
 *
 * The original API was written against `pg` (Railway Postgres): handlers call
 * `pool.query(text, params)` with `$1` placeholders and read `{ rows, rowCount }`,
 * and a few flows open an interactive transaction via `pool.connect()` +
 * `BEGIN/COMMIT/ROLLBACK`. Cloudflare D1 is SQLite with a different driver shape,
 * so this module provides a thin compatibility surface that keeps the call sites
 * almost identical while translating the dialect differences that can be handled
 * generically:
 *
 *   - `$n` placeholders            → positional `?` (params reordered/duplicated)
 *   - `public.` schema prefix      → stripped (SQLite has no schemas)
 *   - `::type` / `::type[]` casts   → stripped
 *   - `now()`                       → ISO-8601 UTC via strftime
 *   - `ILIKE`                       → `LIKE` (ASCII case-insensitive in SQLite)
 *   - `IS [NOT] DISTINCT FROM`      → `IS [NOT]` (null-safe in SQLite)
 *   - `FOR UPDATE` / `NULLS LAST`   → removed (no-ops on D1's serialized writes)
 *
 * Array/JSON columns (`text[]`, `jsonb`) become TEXT holding JSON. Writes that
 * bind a JS array/object are JSON-stringified here; reads auto-parse a known set
 * of JSON columns and coerce integer booleans back to real booleans, so handler
 * code keeps seeing the same `string[]` / `boolean` shapes it did under pg.
 *
 * Structural Postgres-only constructs that can't be rewritten generically
 * (`= ANY($n)`, `unnest(...)`, data-modifying CTEs, `to_jsonb`/`row_to_json`,
 * `jsonb_build_object`, the `get_profile_tags` SQL function) are rewritten at the
 * call sites instead.
 */

export interface QueryResult<T = Record<string, unknown>> {
  rows: T[];
  rowCount: number;
}

export interface DbClient {
  query<T = Record<string, unknown>>(
    sql: string,
    params?: unknown[]
  ): Promise<QueryResult<T>>;
}

export interface Db extends DbClient {
  /** Interactive-transaction shim. D1 has no interactive transactions, so the
   *  returned client shares the same connection and BEGIN/COMMIT/ROLLBACK are
   *  treated as no-ops. Writes are still serialized by D1. */
  connect(): Promise<DbClient & { release(): void }>;
}

/** Columns whose stored TEXT holds JSON and should be parsed on read. */
const JSON_COLUMNS = new Set([
  "areas",
  "aliases",
  "options",
  "conversation_topics",
  "tags",
  "tag",
  "profile",
  "question",
]);

/** Columns stored as 0/1 integers that should read back as real booleans. */
const BOOLEAN_COLUMNS = new Set(["date_undecided", "is_online"]);

const ISO_NOW = "(strftime('%Y-%m-%dT%H:%M:%fZ','now'))";

/** Apply the generically-translatable Postgres → SQLite dialect fixes. */
function translateSql(sql: string): string {
  return sql
    .replace(/\bpublic\./g, "")
    .replace(/::\s*\w+(\s*\[\s*\])?/g, "")
    .replace(/\bIS\s+NOT\s+DISTINCT\s+FROM\b/gi, "IS")
    .replace(/\bIS\s+DISTINCT\s+FROM\b/gi, "IS NOT")
    .replace(/\bILIKE\b/gi, "LIKE")
    .replace(/\bFOR\s+UPDATE\b/gi, "")
    .replace(/\bNULLS\s+(LAST|FIRST)\b/gi, "")
    .replace(/\bnow\(\)/gi, ISO_NOW);
}

/** Rewrite `$1, $2, ...` to positional `?`, duplicating reused params in order. */
function bindParams(sql: string, params: unknown[]): { text: string; binds: unknown[] } {
  const binds: unknown[] = [];
  const text = sql.replace(/\$(\d+)/g, (_m, n: string) => {
    const index = Number(n) - 1;
    if (index < 0 || index >= params.length) {
      // pg fails loudly on a placeholder/params mismatch; mirror that instead of
      // silently binding undefined→NULL, which would run a different query.
      throw new Error(`Missing SQL parameter $${n}`);
    }
    binds.push(params[index]);
    return "?";
  });
  return { text, binds };
}

/** Coerce a JS value into a D1-bindable primitive. */
function coerceBind(value: unknown): unknown {
  if (value === undefined || value === null) return null;
  if (typeof value === "boolean") return value ? 1 : 0;
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value) || typeof value === "object") return JSON.stringify(value);
  return value;
}

/** Parse JSON columns and coerce integer booleans on a result row. */
function hydrateRow<T>(row: Record<string, unknown>): T {
  for (const key of Object.keys(row)) {
    const value = row[key];
    if (JSON_COLUMNS.has(key) && typeof value === "string") {
      const trimmed = value.trimStart();
      if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
        try {
          row[key] = JSON.parse(value);
        } catch {
          // Not JSON after all (e.g. an activity row's plain `question` text) —
          // leave the original string untouched.
        }
      }
    } else if (BOOLEAN_COLUMNS.has(key) && typeof value === "number") {
      row[key] = value !== 0;
    }
  }
  return row as T;
}

function isTransactionControl(sql: string): boolean {
  const t = sql.trim().toUpperCase().replace(/;$/, "");
  return t === "BEGIN" || t === "COMMIT" || t === "ROLLBACK";
}

/** Build a comma-separated `$n` placeholder list for an `IN (...)` clause.
 *  Returns the clause body and the values to append to the params array.
 *  `startIndex` is the next free `$n` index (1-based). */
export function buildInClause(
  values: unknown[],
  startIndex: number
): { placeholders: string; params: unknown[] } {
  const placeholders = values.map((_v, i) => `$${startIndex + i}`).join(", ");
  return { placeholders, params: values };
}

/** Wrap a D1 database in the pg-compatible query interface. */
export function createDb(d1: D1Database): Db {
  async function query<T = Record<string, unknown>>(
    sql: string,
    params: unknown[] = []
  ): Promise<QueryResult<T>> {
    if (isTransactionControl(sql)) {
      return { rows: [], rowCount: 0 };
    }
    const { text, binds } = bindParams(translateSql(sql), params);
    const stmt = d1.prepare(text).bind(...binds.map(coerceBind));
    const result = await stmt.all<Record<string, unknown>>();
    const rows = (result.results ?? []).map((r) => hydrateRow<T>(r));
    const changes = result.meta?.changes ?? 0;
    return { rows, rowCount: changes !== 0 ? changes : rows.length };
  }

  async function connect() {
    return { query, release() {} };
  }

  return { query, connect };
}
