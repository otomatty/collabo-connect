import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GuideModal } from "@/components/GuideModal";
import { useGuide } from "@/hooks/useGuide";
import { guideConfigs } from "@/lib/guideConfig";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Sparkles, ArrowRight, MapPin, Calendar } from "lucide-react";
import UserAvatar from "@/components/UserAvatar";
import AppHeader from "@/components/AppHeader";
import { useAuth } from "@/hooks/useAuth";
import { useTodayQuestion, useAnswerQuestion, useHasAnsweredToday } from "@/hooks/useAIQuestions";
import { usePostings } from "@/hooks/usePostings";
import { getCategoryEmoji, getCategoryLabel } from "@/lib/constants";

export default function HomePage() {
  const { user, profile } = useAuth();
  const { shouldShow: showGuide, dismiss } = useGuide("home");
  const { data: todayQuestion } = useTodayQuestion();
  const { data: postings } = usePostings();
  const answerMutation = useAnswerQuestion();
  const { data: hasAnswered } = useHasAnsweredToday(user?.id, todayQuestion?.id);

  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [freeText, setFreeText] = useState("");

  const recommended = postings?.[0] ?? null;
  const recentPostings = postings?.slice(0, 3) ?? [];

  const displayName = profile?.name?.split(" ")[1] ?? profile?.name ?? "";

  const handleAnswer = () => {
    if (!selectedOption || !todayQuestion || !user) return;
    const answer = freeText.trim()
      ? `${selectedOption}（${freeText.trim()}）`
      : selectedOption;
    answerMutation.mutate(
      { questionId: todayQuestion.id, userId: user.id, answer }
    );
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-6 space-y-6">
      <GuideModal
        open={showGuide}
        guide={guideConfigs.home}
        onDismiss={dismiss}
      />
      <AppHeader title={`${displayName}さん`} />
      <p className="text-sm text-muted-foreground -mt-4">おはようございます 👋</p>

      {/* Today's AI Question */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            <Sparkles className="h-4 w-4 text-accent" />
            今日の質問
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!todayQuestion ? (
            <p className="text-sm text-muted-foreground">今日の質問はありません</p>
          ) : hasAnswered ? (
            <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
              ✅ 回答済み！プロフィールが更新されました。
            </div>
          ) : (
            <>
              <p className="font-medium text-sm">{todayQuestion.question}</p>
              <div className="flex flex-wrap gap-2">
                {todayQuestion.options?.map((opt) => (
                  <Button
                    key={opt}
                    variant={selectedOption === opt ? "default" : "outline"}
                    size="sm"
                    className="rounded-full text-xs"
                    onClick={() => setSelectedOption(opt)}
                  >
                    {opt}
                  </Button>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="自由に一言（任意）"
                  value={freeText}
                  onChange={(e) => setFreeText(e.target.value)}
                  className="text-sm"
                />
                <Button
                  size="sm"
                  className="px-5"
                  disabled={!selectedOption || answerMutation.isPending}
                  onClick={handleAnswer}
                >
                  回答
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Recommended Posting */}
      {recommended && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              <span className="text-base">💡</span>
              おすすめ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link to={`/board/${recommended.id}`} className="block space-y-2">
              <div className="flex items-start justify-between">
                <div className="space-y-1.5">
                  <p className="font-medium text-sm">{recommended.title}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="secondary" className="rounded-full text-xs font-normal">
                      {getCategoryEmoji(recommended.category as "food" | "study" | "event")} {getCategoryLabel(recommended.category as "food" | "study" | "event")}
                    </Badge>
                    {recommended.is_online && <Badge variant="outline" className="rounded-full text-xs font-normal">オンライン</Badge>}
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground mt-1" />
              </div>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Recent Postings */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">最近の募集</h2>
          <Link to="/board" className="text-xs text-primary font-medium">
            すべて見る →
          </Link>
        </div>
        {recentPostings.map((post) => (
          <Link key={post.id} to={`/board/${post.id}`}>
            <Card className="transition-shadow hover:shadow-sm">
              <CardContent className="flex items-center gap-3 p-3">
                <div className="text-xl">{getCategoryEmoji(post.category as "food" | "study" | "event")}</div>
                <div className="flex-1 min-w-0 space-y-0.5">
                  <p className="font-medium text-sm truncate">{post.title}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {post.date_undecided ? (
                      <span>日程未定</span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> {post.date}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {post.area}
                    </span>
                  </div>
                </div>
                <div className="flex -space-x-2">
                  {post.participants.slice(0, 3).map((p) =>
                    p.profile ? (
                      <UserAvatar key={p.id} name={p.profile.name} className="h-6 w-6 text-[10px] border-2 border-card" />
                    ) : null
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
