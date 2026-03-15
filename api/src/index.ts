import express from "express";
import cors from "cors";
import { getHealth } from "./routes/health.js";
import profilesRouter from "./routes/profiles.js";
import postingsRouter from "./routes/postings.js";
import participantsRouter from "./routes/participants.js";
import aiQuestionsRouter from "./routes/ai-questions.js";
import aiQuestionResponsesRouter from "./routes/ai-question-responses.js";
import aiInterviewRouter from "./routes/ai-interview.js";
import cronRouter from "./routes/cron.js";

const app = express();
const port = process.env.PORT ?? 3000;

app.use(cors({ origin: true }));
app.use(express.json());

app.get("/api/health", getHealth);

app.use("/api/profiles", profilesRouter);
app.use("/api/postings", participantsRouter);
app.use("/api/postings", postingsRouter);
app.use("/api/ai-questions", aiQuestionsRouter);
app.use("/api/ai-question-responses", aiQuestionResponsesRouter);
app.use("/api/ai-interview", aiInterviewRouter);
app.use("/api/cron", cronRouter);

app.listen(port, () => {
  console.log(`API listening on port ${port}`);
});
