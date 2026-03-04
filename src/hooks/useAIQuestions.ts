import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/supabase";

type AIQuestion = Database["public"]["Tables"]["ai_questions"]["Row"];
type AIResponse = Database["public"]["Tables"]["ai_question_responses"]["Row"];

/** 全質問を取得（新しい順） */
export function useAIQuestions() {
  return useQuery<AIQuestion[]>({
    queryKey: ["ai_questions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_questions")
        .select("*")
        .order("date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

/** 今日の日付を YYYY-MM-DD 形式で返す（ローカルタイムゾーン） */
function getTodayDateString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** 今日の質問を取得（date が今日の質問のみ） */
export function useTodayQuestion() {
  const today = getTodayDateString();
  return useQuery<AIQuestion | null>({
    queryKey: ["ai_questions", "today", today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_questions")
        .select("*")
        .eq("date", today)
        .limit(1)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
  });
}

/** 今日の質問に回答済みかどうかを判定 */
export function useHasAnsweredToday(
  userId: string | undefined,
  questionId: string | undefined
) {
  return useQuery<boolean>({
    queryKey: ["ai_responses", "today", userId, questionId],
    queryFn: async () => {
      if (!userId || !questionId) return false;
      const { data, error } = await supabase
        .from("ai_question_responses")
        .select("id")
        .eq("question_id", questionId)
        .eq("user_id", userId)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
    enabled: !!userId && !!questionId,
  });
}

/** ユーザーの回答履歴を取得 */
export function useMyResponses(userId: string | undefined) {
  return useQuery<(AIResponse & { question: AIQuestion })[]>({
    queryKey: ["ai_responses", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("ai_question_responses")
        .select("*, question:ai_questions(*)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as (AIResponse & { question: AIQuestion })[];
    },
    enabled: !!userId,
  });
}

/** 質問に回答 */
export function useAnswerQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      questionId,
      userId,
      answer,
    }: {
      questionId: string;
      userId: string;
      answer: string;
    }) => {
      const { data, error } = await supabase
        .from("ai_question_responses")
        .upsert(
          { question_id: questionId, user_id: userId, answer },
          { onConflict: "question_id,user_id" }
        )
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai_questions"] });
      queryClient.invalidateQueries({ queryKey: ["ai_responses"] });
    },
  });
}
