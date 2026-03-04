import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Send,
  Check,
  Loader2,
  Sparkles,
  RefreshCw,
  Pencil,
  Save,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import UserAvatar from "@/components/UserAvatar";
import { useAuth } from "@/hooks/useAuth";
import { useUpdateProfile } from "@/hooks/useProfiles";
import { useAIInterview } from "@/hooks/useAIInterview";
import type { PastResponse } from "@/hooks/useAIInterview";
import { useMyResponses } from "@/hooks/useAIQuestions";
import { toast } from "@/hooks/use-toast";

export default function InterviewPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const updateProfile = useUpdateProfile();
  const { data: myResponses } = useMyResponses(user?.id);

  // 事前回答を PastResponse[] 形式に変換
  const pastResponses: PastResponse[] = (myResponses ?? []).map((r) => ({
    question: typeof r.question === "object" && r.question !== null ? (r.question as { question?: string }).question ?? "" : "",
    answer: r.answer,
  }));
  const {
    messages,
    phase,
    generatedIntro,
    isLoading,
    error,
    interviewDone,
    startInterview,
    sendReply,
    generateIntro,
    reset,
  } = useAIInterview();

  const [freeText, setFreeText] = useState("");
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [editedIntro, setEditedIntro] = useState("");
  const [isEditingIntro, setIsEditingIntro] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // プロフィール情報をまとめる
  const profileForAI = profile
    ? {
        name: profile.name,
        role: profile.role,
        job_type: profile.job_type ?? "",
        areas: profile.areas,
        tags: profile.tags,
        ai_intro: profile.ai_intro,
      }
    : { name: "", role: "", job_type: "", areas: [], tags: [], ai_intro: "" };

  // 生成結果が出たら編集フィールドに反映
  useEffect(() => {
    if (generatedIntro) {
      setEditedIntro(generatedIntro);
    }
  }, [generatedIntro]);

  // メッセージ追加時に自動スクロール
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, phase]);

  /** 選択肢のトグル */
  const toggleOption = (opt: string) => {
    setSelectedOptions((prev) =>
      prev.includes(opt) ? prev.filter((o) => o !== opt) : [...prev, opt]
    );
  };

  /** 選択肢で回答 */
  const submitSelected = () => {
    if (selectedOptions.length === 0) return;
    const answer = selectedOptions.join("、");
    sendReply(answer, profileForAI, pastResponses);
    setSelectedOptions([]);
    setFreeText("");
  };

  /** 自由テキストで回答 */
  const submitFreeText = () => {
    const text = freeText.trim();
    if (!text) return;
    // 選択肢がある場合は選択肢と合わせる
    const answer =
      selectedOptions.length > 0
        ? `${selectedOptions.join("、")}（${text}）`
        : text;
    sendReply(answer, profileForAI, pastResponses);
    setSelectedOptions([]);
    setFreeText("");
  };

  /** 自己紹介文をプロフィールに保存 */
  const handleSaveIntro = () => {
    if (!user) return;
    updateProfile.mutate(
      { id: user.id, updates: { ai_intro: editedIntro } },
      {
        onSuccess: () => {
          toast({ title: "自己紹介文を保存しました！" });
          navigate("/mypage");
        },
      }
    );
  };

  // 最後のAIメッセージかどうかを判定
  const lastAiMessageIndex = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "ai") return i;
    }
    return -1;
  })();

  return (
    <div className="mx-auto max-w-lg px-4 py-6 flex flex-col min-h-[calc(100dvh-4rem)]">
      <AppHeader title="AIインタビュー" back />

      {/* 開始前の画面 */}
      {phase === "idle" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center px-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">
              AIインタビューで自己紹介を作ろう
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              AIがあなたにいくつか質問します。
              <br />
              選択肢を選んだり、自由に答えるだけで
              <br />
              あなたらしい自己紹介文が完成します！
            </p>
          </div>
          <Button
            size="lg"
            className="rounded-full px-8 gap-2"
            onClick={() => startInterview(profileForAI, pastResponses)}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            インタビューを始める
          </Button>
        </div>
      )}

      {/* チャット画面 */}
      {(phase === "interviewing" || phase === "generating") && (
        <>
          <div className="flex-1 space-y-3 py-4 overflow-y-auto">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-2 ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.role === "ai" && (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                )}
                <Card
                  className={`max-w-[80%] ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card"
                  }`}
                >
                  <CardContent className="p-3 space-y-2">
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>

                    {/* 最後のAIメッセージの選択肢のみ表示 */}
                    {msg.role === "ai" &&
                      msg.options &&
                      msg.options.length > 0 &&
                      idx === lastAiMessageIndex &&
                      !isLoading && (
                        <div className="space-y-2 pt-1">
                          <p className="text-xs text-muted-foreground">
                            選択してください（複数可）
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {msg.options.map((opt) => {
                              const isSelected =
                                selectedOptions.includes(opt);
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
                                  {isSelected && (
                                    <Check className="h-3 w-3" />
                                  )}
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
                {msg.role === "user" && (
                  <UserAvatar
                    name={profile?.name ?? ""}
                    className="w-8 h-8 text-xs shrink-0 mt-1"
                  />
                )}
              </div>
            ))}

            {/* ローディング表示 */}
            {isLoading && (
              <div className="flex gap-2 justify-start">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <Card className="bg-card">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      考え中...
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            <div ref={scrollRef} />
          </div>

          {/* インタビュー完了 → 生成ボタン */}
          {interviewDone && phase === "interviewing" && (
            <div className="py-4">
              <Button
                size="lg"
                className="rounded-full w-full gap-2"
                onClick={() => generateIntro(profileForAI, pastResponses)}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                自己紹介文を作成する
              </Button>
            </div>
          )}

          {/* 入力エリア（インタビュー続行中のみ） */}
          {!interviewDone && !isLoading && phase === "interviewing" && (
            <div className="flex gap-2 py-4">
              <Input
                placeholder="自由に入力..."
                value={freeText}
                onChange={(e) => setFreeText(e.target.value)}
                className="rounded-full"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && freeText.trim()) {
                    submitFreeText();
                  }
                }}
              />
              <Button
                size="icon"
                className="rounded-full shrink-0"
                disabled={!freeText.trim() && selectedOptions.length === 0}
                onClick={submitFreeText}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* 生成結果の表示 */}
      {phase === "done" && (
        <div className="flex-1 space-y-6 py-4">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 mx-auto rounded-full bg-green-100 flex items-center justify-center">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="text-lg font-semibold">自己紹介文ができました！</h2>
            <p className="text-sm text-muted-foreground">
              内容を確認・編集して、プロフィールに保存しましょう
            </p>
          </div>

          <Card className="border-primary/20">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-primary flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4" />
                  あなたの自己紹介文
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1 text-xs"
                  onClick={() => setIsEditingIntro(!isEditingIntro)}
                >
                  <Pencil className="h-3 w-3" />
                  {isEditingIntro ? "プレビュー" : "編集"}
                </Button>
              </div>

              {isEditingIntro ? (
                <Textarea
                  value={editedIntro}
                  onChange={(e) => setEditedIntro(e.target.value)}
                  rows={6}
                  className="text-sm leading-relaxed"
                />
              ) : (
                <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                  {editedIntro}
                </p>
              )}
            </CardContent>
          </Card>

          <div className="space-y-3">
            <Button
              className="w-full rounded-full gap-2"
              size="lg"
              onClick={handleSaveIntro}
              disabled={updateProfile.isPending || !editedIntro.trim()}
            >
              {updateProfile.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              プロフィールに保存する
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 rounded-full gap-2"
                onClick={() => generateIntro(profileForAI, pastResponses)}
                disabled={isLoading}
              >
                <RefreshCw className="h-4 w-4" />
                再生成する
              </Button>
              <Button
                variant="outline"
                className="flex-1 rounded-full gap-2"
                onClick={reset}
              >
                最初からやり直す
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* エラー表示 */}
      {phase === "error" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-4">
          <p className="text-sm text-destructive">{error}</p>
          <Button
            variant="outline"
            className="rounded-full gap-2"
            onClick={reset}
          >
            <RefreshCw className="h-4 w-4" />
            やり直す
          </Button>
        </div>
      )}
    </div>
  );
}
