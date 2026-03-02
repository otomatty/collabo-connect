import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Check } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { useAuth } from "@/hooks/useAuth";
import { useAIQuestions, useAnswerQuestion } from "@/hooks/useAIQuestions";

interface Message {
  id: string;
  type: "question" | "answer";
  content: string;
  options?: string[];
  multiSelect?: boolean;
  questionId?: string;
}

export default function InterviewPage() {
  const { user } = useAuth();
  const { data: questions, isLoading } = useAIQuestions();
  const answerMutation = useAnswerQuestion();

  const [messages, setMessages] = useState<Message[]>([]);
  const [freeText, setFreeText] = useState("");
  const [questionIdx, setQuestionIdx] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  // 質問がロードされたら最初の質問を表示
  useEffect(() => {
    if (questions && questions.length > 0 && messages.length === 0) {
      setMessages([
        {
          id: "m1",
          type: "question",
          content: questions[0].question,
          options: questions[0].options,
          multiSelect: true,
          questionId: questions[0].id,
        },
      ]);
    }
  }, [questions, messages.length]);

  const pushNextQuestion = (currentMessages: Message[], nextIdx: number): Message[] => {
    if (questions && nextIdx < questions.length) {
      currentMessages.push({
        id: `q${nextIdx}`,
        type: "question",
        content: questions[nextIdx].question,
        options: questions[nextIdx].options,
        multiSelect: true,
        questionId: questions[nextIdx].id,
      });
      setQuestionIdx(nextIdx);
    } else {
      currentMessages.push({
        id: "done",
        type: "question",
        content: "ありがとうございます！今日の質問は以上です。あなたのプロフィールが更新されました 🎉",
      });
    }
    return currentMessages;
  };

  const handleAnswer = (answer: string) => {
    // Supabaseに回答を保存
    const currentQuestion = questions?.[questionIdx];
    if (currentQuestion && user) {
      answerMutation.mutate({
        questionId: currentQuestion.id,
        userId: user.id,
        answer,
      });
    }

    const newMessages: Message[] = [
      ...messages,
      { id: `a${questionIdx}`, type: "answer", content: answer },
    ];
    setMessages(pushNextQuestion(newMessages, questionIdx + 1));
    setFreeText("");
    setSelectedOptions([]);
  };

  const toggleOption = (opt: string) => {
    setSelectedOptions((prev) =>
      prev.includes(opt) ? prev.filter((o) => o !== opt) : [...prev, opt]
    );
  };

  const submitSelected = () => {
    if (selectedOptions.length > 0) {
      handleAnswer(selectedOptions.join("、"));
    }
  };

  const lastMessage = messages[messages.length - 1];

  return (
    <div className="mx-auto max-w-lg px-4 py-6 space-y-4">
      <AppHeader title="AIインタビュー" back />

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
                  <div className="space-y-2 pt-1">
                    <p className="text-xs text-muted-foreground">複数選択可</p>
                    <div className="flex flex-wrap gap-2">
                      {msg.options.map((opt) => {
                        const isSelected = selectedOptions.includes(opt);
                        return (
                          <Button
                            key={opt}
                            variant="outline"
                            size="sm"
                            className={`rounded-full text-xs gap-1.5 ${
                              isSelected
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border bg-card text-card-foreground"
                            }`}
                            onClick={() => toggleOption(opt)}
                          >
                            {isSelected && <Check className="h-3 w-3" />}
                            {opt}
                          </Button>
                        );
                      })}
                    </div>
                    {selectedOptions.length > 0 && (
                      <Button
                        size="sm"
                        className="rounded-full w-full mt-1"
                        onClick={submitSelected}
                      >
                        回答する（{selectedOptions.length}件選択中）
                      </Button>
                    )}
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
