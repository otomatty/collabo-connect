import { pool } from "../db.js";
import { isTagCategory, TAG_CATEGORIES } from "../services/tags.js";
import type { Tag, TagCategory } from "../types.js";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-3-flash-preview";
const MAX_TURNS = 5;
/** Per-call cap on the Gemini fetch. Without this the request can hang, which
 *  defeats the "return [] on error" contract callers rely on. */
const GEMINI_TIMEOUT_MS = 30_000;
const SEARCH_TAGS_DEFAULT_LIMIT = 20;
const SEARCH_TAGS_MAX_LIMIT = 50;
const POPULAR_TAGS_DEFAULT_LIMIT = 10;
const POPULAR_TAGS_MAX_LIMIT = 30;

export interface ExtractedTag {
  name: string;
  /** Resolved tag id when the agent matched an existing entry. null when proposing a new tag. */
  existing_id: string | null;
  confidence: "high" | "medium";
  source_quote: string;
  category: TagCategory;
  reason: string;
}

export interface ExtractInputProfile {
  name?: string | null;
  role?: string | null;
  job_type?: string | null;
  areas?: string[] | null;
  tags?: string[] | null;
}

export interface ExtractInput {
  /** Free-form text — typically the AI interview transcript or a single answer. */
  conversation: string;
  profile: ExtractInputProfile;
}

interface GeminiPart {
  text?: string;
  functionCall?: { name: string; args?: Record<string, unknown> };
  functionResponse?: { name: string; response: unknown };
}

interface GeminiContent {
  role: "user" | "model";
  parts: GeminiPart[];
}

interface GeminiResponse {
  candidates?: { content?: { parts?: GeminiPart[] }; finishReason?: string }[];
}

const SEARCH_LIMIT_DESC = `返却件数（既定 ${SEARCH_TAGS_DEFAULT_LIMIT}、最大 ${SEARCH_TAGS_MAX_LIMIT}）`;
const POPULAR_LIMIT_DESC = `返却件数（既定 ${POPULAR_TAGS_DEFAULT_LIMIT}、最大 ${POPULAR_TAGS_MAX_LIMIT}）`;

const TOOL_DECLARATIONS = [
  {
    name: "search_tags",
    description:
      "既存タグ辞書を name / aliases に対する大文字小文字を区別しない部分一致で検索し、usage_count 降順で返す。新規タグを提案する前に必ず使ってください。",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "検索キーワード（例: \"React\"）" },
        limit: { type: "number", description: SEARCH_LIMIT_DESC },
      },
      required: ["query"],
    },
  },
  {
    name: "list_popular_tags",
    description:
      "指定カテゴリで usage_count 上位のタグを返す。skill / hobby / area / role を網羅したい時に使う。",
    parameters: {
      type: "object",
      properties: {
        category: {
          type: "string",
          enum: ["skill", "hobby", "area", "role"],
        },
        limit: { type: "number", description: POPULAR_LIMIT_DESC },
      },
      required: ["category", "limit"],
    },
  },
  {
    name: "propose_new_tag",
    description:
      "search_tags で十分に探した上で既存辞書に存在しない場合のみ呼ぶ。実際には tags へ INSERT せず、後段の承認フローで扱う合図。",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string" },
        category: {
          type: "string",
          enum: TAG_CATEGORIES,
        },
        reason: { type: "string", description: "なぜそのタグを新規追加すべきかの根拠" },
      },
      required: ["name", "category", "reason"],
    },
  },
];

const SYSTEM_INSTRUCTION = `あなたは「Collabo Connect」社内アプリのタグ抽出エージェントです。
ユーザーの会話・プロフィール情報からその人を表すタグ（skill / hobby / area / role）を抽出し、既存タグ辞書と照合します。

## 利用可能なツール
- search_tags(query, limit?): 既存タグを name / aliases で部分一致検索
- list_popular_tags(category, limit): カテゴリ別の人気タグ一覧
- propose_new_tag(name, category, reason): 既存辞書にない新規タグを提案（承認待ちキューへ送る）

## 推奨される進め方
1. 会話とプロフィールを読み、抽出候補となる固有表現や技能・嗜好・地域・役割を洗い出す
2. 候補ごとに search_tags を呼び、既存タグへ解決する
3. どうしても見つからない時のみ propose_new_tag を呼ぶ（同じ name を二度提案しない）
4. ツールは必要最小限で。最大 5 往復以内に最終回答へ到達すること
5. 最終回答は **JSON のみ** をテキスト出力する（ツールは呼ばない）

## 信頼度ルール
- high: 明示的な発言で skill / role 系（例: 「React を3年使っている」「PMをしている」）
- medium: 暗示的・hobby / area 系、または推測の余地がある場合
- low: 推測のみ → 出力に含めない（破棄する）

## 最終出力フォーマット
\`\`\`json
{
  "tags": [
    {
      "name": "React",
      "existing_id": "<search_tags が返した id。無ければ null>",
      "confidence": "high" | "medium",
      "source_quote": "発言からの抜粋（短く）",
      "category": "skill" | "hobby" | "area" | "role" | "other",
      "reason": "なぜこのタグを抽出したか"
    }
  ]
}
\`\`\`
他のテキスト・コードブロック装飾は一切付けない。tags が無ければ \`{"tags": []}\` を返す。`;

