// supabase/functions/generate-daily-question/index.ts
// Supabase Edge Function: Generate daily question using Gemini AI
// Called via pg_cron or external scheduler (e.g. daily at 00:05 JST)

declare const Deno: {
  env: { get(key: string): string | undefined };
  serve(handler: (req: Request) => Promise<Response> | Response): void;
};

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const GEMINI_MODEL = "gemini-3-flash-preview";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ---------- Gemini API ----------
async function callGemini(systemPrompt: string, userPrompt: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
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
      temperature: 1.0,
      maxOutputTokens: 512,
      responseMimeType: "application/json",
    },
  };

  const res = await fetch(url, {
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

// ---------- Supabase client (service role) ----------
async function supabaseRequest(
  path: string,
  method: string,
  body?: unknown,
): Promise<unknown> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_SERVICE_ROLE_KEY!,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      Prefer: "return=representation",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Supabase request error: ${res.status} ${errText}`);
  }
  return res.json();
}

// ---------- Main ----------
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");
    if (!SUPABASE_URL) throw new Error("SUPABASE_URL is not configured");
    if (!SUPABASE_SERVICE_ROLE_KEY) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");

    // 今日の日付を JST で取得
    const now = new Date();
    const jstOffset = 9 * 60 * 60 * 1000;
    const jstDate = new Date(now.getTime() + jstOffset);
    const today = jstDate.toISOString().slice(0, 10);

    // 既に今日の質問が存在するかチェック
    const checkRes = await fetch(
      `${SUPABASE_URL}/rest/v1/ai_questions?date=eq.${today}&select=id`,
      {
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY!,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
      },
    );
    const existing = await checkRes.json();
    if (Array.isArray(existing) && existing.length > 0) {
      return new Response(
        JSON.stringify({ message: "Today's question already exists", date: today }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 直近の質問を取得（重複防止用）
    const recentRes = await fetch(
      `${SUPABASE_URL}/rest/v1/ai_questions?select=question&order=date.desc&limit=15`,
      {
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY!,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
      },
    );
    const recentQuestions = (await recentRes.json()) as { question: string }[];
    const recentList = recentQuestions.map((q) => q.question).join("\n- ");

    // Gemini で質問を生成
    const systemPrompt = `あなたは「Collabo Connect」という社内コミュニケーションアプリの質問生成AIです。
SES（システムエンジニアリングサービス）企業向けのアプリで、エンジニア・PM・営業・バックオフィスなど多様な職種の方が利用しています。

毎日1つ、全ユーザー共通の「今日の質問」を生成してください。

## 質問の目的
- ユーザーの人柄・趣味・価値観・スキルを知る
- 回答がAIインタビューの参考情報として使われ、自己紹介文の生成に活用される
- 社内の共通話題を作り、コミュニケーションのきっかけにする

## 質問のルール
- 誰でも気軽に答えられるカジュアルな質問にする
- 4つの選択肢を必ず用意する
- 直近の質問と似た内容は避ける
- 業務・技術系だけでなく、趣味・ライフスタイル・価値観など幅広いテーマから出題する

## 回答フォーマット（JSON）
{
  "question": "質問文",
  "options": ["選択肢1", "選択肢2", "選択肢3", "選択肢4"]
}`;

    const userPrompt = `今日の日付は ${today} です。

直近の質問（これらとは異なるテーマにしてください）:
- ${recentList || "なし"}

新しい質問を1つ生成してください。`;

    const raw = await callGemini(systemPrompt, userPrompt);

    // JSON パース
    let parsed: { question: string; options: string[] };
    try {
      parsed = JSON.parse(raw.trim());
    } catch {
      // コードブロック内の JSON を試行
      const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (match?.[1]) {
        parsed = JSON.parse(match[1].trim());
      } else {
        const firstBrace = raw.indexOf("{");
        const lastBrace = raw.lastIndexOf("}");
        parsed = JSON.parse(raw.slice(firstBrace, lastBrace + 1));
      }
    }

    if (!parsed.question || !Array.isArray(parsed.options) || parsed.options.length < 2) {
      throw new Error("Invalid question format from Gemini");
    }

    // DB に INSERT
    const inserted = await supabaseRequest("/ai_questions", "POST", {
      question: parsed.question,
      options: parsed.options,
      date: today,
    });

    return new Response(
      JSON.stringify({ message: "Question generated", date: today, data: inserted }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
