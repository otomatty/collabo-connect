import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { SuggestedTag, Tag } from "@/types/tags";

/**
 * `GET /api/suggested-tags` に対応するレスポンス。`tag` は既存タグへの参照を
 * 持つ場合のみ非 null。`proposed_name` のみのケース（辞書未登録の新規タグ）は
 * `tag` が null となり、シート側では `proposed_name` を表示する。
 */
export interface SuggestedTagWithTag extends SuggestedTag {
  tag: Tag | null;
}

/**
 * Pending 候補は API 側で `parseLimit` の上限が 100 まで。バッジ件数の
 * 過小報告を避けるため、最大値を明示的に指定する。100 件超えのケースは
 * 想定しないが、将来必要になればページネーション対応する。
 */
const PENDING_PAGE_LIMIT = 100;

/**
 * QueryClient はセッション間で共有されるため、user-scoped にキャッシュキーを
 * 切る。ID をキーに含めないと、ログアウト→別ユーザーログイン直後に前
 * ユーザーの pending 候補が一瞬見えてしまう。
 */
function pendingKey(userId: string | undefined) {
  return ["suggested-tags", "pending", userId ?? "anon"] as const;
}

/** Pending な候補タグ一覧を取得（自分の分のみ）。 */
export function useSuggestedTags(userId: string | undefined) {
  return useQuery<SuggestedTagWithTag[]>({
    queryKey: pendingKey(userId),
    queryFn: () =>
      apiFetch<SuggestedTagWithTag[]>(
        `/api/suggested-tags?status=pending&limit=${PENDING_PAGE_LIMIT}`
      ),
    enabled: !!userId,
  });
}

/**
 * 共通のキャッシュ無効化処理。承認/却下のいずれでも以下を更新する：
 *  - 候補タグ一覧（行が消えるべき）
 *  - 自分のプロフィール（承認時はタグが追加されるため `tags` が変わる）
 *  - profile_tags の詳細（NEW バッジ判定に使う）
 *  - 全プロフィール一覧（メンバー検索画面のキャッシュ）
 *
 * いずれもプレフィックス指定で invalidate しているため、user-scoped な
 * 変種（`[..., userId]` を末尾に持つキー）も自動的に対象になる。
 */
function useInvalidateSuggestionCaches() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["suggested-tags"] });
    queryClient.invalidateQueries({ queryKey: ["profiles"] });
  };
}

/** 候補タグを承認するミューテーション。 */
export function useAcceptSuggestedTag() {
  const invalidate = useInvalidateSuggestionCaches();
  return useMutation<SuggestedTag, Error, string>({
    mutationFn: (id: string) =>
      apiFetch<SuggestedTag>(`/api/suggested-tags/${id}/accept`, {
        method: "POST",
      }),
    onSuccess: invalidate,
  });
}

/** 候補タグを却下するミューテーション。 */
export function useRejectSuggestedTag() {
  const invalidate = useInvalidateSuggestionCaches();
  return useMutation<SuggestedTag, Error, string>({
    mutationFn: (id: string) =>
      apiFetch<SuggestedTag>(`/api/suggested-tags/${id}/reject`, {
        method: "POST",
      }),
    onSuccess: invalidate,
  });
}
