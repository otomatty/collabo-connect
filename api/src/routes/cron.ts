import { Router, type Request, type Response } from "express";
import { pool } from "../db.js";
import { getTodayInJst } from "../date-utils.js";
import { requireCronSecret } from "../middleware/cronAuth.js";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-3-flash-preview";

const FALLBACK_QUESTIONS: Array<{ question: string; options: string[] }> = [
  {
    question: "朝のスタートを気持ちよく切れる習慣はどれですか？",
    options: ["コーヒーを飲む", "音楽を流す", "散歩する", "今日の予定を整理する"],
  },
  {
    question: "最近ちょっとテンションが上がった出来事は何ですか？",
    options: ["美味しいものを食べた", "欲しかった物を手に入れた", "誰かに感謝された", "良い発見があった"],
  },
  {
    question: "チームで一緒に働くとき、自分が出しやすい強みはどれですか？",
    options: ["段取りを整える", "雰囲気を和らげる", "深く調べる", "まず動いて試す"],
  },
  {
    question: "休日に予定が空いたら、どんな過ごし方を選びがちですか？",
    options: ["家でゆっくりする", "外に出かける", "趣味に没頭する", "人と会う"],
  },
  {
    question: "新しいことを覚えるとき、一番しっくりくる方法はどれですか？",
    options: ["まず触ってみる", "調べてから始める", "人に聞きながら進める", "全体像を見てから整理する"],
  },
  {
    question: "作業に集中したいときの環境づくりで近いものはどれですか？",
    options: ["静かな場所に移動する", "BGMを流す", "タスクを細かく分ける", "時間を区切る"],
  },
  {
    question: "最近誰かと話してみたいテーマに近いものはどれですか？",
    options: ["仕事術", "趣味", "最近の学び", "おすすめの食べ物や店"],
  },
  {
    question: "つい人におすすめしたくなるものは何ですか？",
    options: ["アプリや便利ツール", "本や記事", "お店やスポット", "映画や動画"],
  },
  {
    question: "気分転換したいときに取りやすい行動はどれですか？",
    options: ["席を立つ", "雑談する", "甘いものや飲み物をとる", "別のタスクに切り替える"],
  },
  {
    question: "仕事でうれしい瞬間として一番近いものはどれですか？",
    options: ["相手に喜ばれたとき", "難しいことを解けたとき", "チームでやり切れたとき", "自分の成長を感じたとき"],
  },
  {
    question: "会話のきっかけになるとしたら話しやすい話題はどれですか？",
    options: ["最近ハマっていること", "住んでいるエリア", "学生時代の部活や経験", "好きな食べ物"],
  },
  {
    question: "もし短時間でリフレッシュするなら何を選びますか？",
    options: ["散歩", "仮眠", "雑談", "動画や記事を見る"],
  },
];

function hashText(value: string): number {
  let hash = 0;
  for (const char of value) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return hash;
}

function pickFallbackQuestion(today: string, recentQuestions: string[]): { question: string; options: string[] } {
  const recentSet = new Set(recentQuestions);
  const available = FALLBACK_QUESTIONS.filter((entry) => !recentSet.has(entry.question));
  const source = available.length > 0 ? available : FALLBACK_QUESTIONS;
  return source[hashText(today) % source.length];
}

async function generateQuestionWithGemini(today: string, recentList: string): Promise<{ question: string; options: string[] }> {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

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

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  const geminiRes = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      generationConfig: { temperature: 1.0, maxOutputTokens: 512, responseMimeType: "application/json" },
    }),
  });
  if (!geminiRes.ok) {
    const errText = await geminiRes.text();
    throw new Error(`Gemini API failed: ${errText}`);
  }

  const geminiData = (await geminiRes.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  const raw = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  let parsed: { question: string; options: string[] };
  try {
    parsed = JSON.parse(raw.trim()) as { question: string; options: string[] };
  } catch {
    const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match?.[1]) {
      parsed = JSON.parse(match[1].trim()) as { question: string; options: string[] };
    } else {
      const firstBrace = raw.indexOf("{");
      const lastBrace = raw.lastIndexOf("}");
      parsed = JSON.parse(raw.slice(firstBrace, lastBrace + 1)) as { question: string; options: string[] };
    }
  }
  if (!parsed.question || !Array.isArray(parsed.options) || parsed.options.length < 2) {
    throw new Error("Invalid question format from Gemini");
  }

  return parsed;
}

const router = Router();

router.post("/generate-daily-question", requireCronSecret, async (_req: Request, res: Response): Promise<void> => {
  try {
    const today = getTodayInJst();

    const existing = await pool.query(
      "SELECT id FROM public.ai_questions WHERE date = $1 LIMIT 1",
      [today]
    );
    if (existing.rows.length > 0) {
      res.json({ message: "Today's question already exists", date: today });
      return;
    }

    const recent = await pool.query<{ question: string }>(
      "SELECT question FROM public.ai_questions ORDER BY date DESC LIMIT 15"
    );
    const recentQuestions = recent.rows.map((row) => row.question);
    const recentList = recentQuestions.join("\n- ");

    let parsed: { question: string; options: string[] };
    let source: "gemini" | "fallback" = "gemini";
    try {
      parsed = await generateQuestionWithGemini(today, recentList);
    } catch (err) {
      source = "fallback";
      console.error("Gemini question generation failed, using fallback:", err);
      parsed = pickFallbackQuestion(today, recentQuestions);
    }

    const insert = await pool.query(
      "INSERT INTO public.ai_questions (question, options, date) VALUES ($1, $2, $3) RETURNING *",
      [parsed.question, parsed.options, today]
    );
    res.json({ message: "Question generated", date: today, source, data: insert.rows[0] });
  } catch (err) {
    console.error("generate-daily-question error:", err);
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
