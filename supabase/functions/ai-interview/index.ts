// supabase/functions/ai-interview/index.ts
// Supabase Edge Function: AI Interview
// Gemini API to dynamically interview users and generate self-introductions

import {
  buildInterviewSystemPrompt,
  buildGenerateSystemPrompt,
  type ProfileData,
  type PastResponse,
} from "./prompts/index.ts";

// Deno runtime types
declare const Deno: {
  env: { get(key: string): string | undefined };
  serve(handler: (req: Request) => Promise<Response> | Response): void;
};

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_MODEL = "gemini-3-flash-preview";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ---------- Types ----------
interface ChatMessage {
  role: "ai" | "user";
  content: string;
  options?: string[];
}

interface RequestBody {
  action: "start" | "reply" | "generate";
  profile: ProfileData;
  messages: ChatMessage[];
  userReply?: string;
  pastResponses?: PastResponse[];
  personCard?: string;
}

// ---------- Gemini API ----------
function buildGeminiUrl(): string {
  return `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
}

async function callGemini(systemPrompt: string, userPrompt: string): Promise<string> {
  const body = {
    system_instruction: {
      parts: [{ text: systemPrompt }],
    },
    contents: [
      {
        role: "user",
        parts: [{ text: userPrompt }],
      },
    ],
    generationConfig: {
      temperature: 0.8,
      maxOutputTokens: 1024,
      responseMimeType: "application/json",
    },
  };

  const res = await fetch(buildGeminiUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("Gemini API error:", errText);
    throw new Error(`Gemini API error: ${res.status}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

// ---------- JSON Parse ----------
function parseJsonFromResponse(text: string): Record<string, unknown> {
  const cleaned = text.trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    // noop
  }

  const codeBlockMatches = cleaned.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi);
  for (const match of codeBlockMatches) {
    const candidate = match[1]?.trim();
    if (!candidate) continue;
    try {
      return JSON.parse(candidate);
    } catch {
      // noop
    }
  }

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    const candidate = cleaned.slice(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(candidate);
    } catch {
      // noop
    }
  }

  throw new Error("Failed to parse JSON from Gemini response");
}

function parseIntroduction(raw: string): string {
  try {
    const parsed = parseJsonFromResponse(raw) as {
      introduction?: unknown;
      intro?: unknown;
      selfIntroduction?: unknown;
    };

    const candidates = [parsed.introduction, parsed.intro, parsed.selfIntroduction];
    for (const candidate of candidates) {
      if (typeof candidate === "string" && candidate.trim()) {
        return candidate.trim();
      }
    }
  } catch {
    // noop
  }

  const plainText = raw
    .replace(/```(?:json)?/gi, "")
    .replace(/```/g, "")
    .trim();

  if (plainText.startsWith("{") && plainText.endsWith("}")) {
    try {
      const nested = JSON.parse(plainText) as {
        introduction?: unknown;
        intro?: unknown;
        selfIntroduction?: unknown;
      };
      const nestedCandidates = [nested.introduction, nested.intro, nested.selfIntroduction];
      for (const candidate of nestedCandidates) {
        if (typeof candidate === "string" && candidate.trim()) {
          return candidate.trim();
        }
      }
    } catch {
      // noop
    }
  }

  if (plainText) {
    return plainText;
  }

  throw new Error("Gemini response does not include introduction text");
}

// ---------- Handler ----------
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const body = (await req.json()) as RequestBody;
    const { action, profile, messages, userReply, pastResponses, personCard } = body;

    // ---------- action: start ----------
    if (action === "start") {
      const systemPrompt = buildInterviewSystemPrompt(profile, pastResponses);
      const userPrompt = `インタビューを開始してください。まずは軽く挨拶して、最初の質問をしてください。
前回答やプロフィールで既にわかっていることは繰り返さず、それを踏まえた上で、まだ知らない側面を引き出す質問をしてください。
personCard は前回答・プロフィールから初期構築してください。`;
      const raw = await callGemini(systemPrompt, userPrompt);
      const parsed = parseJsonFromResponse(raw) as {
        message: string;
        options: string[];
        personCard: string;
      };

      return new Response(
        JSON.stringify({
          message: parsed.message,
          options: parsed.options ?? [],
          personCard: parsed.personCard ?? "",
          done: false,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ---------- action: reply ----------
    if (action === "reply") {
      const questionCount = messages.filter((m) => m.role === "ai").length;
      const systemPrompt = buildInterviewSystemPrompt(profile, pastResponses, personCard);

      // Only send the most recent exchange + personCard (no full history needed)
      const lastAiMsg = [...messages].reverse().find((m) => m.role === "ai");
      const recentContext = lastAiMsg
        ? `インタビュアー: ${lastAiMsg.content}\nユーザー: ${userReply}`
        : `ユーザー: ${userReply}`;

      let instruction: string;
      if (questionCount >= 5) {
        instruction = `ここまでのインタビュー内容は十分です。最後の回答にリアクションしてから、「ありがとうございました！これで自己紹介を作成しますね」と締めくくってください。optionsは空配列にしてください。
personCard は最終版も出力してください。`;
      } else {
        instruction = `ユーザーの最新の回答にリアクション（共感・深掘り）してから、次の質問をしてください。
人物カードで把握していることとは違う切り口で、その人の解像度をさらに上げるような質問をしてください。
personCard には今回の回答で得られた新情報を追記してください。`;
      }

      const userPrompt = `## 直近の会話\n${recentContext}\n\n## 指示\n${instruction}`;
      const raw = await callGemini(systemPrompt, userPrompt);
      const parsed = parseJsonFromResponse(raw) as {
        message: string;
        options: string[];
        personCard: string;
      };

      return new Response(
        JSON.stringify({
          message: parsed.message,
          options: parsed.options ?? [],
          personCard: parsed.personCard ?? personCard ?? "",
          done: questionCount >= 5,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ---------- action: generate ----------
    if (action === "generate") {
      const systemPrompt = buildGenerateSystemPrompt(profile, pastResponses, personCard);

      const userPrompt = `人物カードと前回答の全てを踏まえて、自己紹介を作成してください。`;
      const raw = await callGemini(systemPrompt, userPrompt);
      const introduction = parseIntroduction(raw);

      return new Response(
        JSON.stringify({
          introduction,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
