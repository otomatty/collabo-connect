import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { Database } from "@/types/supabase";
import type { ProfileTagDetail } from "@/types/tags";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

/** Cache key used by suggested-tag mutations to refresh tag detail metadata. */
export const MY_PROFILE_TAG_DETAILS_KEY = ["profiles", "me", "tags"] as const;

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
 * 自分の profile_tags の詳細（source / created_at を含む）を取得。
 * MyPage で `source='auto'` かつ直近24h の付与に「NEW」バッジを出すために使う。
 */
export function useMyProfileTagDetails(enabled = true) {
  return useQuery<ProfileTagDetail[]>({
    queryKey: MY_PROFILE_TAG_DETAILS_KEY,
    queryFn: () => apiFetch<ProfileTagDetail[]>("/api/profiles/me/tags"),
    enabled,
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