function clampInt(n: unknown, fallback: number, max: number): number {
  const num = typeof n === "number" ? n : Number.parseInt(String(n ?? ""), 10);
  if (!Number.isFinite(num) || num <= 0) return fallback;
  return Math.min(Math.floor(num), max);
}

function escapeLikePattern(s: string): string {
  return s.replace(/[\\%_]/g, "\\$&");
}

function tagToToolPayload(t: Tag) {
  return {
    id: t.id,
    name: t.name,
    aliases: t.aliases,
    category: t.category,
    usage_count: t.usage_count,
  };
}

async function searchTags(query: string, limit: number): Promise<Tag[]> {
  const trimmed = query.trim();
  if (trimmed === "") return [];
  const r = await pool.query<Tag>(
    `SELECT * FROM public.tags
      WHERE name ILIKE $1 ESCAPE '\\'
         OR EXISTS (
              SELECT 1 FROM unnest(coalesce(aliases, '{}'::text[])) a
               WHERE a ILIKE $1 ESCAPE '\\'
            )
      ORDER BY usage_count DESC, name ASC
      LIMIT $2`,
    [`%${escapeLikePattern(trimmed)}%`, limit]
  );
  return r.rows;
}

async function listPopularTags(category: TagCategory, limit: number): Promise<Tag[]> {
  const r = await pool.query<Tag>(
    `SELECT * FROM public.tags
      WHERE category = $1
      ORDER BY usage_count DESC, name ASC
      LIMIT $2`,
    [category, limit]
  );
  return r.rows;
}

async function executeTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  if (name === "search_tags") {
    const query = typeof args.query === "string" ? args.query : "";
    const limit = clampInt(args.limit, SEARCH_TAGS_DEFAULT_LIMIT, SEARCH_TAGS_MAX_LIMIT);
    const rows = await searchTags(query, limit);
    return { tags: rows.map(tagToToolPayload) };
  }
  if (name === "list_popular_tags") {
    const rawCategory = args.category;
    if (!isTagCategory(rawCategory) || rawCategory === "other") {
      return { error: "category must be one of skill / hobby / area / role" };
    }
    const limit = clampInt(args.limit, POPULAR_TAGS_DEFAULT_LIMIT, POPULAR_TAGS_MAX_LIMIT);
    const rows = await listPopularTags(rawCategory, limit);
    return { tags: rows.map(tagToToolPayload) };
  }
  if (name === "propose_new_tag") {
    // Per Phase 2 design we never INSERT into tags here. The agent uses the acknowledgement
    // to decide whether to include the proposal in its final answer; persistSuggestions
    // is the only path that may write a row (into suggested_tags as proposed_name).
    return { accepted: true };
  }
  return { error: `unknown function: ${name}` };
}

function buildUserPrompt(input: ExtractInput): string {
  const profile = input.profile ?? {};
  const profileLines = [
    profile.name ? `- 名前: ${profile.name}` : null,
    profile.role ? `- 役割: ${profile.role}` : null,
    profile.job_type ? `- 職種: ${profile.job_type}` : null,
    profile.areas && profile.areas.length > 0 ? `- エリア: ${profile.areas.join(", ")}` : null,
    profile.tags && profile.tags.length > 0 ? `- 既に付与済みのタグ: ${profile.tags.join(", ")}` : null,
  ].filter((line): line is string => line !== null);

  const profileBlock = profileLines.length > 0 ? profileLines.join("\n") : "（プロフィール情報なし）";
  const conversation = (input.conversation ?? "").trim() || "（発言なし）";

  return [
    "## プロフィール",
    profileBlock,
    "",
    "## 会話 / 回答",
    conversation,
    "",
    "## 指示",
    "上記をもとに、必要に応じてツールを使いながらタグ候補を抽出してください。最終回答は JSON のみで返してください。",
  ].join("\n");
}

