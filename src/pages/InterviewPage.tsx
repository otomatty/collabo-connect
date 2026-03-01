import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Send } from "lucide-react";
import { mockQuestions } from "@/lib/mockData";

interface Message {
  id: string;
  type: "question" | "answer";
  content: string;
  options?: string[];
}

export default function InterviewPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "m1",
      type: "question",
      content: mockQuestions[0].question,
      options: mockQuestions[0].options,
    },
  ]);
  const [freeText, setFreeText] = useState("");
  const [questionIdx, setQuestionIdx] = useState(0);

  const handleAnswer = (answer: string) => {
    const newMessages: Message[] = [
      ...messages,
      { id: `a${questionIdx}`, type: "answer", content: answer },
    ];

    const nextIdx = questionIdx + 1;
    if (nextIdx < mockQuestions.length) {
      newMessages.push({
        id: `q${nextIdx}`,
        type: "question",
        content: mockQuestions[nextIdx].question,
        options: mockQuestions[nextIdx].options,
      });
      setQuestionIdx(nextIdx);
    } else {
      newMessages.push({
        id: "done",
        type: "question",
        content: "ありがとうございます！今日の質問は以上です。あなたのプロフィールが更新されました 🎉",
      });
    }

    setMessages(newMessages);
    setFreeText("");
  };

  const lastMessage = messages[messages.length - 1];

  return (
    <div className="mx-auto max-w-lg px-4 py-6 space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold">AIインタビュー</h1>
      </div>

      <div className="space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.type === "answer" ? "justify-end" : "justify-start"}`}
          >
            <Card
              className={`max-w-[85%] ${
                msg.type === "answer"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-warm-light/50"
              }`}
            >
              <CardContent className="p-3 space-y-2">
                <p className="text-sm">{msg.content}</p>
                {msg.options && msg.id === lastMessage.id && lastMessage.type === "question" && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {msg.options.map((opt) => (
                      <Button
                        key={opt}
                        variant="outline"
                        size="sm"
                        className="rounded-full border-border bg-card text-card-foreground text-xs"
                        onClick={() => handleAnswer(opt)}
                      >
                        {opt}
                      </Button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      {lastMessage.type === "question" && lastMessage.id !== "done" && (
        <div className="flex gap-2 pt-2">
          <Input
            placeholder="自由に入力..."
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            className="rounded-full"
            onKeyDown={(e) => {
              if (e.key === "Enter" && freeText.trim()) handleAnswer(freeText.trim());
            }}
          />
          <Button
            size="icon"
            className="rounded-full shrink-0"
            disabled={!freeText.trim()}
            onClick={() => handleAnswer(freeText.trim())}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
