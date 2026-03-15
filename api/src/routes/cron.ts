import { Router, type Request, type Response } from "express";
import { pool } from "../db.js";
import { requireCronSecret } from "../middleware/cronAuth.js";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-3-flash-preview";

const router = Router();

router.post("/generate-daily-question", requireCronSecret, async (_req: Request, res: Response): Promise<void> => {
  if (!GEMINI_API_KEY) {
    res.status(503).json({ error: "GEMINI_API_KEY is not configured" });
    return;
  }
  try {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    const today = `${y}-${m}-${d}`;

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
    const recentList = recent.rows.map((r) => r.question).join("\n- ");

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
      console.error("Gemini API error:", errText);
      res.status(502).json({ error: "Gemini API failed" });
      return;
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
      res.status(502).json({ error: "Invalid question format from Gemini" });
      return;
    }

    const insert = await pool.query(
      "INSERT INTO public.ai_questions (question, options, date) VALUES ($1, $2, $3) RETURNING *",
      [parsed.question, parsed.options, today]
    );
    res.json({ message: "Question generated", date: today, data: insert.rows[0] });
  } catch (err) {
    console.error("generate-daily-question error:", err);
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
