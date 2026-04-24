import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { parseCommaSeparatedList } from "./env-utils.js";
import { auth } from "./auth.js";
import { getHealth } from "./routes/health.js";
import profilesRouter from "./routes/profiles.js";
import postingsRouter from "./routes/postings.js";
import participantsRouter from "./routes/participants.js";
import aiQuestionsRouter from "./routes/ai-questions.js";
import aiQuestionResponsesRouter from "./routes/ai-question-responses.js";
import aiInterviewRouter from "./routes/ai-interview.js";
import tagsRouter from "./routes/tags.js";
import cronRouter from "./routes/cron.js";

const app = express();
const port = process.env.PORT ?? 3000;

// credentials: true を使う場合は origin を明示する必要がある（* は不可）。複数指定時もカンマ区切りを正しくパースする。
const corsOrigins = (() => {
  const list = parseCommaSeparatedList(process.env.CORS_ORIGINS);
  return list.length > 0 ? list : ["http://localhost:8080", "http://localhost:5173"];
})();
app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.all("/api/auth/*", toNodeHandler(auth));
app.use(express.json({ limit: "5mb" }));

app.get("/api/health", getHealth);

app.use("/api/profiles", profilesRouter);
app.use("/api/postings", participantsRouter);
app.use("/api/postings", postingsRouter);
app.use("/api/ai-questions", aiQuestionsRouter);
app.use("/api/ai-question-responses", aiQuestionResponsesRouter);
app.use("/api/ai-interview", aiInterviewRouter);
app.use("/api/tags", tagsRouter);
app.use("/api/cron", cronRouter);

app.listen(port, () => {
  console.log(`API listening on port ${port}`);
});
