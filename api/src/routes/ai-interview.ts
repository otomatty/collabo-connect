import { Router, type Request, type Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  buildInterviewSystemPrompt,
  buildGenerateSystemPrompt,
} from "../prompts/index.js";
import { extractAndPersistTags } from "../services/tag-suggestions.js";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-3-flash-preview";

interface ChatMessage {
  role: "ai" | "user";
  content: string;
  options?: string[];
}

interface RequestBody {
  action: "start" | "reply" | "generate";
  profile: {
    name: string;
    role: string;
    job_type: string;
    areas: string[];
    tags: string[];
    ai_intro: string;
  };
  messages: ChatMessage[];
  userReply?: string;
  pastResponses?: { question: string; answer: string }[];
  personCard?: string;
}

function buildGeminiUrl(): string {
  return `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
}

async function callGemini(systemPrompt: string, userPrompt: string): Promise<string> {
  const body = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
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
  const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

function parseJsonFromResponse(text: string): Record<string, unknown> {
  const cleaned = text.trim();
  try {
    return JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    // noop
  }
  const codeBlockMatches = cleaned.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi);
  for (const match of codeBlockMatches) {
    const candidate = match[1]?.trim();
    if (!candidate) continue;
    try {
      return JSON.parse(candidate) as Record<string, unknown>;
    } catch {
      // noop
    }
  }
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    try {
      return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1)) as Record<string, unknown>;
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
      if (typeof candidate === "string" && candidate.trim()) return candidate.trim();
    }
  } catch {
    // noop
  }
  const plainText = raw.replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();
  if (plainText.startsWith("{") && plainText.endsWith("}")) {
    try {
      const nested = JSON.parse(plainText) as {
        introduction?: unknown;
        intro?: unknown;
        selfIntroduction?: unknown;
      };
      const nestedCandidates = [nested.introduction, nested.intro, nested.selfIntroduction];
      for (const candidate of nestedCandidates) {
        if (typeof candidate === "string" && candidate.trim()) return candidate.trim();
      }
    } catch {
      // noop
    }
  }
  if (plainText) return plainText;
  throw new Error("Gemini response does not include introduction text");
}

const router = Router();

router.post("/", requireAuth, async (req: Request, res: Response): Promise<void> => {
  if (!GEMINI_API_KEY) {
    res.status(503).json({ error: "GEMINI_API_KEY is not configured" });
    return;
  }
  try {
    const body = req.body as RequestBody;
    const { action, profile, messages, userReply, pastResponses, personCard } = body;

    if (action === "start") {
      const systemPrompt = buildInterviewSystemPrompt(profile, pastResponses);
      const userPrompt = `インタビューを開始してください。まずは軽く挨拶して、最初の質問をしてください。
前回答やプロフィールで既にわかっていることは繰り返さず、それを踏まえた上で、まだ知らない側面を引き出す質問をしてください。
personCard は前回答・プロフィールから初期構築してください。`;
      const raw = await callGemini(systemPrompt, userPrompt);
      const parsed = parseJsonFromResponse(raw) as { message: string; options: string[]; personCard: string };
      res.json({
        message: parsed.message,
        options: parsed.options ?? [],
        personCard: parsed.personCard ?? "",
        done: false,
      });
      return;
    }

    if (action === "reply") {
      if (typeof userReply !== "string" || !userReply.trim()) {
        res.status(400).json({ error: "userReply is required for reply action" });
        return;
      }
      const questionCount = messages.filter((m) => m.role === "ai").length;
      const systemPrompt = buildInterviewSystemPrompt(profile, pastResponses, personCard);
      const lastAiMsg = [...messages].reverse().find((m) => m.role === "ai");
      const recentContext = lastAiMsg
        ? `インタビュアー: ${lastAiMsg.content}\nユーザー: ${userReply.trim()}`
        : `ユーザー: ${userReply.trim()}`;
      const instruction =
        questionCount >= 5
          ? `ここまでのインタビュー内容は十分です。最後の回答にリアクションしてから、「ありがとうございました！これで自己紹介を作成しますね」と締めくくってください。optionsは空配列にしてください。
personCard は最終版も出力してください。`
          : `ユーザーの最新の回答にリアクション（共感・深掘り）してから、次の質問をしてください。
人物カードで把握していることとは違う切り口で、その人の解像度をさらに上げるような質問をしてください。
personCard には今回の回答で得られた新情報を追記してください。`;
      const userPrompt = `## 直近の会話\n${recentContext}\n\n## 指示\n${instruction}`;
      const raw = await callGemini(systemPrompt, userPrompt);
      const parsed = parseJsonFromResponse(raw) as { message: string; options: string[]; personCard: string };
      res.json({
        message: parsed.message,
        options: questionCount >= 5 ? [] : (parsed.options ?? []),
        personCard: parsed.personCard ?? personCard ?? "",
        done: questionCount >= 5,
      });
      return;
    }

    if (action === "generate") {
      const systemPrompt = buildGenerateSystemPrompt(profile, pastResponses, personCard);
      const userPrompt = `人物カードと前回答の全てを踏まえて、自己紹介を作成してください。`;
      const raw = await callGemini(systemPrompt, userPrompt);
      const introduction = parseIntroduction(raw);
      res.json({ introduction });

      const userId = req.userId;
      if (userId) {
        // Fire-and-forget: extractAndPersistTags swallows its own errors so
        // a failure in the tag agent never blocks or breaks the interview
        // response above.
        void extractAndPersistTags(userId, {
          messages,
          personCard,
          profile,
        });
      }
      return;
    }

    res.status(400).json({ error: "Invalid action" });
  } catch (err) {
    console.error("ai-interview error:", err);
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
