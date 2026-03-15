import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import type { Database } from "@/types/supabase";

type PostingRow = Database["public"]["Tables"]["postings"]["Row"];
type PostingInsert = Database["public"]["Tables"]["postings"]["Insert"];
type ParticipantRow = Database["public"]["Tables"]["posting_participants"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export interface PostingWithDetails extends PostingRow {
  creator: ProfileRow | null;
  participants: (ParticipantRow & { profile: ProfileRow | null })[];
}

/** 全投稿を取得（参加者・作成者情報込み） */
export function usePostings(category?: string) {
  return useQuery<PostingWithDetails[]>({
    queryKey: ["postings", category],
    queryFn: async () => {
      const q = category && category !== "all" ? `?category=${encodeURIComponent(category)}` : "";
      return apiFetch<PostingWithDetails[]>(`/api/postings${q}`);
    },
  });
}

/** 特定の投稿を取得 */
export function usePosting(id: string | undefined) {
  return useQuery<PostingWithDetails | null>({
    queryKey: ["postings", "detail", id],
    queryFn: async () => {
      if (!id) return null;
      return apiFetch<PostingWithDetails>(`/api/postings/${id}`);
    },
    enabled: !!id,
  });
}

/** 投稿を作成 */
export function useCreatePosting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (posting: PostingInsert) => {
      return apiFetch<PostingRow>("/api/postings", {
        method: "POST",
        body: {
          title: posting.title,
          category: posting.category,
          date: posting.date ?? null,
          date_undecided: posting.date_undecided ?? false,
          area: posting.area,
          is_online: posting.is_online ?? false,
          description: posting.description ?? "",
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["postings"] });
    },
  });
}

/** 参加アクションを追加/更新 */
export function useParticipate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      postingId,
      userId: _userId,
      action,
    }: {
      postingId: string;
      userId: string;
      action: "join" | "interested" | "online";
    }) => {
      return apiFetch<ParticipantRow>(`/api/postings/${postingId}/participants`, {
        method: "POST",
        body: { action },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["postings"] });
    },
  });
}

/** 参加を取り消し */
export function useRemoveParticipation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postingId }: { postingId: string; userId: string }) => {
      return apiFetch(`/api/postings/${postingId}/participants/me`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["postings"] });
    },
  });
}

/** 自分が関連する投稿を取得 */
export function useMyPostings(userId: string | undefined) {
  return useQuery<PostingWithDetails[]>({
    queryKey: ["postings", "my", userId],
    queryFn: async () => {
      if (!userId) return [];
      return apiFetch<PostingWithDetails[]>("/api/postings/mine");
    },
    enabled: !!userId,
  });
}
