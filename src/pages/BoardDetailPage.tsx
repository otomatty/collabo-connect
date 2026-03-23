import { useState } from "react";
import { useParams, Link } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { GuideModal } from "@/components/GuideModal";
import { useGuide } from "@/hooks/useGuide";
import { guideConfigs } from "@/lib/guideConfig";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, HandHeart, Clock, Wifi } from "lucide-react";
import UserAvatar from "@/components/UserAvatar";
import AppHeader from "@/components/AppHeader";
import { useAuth } from "@/hooks/useAuth";
import { usePosting, useParticipate, useRemoveParticipation } from "@/hooks/usePostings";
import { getCategoryEmoji, getCategoryLabel } from "@/lib/constants";
import { formatJapaneseDate } from "@/lib/utils";

export default function BoardDetailPage() {
  const { id } = useParams({ strict: false });
  const { user } = useAuth();
  const { shouldShow: showGuide, dismiss } = useGuide("board-detail");
  const { data: post, isLoading } = usePosting(id);
  const formattedPostDate = formatJapaneseDate(post?.date);
  const participateMutation = useParticipate();
  const removeMutation = useRemoveParticipation();
  const [myAction, setMyAction] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="mx-auto max-w-lg px-4 py-6">
        <p className="text-muted-foreground">募集が見つかりませんでした。</p>
        <Link to="/board" className="text-primary text-sm">← 一覧に戻る</Link>
      </div>
    );
  }

  const actions = [
    { key: "join" as const, label: "行きたい！", icon: HandHeart, color: "bg-primary text-primary-foreground" },
    { key: "interested" as const, label: "興味あり（日程合えば）", icon: Clock, color: "bg-accent text-accent-foreground" },
    { key: "online" as const, label: "オンラインなら", icon: Wifi, color: "bg-secondary text-secondary-foreground" },
  ];

  const handleAction = (key: "join" | "interested" | "online") => {
    if (!user) return;
    if (myAction === key) {
      removeMutation.mutate({ postingId: post.id, userId: user.id });
      setMyAction(null);
    } else {
      participateMutation.mutate({ postingId: post.id, userId: user.id, action: key });
      setMyAction(key);
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-6 space-y-5">
      <GuideModal open={showGuide} guide={guideConfigs["board-detail"]} onDismiss={dismiss} />
      <AppHeader title={post.title} back="/board" />

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{getCategoryEmoji(post.category)}</span>
          <Badge variant="secondary" className="rounded-full">{getCategoryLabel(post.category)}</Badge>
          {post.is_online && <Badge variant="outline" className="rounded-full">オンライン</Badge>}
        </div>
      </div>

      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        {post.date_undecided ? (
          <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> 日程未定</span>
        ) : (
          <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {formattedPostDate}</span>
        )}
        <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {post.area}</span>
      </div>

      {post.creator && (
        <div className="flex items-center gap-3">
          <UserAvatar name={post.creator.name} className="h-9 w-9 text-sm" />
          <div>
            <p className="text-sm font-medium">{post.creator.name}</p>
            <p className="text-xs text-muted-foreground">企画者</p>
          </div>
        </div>
      )}

      <Card>
        <CardContent className="p-4">
          <p className="text-sm leading-relaxed">{post.description}</p>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="space-y-2">
        <p className="text-sm font-semibold">参加意思を表明する</p>
        <div className="grid gap-2">
          {actions.map(({ key, label, icon: Icon, color }) => (
            <Button
              key={key}
              variant={myAction === key ? "default" : "outline"}
              className={`rounded-xl py-5 justify-start gap-3 text-sm ${
                myAction === key ? color : ""
              }`}
              onClick={() => handleAction(key)}
              disabled={participateMutation.isPending || removeMutation.isPending}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Participants */}
      <div className="space-y-3">
        <p className="text-sm font-semibold">反応した人（{post.participants.length}人）</p>
        <div className="flex flex-wrap gap-3">
          {post.participants.map((p) => {
            if (!p.profile) return null;
            return (
              <Link key={p.id} to={`/members/${p.user_id}`} className="flex flex-col items-center gap-1">
                <UserAvatar name={p.profile.name} className="h-11 w-11 text-sm" />
                <span className="text-xs text-muted-foreground">{p.profile.name.split(" ")[1] ?? p.profile.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