function parseJsonFromText(text: string): unknown {
  const cleaned = text.trim();
  if (!cleaned) return null;
  try {
    return JSON.parse(cleaned);
  } catch {
    // try code block
  }
  const match = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (match?.[1]) {
    try {
      return JSON.parse(match[1].trim());
    } catch {
      // fallthrough
    }
  }
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    try {
      return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
    } catch {
      // fallthrough
    }
  }
  return null;
}

function normalizeExtractedTags(parsed: unknown): ExtractedTag[] {
  if (!parsed || typeof parsed !== "object") return [];
  const raw = (parsed as { tags?: unknown }).tags;
  if (!Array.isArray(raw)) return [];

  const out: ExtractedTag[] = [];
  const seenNames = new Set<string>();

  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const e = entry as Record<string, unknown>;

    const name = typeof e.name === "string" ? e.name.trim() : "";
    if (!name) continue;

    const dedupKey = name.toLowerCase();
    if (seenNames.has(dedupKey)) continue;

    const confidence = e.confidence;
    if (confidence !== "high" && confidence !== "medium") continue;

    const category = isTagCategory(e.category) ? e.category : "other";
    const existingId = typeof e.existing_id === "string" && e.existing_id.length > 0 ? e.existing_id : null;
    const sourceQuote = typeof e.source_quote === "string" ? e.source_quote : "";
    const reason = typeof e.reason === "string" ? e.reason : "";

    seenNames.add(dedupKey);
    out.push({
      name,
      existing_id: existingId,
      confidence,
      source_quote: sourceQuote,
      category,
      reason,
    });
  }
  return out;
}

/**
 * Run the tag extraction agent over a conversation/profile.
 *
 * Loops up to MAX_TURNS function-calling rounds. Returns an empty array on any
 * error (missing API key, network failure, malformed response) so callers can
 * keep their UX flow uninterrupted.
 */
export async function extractTags(input: ExtractInput): Promise<ExtractedTag[]> {
  if (!GEMINI_API_KEY) {
    console.warn("tag-extractor: GEMINI_API_KEY is not configured; returning empty array");
    return [];
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  const contents: GeminiContent[] = [
    { role: "user", parts: [{ text: buildUserPrompt(input) }] },
  ];

  try {
    for (let turn = 0; turn < MAX_TURNS; turn++) {
      const body = {
        system_instruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
        contents,
        tools: [{ functionDeclarations: TOOL_DECLARATIONS }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 2048,
        },
      };
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);
      let res: Response;
      try {
        res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }
      if (!res.ok) {
        console.error("tag-extractor: Gemini API error:", res.status, await res.text());
        return [];
      }
      const data = (await res.json()) as GeminiResponse;
      const parts = data.candidates?.[0]?.content?.parts ?? [];

      const functionCalls = parts.filter(
        (p): p is GeminiPart & { functionCall: { name: string; args?: Record<string, unknown> } } =>
          Boolean(p.functionCall)
      );

      if (functionCalls.length === 0) {
        const text = parts
          .map((p) => p.text)
          .filter((t): t is string => typeof t === "string" && t.length > 0)
          .join("");
        const parsed = parseJsonFromText(text);
        return normalizeExtractedTags(parsed);
      }

      // Echo the model turn back into the conversation so Gemini sees its own
      // function_call alongside the response on the next round.
      contents.push({ role: "model", parts });

      const responseParts: GeminiPart[] = [];
      for (const part of functionCalls) {
        const { name, args } = part.functionCall;
        let result: unknown;
        try {
          result = await executeTool(name, args ?? {});
        } catch (err) {
          console.error(`tag-extractor: tool ${name} failed:`, err);
          result = { error: (err as Error).message };
        }
        responseParts.push({ functionResponse: { name, response: result as Record<string, unknown> } });
      }
      contents.push({ role: "user", parts: responseParts });
    }
    console.warn(`tag-extractor: reached MAX_TURNS (${MAX_TURNS}) without final answer`);
    return [];
  } catch (err) {
    console.error("tag-extractor: unexpected error:", err);
    return [];
  }
}
