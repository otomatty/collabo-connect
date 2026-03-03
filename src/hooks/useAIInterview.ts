import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

// ---------- 型定義 ----------
export interface ChatMessage {
  role: "ai" | "user";
  content: string;
  options?: string[];
}

interface AIReplyResponse {
  message: string;
  options: string[];
  done: boolean;
}

interface AIGenerateResponse {
  introduction: string;
}

interface ProfileForInterview {
  name: string;
  role: string;
  areas: string[];
  tags: string[];
  ai_intro: string;
}

type InterviewPhase = "idle" | "interviewing" | "generating" | "done" | "error";

export function useAIInterview() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [phase, setPhase] = useState<InterviewPhase>("idle");
  const [generatedIntro, setGeneratedIntro] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [interviewDone, setInterviewDone] = useState(false);

  /** Edge Function を呼び出すヘルパー */
  const invokeFunction = useCallback(
    async <T>(payload: Record<string, unknown>): Promise<T> => {
      const { data, error } = await supabase.functions.invoke("ai-interview", {
        body: payload,
      });
      if (error) throw new Error(error.message ?? "Edge Function エラー");
      return data as T;
    },
    []
  );

  /** インタビューを開始 */
  const startInterview = useCallback(
    async (profile: ProfileForInterview) => {
      setIsLoading(true);
      setError(null);
      setPhase("interviewing");
      setMessages([]);
      setGeneratedIntro("");
      setInterviewDone(false);
      try {
        const res = await invokeFunction<AIReplyResponse>({
          action: "start",
          profile,
          messages: [],
        });
        const aiMsg: ChatMessage = {
          role: "ai",
          content: res.message,
          options: res.options,
        };
        setMessages([aiMsg]);
      } catch (e) {
        setError((e as Error).message);
        setPhase("error");
      } finally {
        setIsLoading(false);
      }
    },
    [invokeFunction]
  );

  /** ユーザーの回答を送信し、次の質問を取得 */
  const sendReply = useCallback(
    async (reply: string, profile: ProfileForInterview) => {
      setIsLoading(true);
      setError(null);
      try {
        const userMsg: ChatMessage = { role: "user", content: reply };
        const updatedMessages = [...messages, userMsg];
        setMessages(updatedMessages);

        const res = await invokeFunction<AIReplyResponse>({
          action: "reply",
          profile,
          messages: updatedMessages,
          userReply: reply,
        });

        const aiMsg: ChatMessage = {
          role: "ai",
          content: res.message,
          options: res.options,
        };
        setMessages([...updatedMessages, aiMsg]);

        if (res.done) {
          setInterviewDone(true);
        }
      } catch (e) {
        setError((e as Error).message);
        setPhase("error");
      } finally {
        setIsLoading(false);
      }
    },
    [messages, invokeFunction]
  );

  /** インタビュー結果から自己紹介文を生成 */
  const generateIntro = useCallback(
    async (profile: ProfileForInterview) => {
      setIsLoading(true);
      setError(null);
      setPhase("generating");
      try {
        const res = await invokeFunction<AIGenerateResponse>({
          action: "generate",
          profile,
          messages,
        });
        setGeneratedIntro(res.introduction);
        setPhase("done");
      } catch (e) {
        setError((e as Error).message);
        setPhase("error");
      } finally {
        setIsLoading(false);
      }
    },
    [messages, invokeFunction]
  );

  /** リセット */
  const reset = useCallback(() => {
    setMessages([]);
    setPhase("idle");
    setGeneratedIntro("");
    setIsLoading(false);
    setError(null);
    setInterviewDone(false);
  }, []);

  return {
    messages,
    phase,
    generatedIntro,
    isLoading,
    error,
    interviewDone,
    startInterview,
    sendReply,
    generateIntro,
    reset,
  };
}
