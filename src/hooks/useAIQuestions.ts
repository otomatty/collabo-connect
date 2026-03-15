import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import type { Database } from "@/types/supabase";

type AIQuestion = Database["public"]["Tables"]["ai_questions"]["Row"];
type AIResponse = Database["public"]["Tables"]["ai_question_responses"]["Row"];

/** 全質問を取得（新しい順） */
export function useAIQuestions() {
  return useQuery<AIQuestion[]>({
    queryKey: ["ai_questions"],
    queryFn: async () => apiFetch<AIQuestion[]>("/api/ai-questions"),
  });
}

/** 今日の質問を取得（date が今日の質問のみ） */
export function useTodayQuestion() {
  return useQuery<AIQuestion | null>({
    queryKey: ["ai_questions", "today"],
    queryFn: async () => {
      try {
        return await apiFetch<AIQuestion>("/api/ai-questions/today");
      } catch {
        return null;
      }
    },
  });
}

/** 今日の質問に回答済みかどうかを判定 */
export function useHasAnsweredToday(
  userId: string | undefined,
  questionId: string | undefined
) {
  const { session } = useAuth();

  return useQuery<boolean>({
    queryKey: ["ai_responses", "today", userId, questionId],
    queryFn: async () => {
      if (!userId || !questionId || !session?.access_token) return false;
      try {
        await apiFetch(`/api/ai-questions/${questionId}/responses/me`, {
          accessToken: session.access_token,
        });
        return true;
      } catch {
        return false;
      }
    },
    enabled: !!userId && !!questionId && !!session?.access_token,
  });
}

/** ユーザーの回答履歴を取得 */
export function useMyResponses(userId: string | undefined) {
  const { session } = useAuth();

  return useQuery<(AIResponse & { question: AIQuestion })[]>({
    queryKey: ["ai_responses", userId],
    queryFn: async () => {
      if (!userId || !session?.access_token) return [];
      return apiFetch<(AIResponse & { question: AIQuestion })[]>("/api/ai-question-responses/me", {
        accessToken: session.access_token,
      });
    },
    enabled: !!userId && !!session?.access_token,
  });
}

/** 質問に回答 */
export function useAnswerQuestion() {
  const queryClient = useQueryClient();
  const { session } = useAuth();

  return useMutation({
    mutationFn: async ({
      questionId,
      userId: _userId,
      answer,
    }: {
      questionId: string;
      userId: string;
      answer: string;
    }) => {
      const token = session?.access_token;
      if (!token) throw new Error("Not authenticated");
      return apiFetch<AIResponse>("/api/ai-question-responses", {
        method: "POST",
        accessToken: token,
        body: { question_id: questionId, answer },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai_questions"] });
      queryClient.invalidateQueries({ queryKey: ["ai_responses"] });
    },
  });
}
