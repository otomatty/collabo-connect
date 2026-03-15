/**
 * カンマ区切りの環境変数（CORS_ORIGINS, BETTER_AUTH_TRUSTED_ORIGINS など）を
 * 配列にパースする。空白・引用符・空要素を除去する。
 */
export function parseCommaSeparatedList(value: string | undefined): string[] {
  if (value === undefined || value === "") return [];
  return value
    .split(",")
    .map((s) => s.trim().replace(/^["']|["']$/g, "").trim())
    .filter((s) => s.length > 0);
}
