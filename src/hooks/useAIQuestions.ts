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

/** 今日の質問を取得 */
export function useTodayQuestion() {
  return useQuery<AIQuestion | null>({
    queryKey: ["ai_questions", "today"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_questions")
        .select("*")
        .order("date", { ascending: false })
        .limit(1)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
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
