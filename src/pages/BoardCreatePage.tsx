import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ArrowLeft, Check, Sparkles, TrendingUp, MapPin, UserPlus, X, CalendarIcon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import UserAvatar from "@/components/UserAvatar";
import { mockUsers, mockPostings, currentUser } from "@/lib/mockData";

const categories = [
  { value: "food", label: "🍽️ ごはん・飲み" },
  { value: "study", label: "📚 勉強会・技術相談" },
  { value: "event", label: "🎉 イベント" },
];

const suggestedThemes = [
  { title: "新宿でランチ行きませんか？", category: "food" as const },
  { title: "もくもく会やりませんか？", category: "study" as const },
  { title: "週末ボードゲーム会", category: "event" as const },
  { title: "AWS勉強会", category: "study" as const },
  { title: "金曜の夜に飲みに行きましょう", category: "food" as const },
];

const popularAreas = ["新宿", "渋谷", "品川", "オンライン", "秋葉原", "横浜"];

// Recommend members: those who participated in past events with currentUser, or have matching tags
function getRecommendedMembers(category: string) {
  const pastCoMembers = new Set<string>();
  mockPostings.forEach((p) => {
    const isCurrentUserInvolved =
      p.creatorId === currentUser.id ||
      p.participants.some((pt) => pt.userId === currentUser.id);
    if (isCurrentUserInvolved) {
      if (p.creatorId !== currentUser.id) pastCoMembers.add(p.creatorId);
      p.participants.forEach((pt) => {
        if (pt.userId !== currentUser.id) pastCoMembers.add(pt.userId);
      });
    }
  });

  const categoryTagMap: Record<string, string[]> = {
    food: ["ラーメン", "甘党", "カフェ", "飲み"],
    study: ["React", "AWS", "TypeScript", "Java", "Python", "Flutter", "テスト"],
    event: ["ゲーム", "登山", "ヨガ", "筋トレ", "写真"],
  };
  const relevantKeywords = categoryTagMap[category] || [];

  return mockUsers
    .filter((u) => u.id !== currentUser.id)
    .map((u) => {
      let score = 0;
      if (pastCoMembers.has(u.id)) score += 3;
      const hasRelevantTag = u.tags.some((tag) =>
        relevantKeywords.some((kw) => tag.includes(kw))
      );
      if (hasRelevantTag) score += 2;
      const reason = pastCoMembers.has(u.id)
        ? "以前一緒に参加"
        : hasRelevantTag
        ? "興味が近い"
        : null;
      return { user: u, score, reason };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);
}

export default function BoardCreatePage() {
  const navigate = useNavigate();
  const [category, setCategory] = useState("food");
  const [title, setTitle] = useState("");
  const [dateUndecided, setDateUndecided] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [showTime, setShowTime] = useState(false);
  const [area, setArea] = useState("");
  const [invitedIds, setInvitedIds] = useState<string[]>([]);

  const recommended = getRecommendedMembers(category);

  const toggleInvite = (userId: string) => {
    setInvitedIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const applyTheme = (theme: typeof suggestedThemes[0]) => {
    setTitle(theme.title);
    setCategory(theme.category);
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-6 space-y-5 pb-28">
      <Link to="/board" className="flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> 戻る
      </Link>

      <h1 className="text-xl font-bold">募集を作成</h1>

      {/* Suggested Themes */}
      <Card className="border-dashed border-primary/30 bg-primary/5">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <TrendingUp className="h-4 w-4" />
            集まりやすいテーマ
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestedThemes.map((t, i) => (
              <Button
                key={i}
                variant="outline"
                size="sm"
                className="rounded-full text-xs border-primary/20 hover:bg-primary/10 hover:text-primary"
                onClick={() => applyTheme(t)}
              >
                <Sparkles className="h-3 w-3 mr-1" />
                {t.title}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 space-y-5">
          {/* Category */}
          <div className="space-y-2">
            <Label>カテゴリ</Label>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <Button
                  key={c.value}
                  variant={category === c.value ? "default" : "outline"}
                  size="sm"
                  className="rounded-full"
                  onClick={() => setCategory(c.value)}
                >
                  {c.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">タイトル</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例: 新宿でランチ行きませんか？"
              className="rounded-xl"
            />
          </div>

          {/* Date & Time */}
          <div className="space-y-3">
            <Label>日時</Label>
            <div className="flex items-center gap-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={dateUndecided}
                    className={cn(
                      "flex-1 justify-start text-left font-normal rounded-xl",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "yyyy/MM/dd") : "日付を選択"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              <Button
                variant={dateUndecided ? "default" : "outline"}
                size="sm"
                className="rounded-full shrink-0"
                onClick={() => {
                  setDateUndecided(!dateUndecided);
                  if (!dateUndecided) {
                    setSelectedDate(undefined);
                    setStartTime("");
                    setEndTime("");
                    setShowTime(false);
                  }
                }}
              >
                未定
              </Button>
            </div>

            {!dateUndecided && (
              <div className="space-y-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground gap-1 px-0 hover:text-primary"
                  onClick={() => setShowTime(!showTime)}
                >
                  <Clock className="h-3.5 w-3.5" />
                  {showTime ? "時間を非表示" : "時間を設定する"}
                </Button>
                {showTime && (
                  <div className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="rounded-xl flex-1"
                      placeholder="開始"
                    />
                    <span className="text-muted-foreground text-sm">〜</span>
                    <Input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="rounded-xl flex-1"
                      placeholder="終了"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Area with suggestions */}
          <div className="space-y-2">
            <Label htmlFor="area">エリア</Label>
            <Input
              id="area"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="例: 新宿 / オンライン"
              className="rounded-xl"
            />
            <div className="flex flex-wrap gap-1.5 pt-1">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
              {popularAreas.map((a) => (
                <Badge
                  key={a}
                  variant={area === a ? "default" : "outline"}
                  className="cursor-pointer text-xs rounded-full hover:bg-primary/10"
                  onClick={() => setArea(a)}
                >
                  {a}
                </Badge>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="desc">概要</Label>
            <Textarea
              id="desc"
              placeholder="どんな集まりか、気軽に書いてください！"
              className="rounded-xl min-h-[100px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Invite Members */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <UserPlus className="h-4 w-4 text-primary" />
            メンバーを誘う
          </div>

          {invitedIds.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">招待中（{invitedIds.length}人）</p>
              <div className="flex flex-wrap gap-2">
                {invitedIds.map((id) => {
                  const u = mockUsers.find((u) => u.id === id);
                  if (!u) return null;
                  return (
                    <Badge
                      key={id}
                      variant="secondary"
                      className="rounded-full pl-1 pr-2 py-1 gap-1 cursor-pointer hover:bg-destructive/10"
                      onClick={() => toggleInvite(id)}
                    >
                      <UserAvatar name={u.name} className="h-5 w-5 text-[10px]" />
                      <span className="text-xs">{u.name.split(" ")[0]}</span>
                      <X className="h-3 w-3 text-muted-foreground" />
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          {recommended.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                おすすめメンバー
              </p>
              <div className="space-y-2">
                {recommended.map(({ user, reason }) => {
                  const isInvited = invitedIds.includes(user.id);
                  return (
                    <div
                      key={user.id}
                      className="flex items-center gap-3 p-2 rounded-xl hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => toggleInvite(user.id)}
                    >
                      <UserAvatar name={user.name} className="h-8 w-8 text-xs" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.role}</p>
                      </div>
                      {reason && (
                        <Badge variant="outline" className="text-[10px] rounded-full shrink-0">
                          {reason}
                        </Badge>
                      )}
                      <div
                        className={`h-6 w-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                          isInvited
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-muted-foreground/30"
                        }`}
                      >
                        {isInvited && <Check className="h-3.5 w-3.5" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Button className="w-full rounded-xl py-5 text-base" onClick={() => navigate("/board")}>
        {invitedIds.length > 0
          ? `${invitedIds.length}人を誘って募集を投稿する`
          : "募集を投稿する"}
      </Button>
    </div>
  );
}
