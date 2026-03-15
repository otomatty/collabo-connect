import { useState, useCallback, useRef } from "react";
import { apiFetch } from "@/lib/api";

// ---------- Type Definitions ----------
export interface ChatMessage {
  role: "ai" | "user";
  content: string;
  options?: string[];
}

interface AIReplyResponse {
  message: string;
  options: string[];
  personCard: string;
  done: boolean;
}

interface AIGenerateResponse {
  introduction: string;
}

export interface ProfileForInterview {
  name: string;
  role: string;
  job_type: string;
  areas: string[];
  tags: string[];
  ai_intro: string;
}

export interface PastResponse {
  question: string;
  answer: string;
}

type InterviewPhase = "idle" | "interviewing" | "generating" | "done" | "error";

export function useAIInterview() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [phase, setPhase] = useState<InterviewPhase>("idle");
  const [generatedIntro, setGeneratedIntro] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [interviewDone, setInterviewDone] = useState(false);

  const personCardRef = useRef<string>("");

  const invokeFunction = useCallback(async <T>(payload: Record<string, unknown>): Promise<T> => {
    return apiFetch<T>("/api/ai-interview", {
      method: "POST",
      body: payload,
    });
  }, []);

  /** Start interview */
  const startInterview = useCallback(
    async (profile: ProfileForInterview, pastResponses?: PastResponse[]) => {
      setIsLoading(true);
      setError(null);
      setPhase("interviewing");
      setMessages([]);
      setGeneratedIntro("");
      setInterviewDone(false);
      personCardRef.current = "";
      try {
        const res = await invokeFunction<AIReplyResponse>({
          action: "start",
          profile,
          messages: [],
          pastResponses: pastResponses ?? [],
        });
        personCardRef.current = res.personCard ?? "";
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

  /** Send reply and get next question */
  const sendReply = useCallback(
    async (reply: string, profile: ProfileForInterview, pastResponses?: PastResponse[]) => {
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
          pastResponses: pastResponses ?? [],
          personCard: personCardRef.current,
        });

        personCardRef.current = res.personCard ?? personCardRef.current;

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

  /** Generate self-introduction from interview */
  const generateIntro = useCallback(
    async (profile: ProfileForInterview, pastResponses?: PastResponse[]) => {
      setIsLoading(true);
      setError(null);
      setPhase("generating");
      try {
        const res = await invokeFunction<AIGenerateResponse>({
          action: "generate",
          profile,
          messages,
          pastResponses: pastResponses ?? [],
          personCard: personCardRef.current,
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

  /** Reset */
  const reset = useCallback(() => {
    setMessages([]);
    setPhase("idle");
    setGeneratedIntro("");
    setIsLoading(false);
    setError(null);
    setInterviewDone(false);
    personCardRef.current = "";
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
