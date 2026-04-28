import { createHash } from "node:crypto";
import { pool } from "../db.js";
import {
  CONVERSATION_TOPICS_COUNT,
  CONVERSATION_TOPICS_SYSTEM_PROMPT,
  buildConversationTopicsUserPrompt,
  type ConversationTopicsPromptInput,
} from "../prompts/conversation-topics.js";
import type { ConversationTopic } from "../types.js";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-3-flash-preview";
const GEMINI_TIMEOUT_MS = 30_000;

const TOPIC_EMOJI_MAX = 16;
const TOPIC_TITLE_MAX = 100;
const TOPIC_DESCRIPTION_MAX = 500;

export type ConversationTopicsInput = ConversationTopicsPromptInput;

interface GeminiResponse {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
}

function buildGeminiUrl(): string {
  return `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
}

async function callGemini(systemPrompt: string, userPrompt: string): Promise<string> {
  const body = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1024,
      responseMimeType: "application/json",
    },
  };
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);
  try {
    const res = await fetch(buildGeminiUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini API error ${res.status}: ${errText}`);
    }
    const data = (await res.json()) as GeminiResponse;
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  } finally {
    clearTimeout(timeoutId);
  }
}

function parseJsonFromText(text: string): unknown {
  const cleaned = text.trim();
  if (!cleaned) return null;
  try {
    return JSON.parse(cleaned);
  } catch {
    // try code-block
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

/**
 * Extract `topics` array from Gemini's JSON response and apply schema bounds
 * matching the PUT /api/profiles/me validator.
 *
 * Trims oversized fields and drops malformed entries instead of throwing so a
 * single bad item doesn't lose the rest of the model's output. Caller checks
 * length to decide whether to persist.
 */
function normalizeTopics(parsed: unknown): ConversationTopic[] {
  if (!parsed || typeof parsed !== "object") return [];
  const raw = (parsed as { topics?: unknown }).topics;
  if (!Array.isArray(raw)) return [];

  const out: ConversationTopic[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const e = entry as Record<string, unknown>;
    const emoji = typeof e.emoji === "string" ? e.emoji.trim() : "";
    const title = typeof e.title === "string" ? e.title.trim() : "";
    const description = typeof e.description === "string" ? e.description.trim() : "";
    if (!title) continue;
    out.push({
      emoji: emoji.slice(0, TOPIC_EMOJI_MAX),
      title: title.slice(0, TOPIC_TITLE_MAX),
      description: description.slice(0, TOPIC_DESCRIPTION_MAX),
    });
    if (out.length >= CONVERSATION_TOPICS_COUNT) break;
  }
  return out;
}

/**
 * Run Gemini to generate conversation topics. Returns [] on any error so
 * callers can fall back to keeping the existing value.
 */
export async function generateConversationTopics(
  input: ConversationTopicsInput
): Promise<ConversationTopic[]> {
  if (!GEMINI_API_KEY) {
    console.warn("conversation-topics: GEMINI_API_KEY is not configured; skipping");
    return [];
  }
  try {
    const userPrompt = buildConversationTopicsUserPrompt(input);
    const raw = await callGemini(CONVERSATION_TOPICS_SYSTEM_PROMPT, userPrompt);
    const parsed = parseJsonFromText(raw);
    return normalizeTopics(parsed);
  } catch (err) {
    console.error("conversation-topics: generation failed:", err);
    return [];
  }
}

/**
 * Persist generated topics on the profile row. Returns true iff a profile row
 * was actually updated, so callers can distinguish "saved" from "user has no
 * profile row yet" — the latter must not be cached as committed.
 *
 * Only writes when the topic count matches the spec (3); a partial result
 * preserves the previous value rather than overwriting it with a worse set.
 *
 * `conversation_topics_updated_at` is bumped only when the value actually
 * changes (matches the CASE expression used by PUT /api/profiles/me) so
 * regenerating to identical content does not invalidate the freshness signal.
 */
export async function saveConversationTopics(
  userId: string,
  topics: ConversationTopic[]
): Promise<boolean> {
  if (topics.length !== CONVERSATION_TOPICS_COUNT) return false;
  const r = await pool.query(
    `UPDATE public.profiles
        SET conversation_topics = $2::jsonb,
            conversation_topics_updated_at = CASE
              WHEN conversation_topics IS DISTINCT FROM $2::jsonb THEN now()
              ELSE conversation_topics_updated_at
            END
      WHERE id = $1`,
    [userId, JSON.stringify(topics)]
  );
  return (r.rowCount ?? 0) > 0;
}

/**
 * Idempotency window for fire-and-forget invocations against the same
 * (user, input) fingerprint. Mirrors the rationale in tag-suggestions:
 * the frontend may resubmit `generate` (retry, double click, route remount)
 * within seconds, and the regenerate button on MyPage is similarly
 * easy to spam. Caching here avoids the duplicate Gemini round trip.
 */
const RECENT_TOPICS_TTL_MS = 5 * 60 * 1000;
const RECENT_TOPICS_MAX_ENTRIES = 1000;
const recentTopicsHashes = new Map<string, number>();

function pruneRecentTopicsHashes(now: number): void {
  for (const [key, ts] of recentTopicsHashes) {
    if (now - ts > RECENT_TOPICS_TTL_MS) {
      recentTopicsHashes.delete(key);
    }
  }
  if (recentTopicsHashes.size > RECENT_TOPICS_MAX_ENTRIES) {
    const overflow = recentTopicsHashes.size - RECENT_TOPICS_MAX_ENTRIES;
    const it = recentTopicsHashes.keys();
    for (let i = 0; i < overflow; i++) {
      const k = it.next().value;
      if (k === undefined) break;
      recentTopicsHashes.delete(k);
    }
  }
}

/**
 * Fingerprint stable request inputs only.
 *
 * `aiIntro` is intentionally excluded: at the fire-and-forget call site in
 * ai-interview.ts the value passed is the freshly-generated introduction
 * from Gemini (temperature 0.8), which is non-deterministic. Including it
 * would mean every retry of the same generate action produces a different
 * fingerprint, defeating the purpose of the dedup cache. profile + personCard
 * are sufficient to identify the same interview session — this mirrors
 * tag-suggestions.ts's fingerprintInterview, which uses messages + personCard.
 */
function fingerprintInput(userId: string, input: ConversationTopicsInput): string {
  const profile = input.profile ?? {};
  const payload = JSON.stringify({
    name: profile.name ?? "",
    role: profile.role ?? "",
    job_type: profile.job_type ?? "",
    tags: [...(profile.tags ?? [])].sort(),
    personCard: typeof input.personCard === "string" ? input.personCard.trim() : "",
  });
  return createHash("sha256").update(userId).update(" ").update(payload).digest("hex");
}

/**
 * Fire-and-forget orchestration: generate topics for `userId` and save them.
 * Never throws — errors are logged so the caller (interview `generate`
 * response, regenerate endpoint) can return without waiting on this work.
 *
 * Idempotency: the same (userId, input) fingerprint is suppressed for a
 * short window. The cache slot is cleared on failure so a transient Gemini
 * error doesn't lock the user out of legitimate retries.
 */
export async function generateAndSaveConversationTopics(
  userId: string,
  input: ConversationTopicsInput
): Promise<void> {
  if (!userId) {
    console.warn("generateAndSaveConversationTopics: missing userId; skipping");
    return;
  }

  const key = fingerprintInput(userId, input);
  const now = Date.now();
  pruneRecentTopicsHashes(now);
  const seenAt = recentTopicsHashes.get(key);
  if (seenAt !== undefined && now - seenAt <= RECENT_TOPICS_TTL_MS) {
    return;
  }
  recentTopicsHashes.set(key, now);

  let committed = false;
  try {
    const topics = await generateConversationTopics(input);
    if (topics.length < CONVERSATION_TOPICS_COUNT) {
      // Preserve existing value on incomplete/failed generation. A partial
      // set (1-2 valid topics out of 3) would otherwise overwrite a complete
      // prior set with a worse one.
      return;
    }
    const saved = await saveConversationTopics(userId, topics);
    if (!saved) {
      // Profile row missing — don't cache as committed, so a later retry
      // (after the row gets created) can run again instead of being
      // suppressed for the full TTL.
      return;
    }
    committed = true;
    console.log(
      `generateAndSaveConversationTopics: user=${userId} saved=${topics.length}`
    );
  } catch (err) {
    console.error("generateAndSaveConversationTopics: failed:", err);
  } finally {
    if (!committed) {
      recentTopicsHashes.delete(key);
    }
  }
}
