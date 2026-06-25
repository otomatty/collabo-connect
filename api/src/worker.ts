import { Hono } from "hono";
import { cors } from "hono/cors";
import { getAuth } from "./auth.js";
import { createDb } from "./db.js";
import { parseCommaSeparatedList } from "./env-utils.js";
import { runGenerateDailyQuestion } from "./routes/cron.js";
import profilesRouter from "./routes/profiles.js";
import postingsRouter from "./routes/postings.js";
import participantsRouter from "./routes/participants.js";
import aiQuestionsRouter from "./routes/ai-questions.js";
import aiQuestionResponsesRouter from "./routes/ai-question-responses.js";
import aiInterviewRouter from "./routes/ai-interview.js";
import tagsRouter from "./routes/tags.js";
import suggestedTagsRouter from "./routes/suggested-tags.js";
import cronRouter from "./routes/cron.js";
import type { AppContext, Env } from "./bindings.js";

const DEFAULT_ORIGINS = ["http://localhost:8080", "http://localhost:5173"];

const app = new Hono<AppContext>();

// CORS. credentials: true requires echoing an explicit origin (never `*`).
app.use(
  "*",
  cors({
    origin: (origin, c) => {
      const list = parseCommaSeparatedList(c.env.CORS_ORIGINS);
      const allowed = list.length > 0 ? list : DEFAULT_ORIGINS;
      return allowed.includes(origin) ? origin : allowed[0];
    },
    credentials: true,
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
);

// Provide a D1-backed pg-compatible db client to every handler.
app.use("*", async (c, next) => {
  c.set("db", createDb(c.env.DB));
  await next();
});

// Better Auth handles all of /api/auth/* (magic link, session, sign-in/out).
app.on(["GET", "POST"], "/api/auth/*", (c) => getAuth(c.env).handler(c.req.raw));

app.get("/api/health", (c) => c.json({ status: "ok" }));

app.route("/api/profiles", profilesRouter);
app.route("/api/postings", participantsRouter);
app.route("/api/postings", postingsRouter);
app.route("/api/ai-questions", aiQuestionsRouter);
app.route("/api/ai-question-responses", aiQuestionResponsesRouter);
app.route("/api/ai-interview", aiInterviewRouter);
app.route("/api/tags", tagsRouter);
app.route("/api/suggested-tags", suggestedTagsRouter);
app.route("/api/cron", cronRouter);

export default {
  fetch: app.fetch,
  // Cloudflare Cron Trigger — replaces the Railway daily cron. Schedule is set
  // in wrangler.toml (`[triggers] crons`); JST 00:00 = UTC 15:00.
  async scheduled(_event: ScheduledController, env: Env, ctx: ExecutionContext) {
    const db = createDb(env.DB);
    ctx.waitUntil(
      runGenerateDailyQuestion(db, env.GEMINI_API_KEY)
        .then((r) => console.log("cron generate-daily-question:", r.message))
        .catch((err) => console.error("cron generate-daily-question failed:", err))
    );
  },
};
