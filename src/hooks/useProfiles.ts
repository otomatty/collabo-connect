import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { Database } from "@/types/supabase";
import type { ProfileTagDetail } from "@/types/tags";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

/** 全プロフィールを取得 */
export function useProfiles() {
  return useQuery<Profile[]>({
    queryKey: ["profiles"],
    queryFn: async () => apiFetch<Profile[]>("/api/profiles"),
  });
}

/** 特定のプロフィールを取得 */
export function useProfile(id: string | undefined) {
  return useQuery<Profile | null>({
    queryKey: ["profiles", id],
    queryFn: async () => {
      if (!id) return null;
      return apiFetch<Profile>(`/api/profiles/${id}`);
    },
    enabled: !!id,
  });
}

/**
 * `[profiles, me, tags, userId]` 形式で user-scoped にキャッシュする。
 * QueryClient はセッション間で共有されるため、ID をキーに含めないと
 * 別ユーザーがログインした直後に前ユーザーのタグ詳細が一瞬見えてしまう。
 */
export function myProfileTagDetailsKey(userId: string | undefined) {
  return ["profiles", "me", "tags", userId ?? "anon"] as const;
}

/**
 * 自分の profile_tags の詳細（source / created_at を含む）を取得。
 * MyPage で `source='auto'` かつ直近24h の付与に「NEW」バッジを出すために使う。
 */
export function useMyProfileTagDetails(userId: string | undefined) {
  return useQuery<ProfileTagDetail[]>({
    queryKey: myProfileTagDetailsKey(userId),
    queryFn: () => apiFetch<ProfileTagDetail[]>("/api/profiles/me/tags"),
    enabled: !!userId,
  });
}

/** プロフィールを更新 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id: _id, updates }: { id: string; updates: ProfileUpdate }) => {
      return apiFetch<Profile>("/api/profiles/me", {
        method: "PUT",
        body: updates,
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      if (data) {
        queryClient.setQueryData(["profiles", data.id], data);
      }
    },
  });
}
