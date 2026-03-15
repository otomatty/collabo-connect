import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import type { Database } from "@/types/supabase";

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

/** プロフィールを更新 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { session } = useAuth();

  return useMutation({
    mutationFn: async ({ id: _id, updates }: { id: string; updates: ProfileUpdate }) => {
      const token = session?.access_token;
      if (!token) throw new Error("Not authenticated");
      return apiFetch<Profile>("/api/profiles/me", {
        method: "PUT",
        accessToken: token,
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
