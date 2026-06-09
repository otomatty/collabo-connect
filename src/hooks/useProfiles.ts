import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { Database } from "@/types/supabase";
import type { ConversationTopic } from "@/types/profile";
import type { ProfilePublicTag, ProfileTagDetail } from "@/types/tags";

/**
 * API-shaped Profile: same as the Supabase Row, but with `conversation_topics`
 * narrowed from the generated `Json` to the parsed `ConversationTopic[]` the
 * `/api/profiles*` endpoints actually return. Keeping the override here means
 * call sites can read `user.conversation_topics` without manual casts.
 */
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type Profile = Omit<ProfileRow, "conversation_topics"> & {
  conversation_topics: ConversationTopic[];
};
/**
 * API-shaped Profile update: same as the generated `Update`, but with
 * `conversation_topics` narrowed from `Json` to `ConversationTopic[]` so call
 * sites can pass the parsed array without casting. The `/api/profiles/me`
 * endpoint validates and persists it as jsonb.
 */
type ProfileUpdate = Omit<
  Database["public"]["Tables"]["profiles"]["Update"],
  "conversation_topics"
> & {
  conversation_topics?: ConversationTopic[];
};
type PostingRow = Database["public"]["Tables"]["postings"]["Row"];

/**
 * One entry in the member "最近の活動" timeline. Mirrors the API's `Activity`
 * union (`api/src/types.ts`) — keep both in sync when the shape changes.
 */
export type Activity =
  | { type: "posting_created"; posting: PostingRow; at: string }
  | {
      type: "posting_participated";
      posting: PostingRow;
      action: "join" | "interested" | "online";
      at: string;
    }
  | { type: "question_answered"; question: string; answer: string; at: string };

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
 * メンバー詳細ページで使う、他人プロフィールのタグ（カテゴリ付き）。
 * `/api/profiles/:id` は flat な `tags: string[]` しか返さないので、
 * カテゴリ別グルーピング表示のためにこちらを別フェッチする。
 */
export function useProfileTags(id: string | undefined) {
  return useQuery<ProfilePublicTag[]>({
    queryKey: ["profiles", id, "tags"],
    queryFn: async () => {
      if (!id) return [];
      return apiFetch<ProfilePublicTag[]>(`/api/profiles/${id}/tags`);
    },
    enabled: !!id,
  });
}

/**
 * メンバー詳細ページの「最近の活動」タイムライン。
 * 募集の作成/参加と AI 質問への回答を時系列降順でマージした最新 N 件を返す。
 */
export function useProfileActivity(id: string | undefined, limit = 3) {
  return useQuery<Activity[]>({
    queryKey: ["profiles", id, "activity", limit],
    queryFn: async () => {
      if (!id) return [];
      return apiFetch<Activity[]>(`/api/profiles/${id}/activity?limit=${limit}`);
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

/**
 * 会話のきっかけ（conversation_topics）を Gemini で再生成する。
 *
 * `POST /api/profiles/me/conversation-topics/regenerate` を叩き、更新後の
 * Profile を返す。サーバ側で生成に成功した場合のみ DB が書き換わるため、
 * 失敗時（502/500）は既存値が保持される。
 *
 * MyPage の編集フォームは「再生成」を押した時点ではローカル state のみを
 * 更新し、ユーザーが「保存」を押すまで DB へ反映しない想定 …… だが本
 * エンドポイントはサーバ側で即保存する仕様。返ってきた最新トピックで
 * フォーム値を上書きし、続けてユーザーが他項目を編集→保存できるようにする。
 */
export function useRegenerateConversationTopics() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      return apiFetch<Profile>("/api/profiles/me/conversation-topics/regenerate", {
        method: "POST",
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
