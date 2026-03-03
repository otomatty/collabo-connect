// supabase/functions/ai-interview/index.ts
// Supabase Edge Function: AIインタビュー
// Gemini API を使ってインタビュワーとして動的に質問し、自己紹介文を生成する

// Deno runtime 用の型宣言
declare const Deno: {
  env: { get(key: string): string | undefined };
  serve(handler: (req: Request) => Promise<Response> | Response): void;
};

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const PRIMARY_GEMINI_MODEL = "gemini-3.0-preview";
const FALLBACK_GEMINI_MODEL = "gemini-2.0-flash";

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
function buildGeminiUrl(model: string): string {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
}

async function requestGemini(model: string, body: unknown): Promise<Response> {
  return fetch(buildGeminiUrl(model), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
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

  let res = await requestGemini(PRIMARY_GEMINI_MODEL, body);
  if (res.status === 404) {
    console.warn(
      `Primary model '${PRIMARY_GEMINI_MODEL}' is unavailable. Falling back to '${FALLBACK_GEMINI_MODEL}'.`
    );
    res = await requestGemini(FALLBACK_GEMINI_MODEL, body);
  }

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

function buildFallbackQuestion(index: number): { message: string; options: string[] } {
  const fallbackQuestions = [
    {
      message: "最近いちばん楽しかったことは何ですか？",
      options: ["趣味の時間", "仕事の達成", "人との交流", "新しい挑戦"],
    },
    {
      message: "周りの人から、どんな人だと言われることが多いですか？",
      options: ["落ち着いている", "行動が速い", "よく気がつく", "話しやすい"],
    },
    {
      message: "今後チャレンジしてみたいことはありますか？",
      options: ["技術力アップ", "企画・提案", "発信活動", "新領域への挑戦"],
    },
  ];
  return fallbackQuestions[index % fallbackQuestions.length];
}

function buildFallbackIntro(profile: RequestBody["profile"], messages: ChatMessage[]): string {
  const userReplies = messages
    .filter((m) => m.role === "user")
    .map((m) => m.content)
    .slice(0, 3)
    .join("、");

  const roleText = profile.role ? `${profile.role}として` : "日々の業務で";
  const areasText = profile.areas?.length > 0 ? `主に${profile.areas.join("・")}を中心に活動しています。` : "さまざまな場面で活動しています。";
  const tagsText = profile.tags?.length > 0 ? `興味関心は${profile.tags.join("、")}です。` : "幅広いテーマに関心があります。";

  if (userReplies) {
    return `私は${roleText}、チームでの連携を大切にしながら取り組んでいます。${areasText}${tagsText}最近は「${userReplies}」といった話題に特に関心があり、仕事でもプライベートでも新しい学びを楽しんでいます。気軽に声をかけてもらえるとうれしいです。`;
  }

  return `私は${roleText}、周囲と協力しながら前向きに取り組むことを大切にしています。${areasText}${tagsText}仕事の話はもちろん、趣味や日常の話題でも気軽に交流できたらうれしいです。どうぞよろしくお願いします。`;
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
      try {
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
      } catch (error) {
        console.error("start action fallback:", error);
        const fallback = buildFallbackQuestion(0);
        return new Response(
          JSON.stringify({
            message: `こんにちは！自己紹介文作成のために、いくつか質問させてください。\n${fallback.message}`,
            options: fallback.options,
            done: false,
            fallback: true,
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // ---------- action: reply ----------
    if (action === "reply") {
      const questionCount = messages.filter((m) => m.role === "ai").length;

      try {
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
      } catch (error) {
        console.error("reply action fallback:", error);

        if (questionCount >= 5) {
          return new Response(
            JSON.stringify({
              message: "ありがとうございます！これで自己紹介文を作成しますね。",
              options: [],
              done: true,
              fallback: true,
            }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        const fallback = buildFallbackQuestion(questionCount);
        return new Response(
          JSON.stringify({
            message: `ありがとうございます、よく伝わりました！\n${fallback.message}`,
            options: fallback.options,
            done: false,
            fallback: true,
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // ---------- action: generate ----------
    if (action === "generate") {
      try {
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
      } catch (error) {
        console.error("generate action fallback:", error);
        return new Response(
          JSON.stringify({
            introduction: buildFallbackIntro(profile, messages),
            fallback: true,
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
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
