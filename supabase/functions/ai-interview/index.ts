// supabase/functions/ai-interview/index.ts
// Supabase Edge Function: AIインタビュー
// Gemini API を使ってインタビュワーとして動的に質問し、自己紹介文を生成する

// Deno runtime 用の型宣言
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

// ---------- 型定義 ----------
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
    areas: string[];
    tags: string[];
    ai_intro: string;
  };
  messages: ChatMessage[];
  userReply?: string;
}

// ---------- Gemini API 呼び出し ----------
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

// ---------- システムプロンプト ----------
function interviewSystemPrompt(profile: RequestBody["profile"]): string {
  return `あなたは「Collabo-Connect」という社内コミュニケーションアプリのインタビュワーAIです。
ユーザーのことを親しみやすくインタビューし、その人らしさが伝わる自己紹介文を作成するための情報を引き出してください。

## あなたの役割
- フレンドリーで温かい口調でインタビューする
- 1回の発言で1つの質問だけ聞く
- 質問には必ず3〜5個の選択肢を提示する（ユーザーは選択肢を選ぶか自由に回答できる）
- 業務的な内容だけでなく、趣味・人柄・価値観など人間味のある情報を引き出す
- 同じ内容を繰り返し聞かない

## ユーザーの現在のプロフィール
- 名前: ${profile.name}
- 役職: ${profile.role || "未設定"}
- 活動エリア: ${profile.areas?.join("、") || "未設定"}
- タグ: ${profile.tags?.join("、") || "未設定"}
- 現在の自己紹介: ${profile.ai_intro || "なし"}

## 回答フォーマット（必ず守ること）
以下のJSON形式のみで回答してください。他のテキストは含めないでください。
\`\`\`json
{
  "message": "質問テキスト",
  "options": ["選択肢1", "選択肢2", "選択肢3", "選択肢4"]
}
\`\`\``;
}

function generateSystemPrompt(profile: RequestBody["profile"]): string {
  return `あなたは「Collabo-Connect」という社内コミュニケーションアプリの自己紹介文ライターです。
以下のインタビュー内容をもとに、プロフィールに掲載する自己紹介文を作成してください。

## 要件
- 200〜300文字程度
- 三人称ではなく一人称（「私は〜」）で書く
- 業務内容だけでなく、趣味や人柄も伝わる文章にする
- カジュアルだが、ビジネスの場にもふさわしい丁寧さを持つ
- 読んだ人が「この人と話してみたい」と思えるような温かみのある文章

## ユーザーの基本情報
- 名前: ${profile.name}
- 役職: ${profile.role || "未設定"}
- 活動エリア: ${profile.areas?.join("、") || "未設定"}
- タグ: ${profile.tags?.join("、") || "未設定"}

## 回答フォーマット（必ず守ること）
以下のJSON形式のみで回答してください。他のテキストは含めないでください。
\`\`\`json
{
  "introduction": "生成された自己紹介文"
}
\`\`\``;
}

// ---------- JSON パース ----------
function parseJsonFromResponse(text: string): Record<string, unknown> {
  // コードブロック内のJSONを抽出
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonStr = codeBlockMatch ? codeBlockMatch[1].trim() : text.trim();
  return JSON.parse(jsonStr);
}

// ---------- ハンドラー ----------
Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const body = (await req.json()) as RequestBody;
    const { action, profile, messages, userReply } = body;

    // ---------- action: start ----------
    if (action === "start") {
      const systemPrompt = interviewSystemPrompt(profile);
      const userPrompt = `インタビューを開始してください。まず挨拶をしてから、最初の質問をしてください。`;
      const raw = await callGemini(systemPrompt, userPrompt);
      const parsed = parseJsonFromResponse(raw) as {
        message: string;
        options: string[];
      };

      return new Response(
        JSON.stringify({
          message: parsed.message,
          options: parsed.options ?? [],
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
      const systemPrompt = interviewSystemPrompt(profile);

      // 会話履歴を組み立て
      const conversationHistory = messages
        .map((m) =>
          m.role === "ai"
            ? `インタビュワー: ${m.content}`
            : `ユーザー: ${m.content}`
        )
        .join("\n");

      // 5問以上聞いたら終了を促す
      let instruction: string;
      if (questionCount >= 5) {
        instruction = `これまでのインタビュー内容は十分です。最後の回答にリアクションしてから、「ありがとうございました！これで自己紹介文を作成しますね」と締めくくってください。optionsは空配列にしてください。`;
      } else {
        instruction = `ユーザーの最新の回答「${userReply}」にリアクション（共感・驚き等）してから、次の質問をしてください。これまでと違う切り口の質問をしてください。`;
      }

      const userPrompt = `## これまでの会話\n${conversationHistory}\n\n## 指示\n${instruction}`;
      const raw = await callGemini(systemPrompt, userPrompt);
      const parsed = parseJsonFromResponse(raw) as {
        message: string;
        options: string[];
      };

      return new Response(
        JSON.stringify({
          message: parsed.message,
          options: parsed.options ?? [],
          done: questionCount >= 5,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ---------- action: generate ----------
    if (action === "generate") {
      const systemPrompt = generateSystemPrompt(profile);

      const conversationHistory = messages
        .map((m) =>
          m.role === "ai"
            ? `インタビュワー: ${m.content}`
            : `ユーザー: ${m.content}`
        )
        .join("\n");

      const userPrompt = `## インタビュー内容\n${conversationHistory}\n\n上記のインタビュー結果をもとに、自己紹介文を作成してください。`;
      const raw = await callGemini(systemPrompt, userPrompt);
      const parsed = parseJsonFromResponse(raw) as {
        introduction: string;
      };

      return new Response(
        JSON.stringify({
          introduction: parsed.introduction,
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
