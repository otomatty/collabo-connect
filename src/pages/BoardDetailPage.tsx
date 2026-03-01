import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, HandHeart, Clock, Wifi } from "lucide-react";
import UserAvatar from "@/components/UserAvatar";
import AppHeader from "@/components/AppHeader";
import { mockPostings, mockUsers, getCategoryEmoji, getCategoryLabel } from "@/lib/mockData";

export default function BoardDetailPage() {
  const { id } = useParams();
  const post = mockPostings.find((p) => p.id === id);
  const [myAction, setMyAction] = useState<string | null>(null);

  if (!post) {
    return (
      <div className="mx-auto max-w-lg px-4 py-6">
        <p className="text-muted-foreground">募集が見つかりませんでした。</p>
        <Link to="/board" className="text-primary text-sm">← 一覧に戻る</Link>
      </div>
    );
  }

  const creator = mockUsers.find((u) => u.id === post.creatorId);

  const actions = [
    { key: "join", label: "行きたい！", icon: HandHeart, color: "bg-primary text-primary-foreground" },
    { key: "interested", label: "興味あり（日程合えば）", icon: Clock, color: "bg-accent text-accent-foreground" },
    { key: "online", label: "オンラインなら", icon: Wifi, color: "bg-secondary text-secondary-foreground" },
  ];

  return (
    <div className="mx-auto max-w-lg px-4 py-6 space-y-5">
      <AppHeader title={post.title} back="/board" />

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{getCategoryEmoji(post.category)}</span>
          <Badge variant="secondary" className="rounded-full">{getCategoryLabel(post.category)}</Badge>
          {post.isOnline && <Badge variant="outline" className="rounded-full">オンライン</Badge>}
        </div>
        
      </div>

      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        {post.dateUndecided ? (
          <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> 日程未定</span>
        ) : (
          <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {post.date}</span>
        )}
        <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {post.area}</span>
      </div>

      {creator && (
        <div className="flex items-center gap-3">
          <UserAvatar name={creator.name} className="h-9 w-9 text-sm" />
          <div>
            <p className="text-sm font-medium">{creator.name}</p>
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
              onClick={() => setMyAction(myAction === key ? null : key)}
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
            const u = mockUsers.find((mu) => mu.id === p.userId);
            if (!u) return null;
            return (
              <Link key={u.id} to={`/members/${u.id}`} className="flex flex-col items-center gap-1">
                <UserAvatar name={u.name} className="h-11 w-11 text-sm" />
                <span className="text-xs text-muted-foreground">{u.name.split(" ")[1]}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
