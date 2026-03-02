import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/supabase";

type PostingRow = Database["public"]["Tables"]["postings"]["Row"];
type PostingInsert = Database["public"]["Tables"]["postings"]["Insert"];
type ParticipantRow = Database["public"]["Tables"]["posting_participants"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

/** 投稿 + 参加者 + 作成者プロフィール を含む型 */
export interface PostingWithDetails extends PostingRow {
  creator: ProfileRow | null;
  participants: (ParticipantRow & { profile: ProfileRow | null })[];
}

/** 全投稿を取得（参加者・作成者情報込み） */
export function usePostings(category?: string) {
  return useQuery<PostingWithDetails[]>({
    queryKey: ["postings", category],
    queryFn: async () => {
      let query = supabase
        .from("postings")
        .select(`
          *,
          creator:profiles!postings_creator_id_fkey(*),
          participants:posting_participants(*, profile:profiles!posting_participants_user_id_fkey(*))
        `)
        .order("created_at", { ascending: false });

      if (category && category !== "all") {
        query = query.eq("category", category);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data as unknown as PostingWithDetails[]) ?? [];
    },
  });
}

/** 特定の投稿を取得 */
export function usePosting(id: string | undefined) {
  return useQuery<PostingWithDetails | null>({
    queryKey: ["postings", "detail", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("postings")
        .select(`
          *,
          creator:profiles!postings_creator_id_fkey(*),
          participants:posting_participants(*, profile:profiles!posting_participants_user_id_fkey(*))
        `)
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as unknown as PostingWithDetails;
    },
    enabled: !!id,
  });
}

/** 投稿を作成 */
export function useCreatePosting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (posting: PostingInsert) => {
      const { data, error } = await supabase
        .from("postings")
        .insert(posting)
        .select()
        .single();
      if (error) throw error;
      return data;
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
      userId,
      action,
    }: {
      postingId: string;
      userId: string;
      action: "join" | "interested" | "online";
    }) => {
      const { data, error } = await supabase
        .from("posting_participants")
        .upsert(
          { posting_id: postingId, user_id: userId, action },
          { onConflict: "posting_id,user_id" }
        )
        .select()
        .single();
      if (error) throw error;
      return data;
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
    mutationFn: async ({
      postingId,
      userId,
    }: {
      postingId: string;
      userId: string;
    }) => {
      const { error } = await supabase
        .from("posting_participants")
        .delete()
        .eq("posting_id", postingId)
        .eq("user_id", userId);
      if (error) throw error;
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

      // 自分が作成した投稿
      const { data: created, error: e1 } = await supabase
        .from("postings")
        .select(`
          *,
          creator:profiles!postings_creator_id_fkey(*),
          participants:posting_participants(*, profile:profiles!posting_participants_user_id_fkey(*))
        `)
        .eq("creator_id", userId);
      if (e1) throw e1;

      // 自分が参加している投稿のID
      const { data: participations, error: e2 } = await supabase
        .from("posting_participants")
        .select("posting_id")
        .eq("user_id", userId);
      if (e2) throw e2;

      const participatedIds = (participations ?? [])
        .map((p) => p.posting_id)
        .filter((id) => !(created ?? []).some((c) => c.id === id));

      let participated: PostingWithDetails[] = [];
      if (participatedIds.length > 0) {
        const { data, error: e3 } = await supabase
          .from("postings")
          .select(`
            *,
            creator:profiles!postings_creator_id_fkey(*),
            participants:posting_participants(*, profile:profiles!posting_participants_user_id_fkey(*))
          `)
          .in("id", participatedIds);
        if (e3) throw e3;
        participated = (data as unknown as PostingWithDetails[]) ?? [];
      }

      return [
        ...((created as unknown as PostingWithDetails[]) ?? []),
        ...participated,
      ];
    },
    enabled: !!userId,
  });
}
