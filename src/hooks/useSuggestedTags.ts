import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { SuggestedTag, Tag } from "@/types/tags";
import { MY_PROFILE_TAG_DETAILS_KEY } from "./useProfiles";

/**
 * `GET /api/suggested-tags` に対応するレスポンス。`tag` は既存タグへの参照を
 * 持つ場合のみ非 null。`proposed_name` のみのケース（辞書未登録の新規タグ）は
 * `tag` が null となり、シート側では `proposed_name` を表示する。
 */
export interface SuggestedTagWithTag extends SuggestedTag {
  tag: Tag | null;
}

const PENDING_KEY = ["suggested-tags", "pending"] as const;

/** Pending な候補タグ一覧を取得（自分の分のみ）。 */
export function useSuggestedTags() {
  return useQuery<SuggestedTagWithTag[]>({
    queryKey: PENDING_KEY,
    queryFn: () =>
      apiFetch<SuggestedTagWithTag[]>("/api/suggested-tags?status=pending"),
  });
}

/**
 * 共通のキャッシュ無効化処理。承認/却下のいずれでも以下を更新する：
 *  - 候補タグ一覧（行が消えるべき）
 *  - 自分のプロフィール（承認時はタグが追加されるため `tags` が変わる）
 *  - profile_tags の詳細（NEW バッジ判定に使う）
 *  - 全プロフィール一覧（メンバー検索画面のキャッシュ）
 */
function useInvalidateSuggestionCaches() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: PENDING_KEY });
    queryClient.invalidateQueries({ queryKey: ["profiles"] });
    queryClient.invalidateQueries({ queryKey: MY_PROFILE_TAG_DETAILS_KEY });
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
