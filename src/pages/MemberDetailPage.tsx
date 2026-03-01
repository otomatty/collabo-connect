import { useParams, Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, MapPin, CalendarDays } from "lucide-react";
import UserAvatar from "@/components/UserAvatar";
import AppHeader from "@/components/AppHeader";
import { mockUsers } from "@/lib/mockData";

export default function MemberDetailPage() {
  const { id } = useParams();
  const user = mockUsers.find((u) => u.id === id);

  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-6">
        <p className="text-muted-foreground">メンバーが見つかりませんでした。</p>
        <Link to="/members" className="text-primary text-sm">← 一覧に戻る</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6 space-y-5">
      <AppHeader title={user.name} back="/members" />

      <div className="flex flex-col items-center gap-3 text-center">
        <UserAvatar name={user.name} className="h-20 w-20 text-2xl" />
        <div>
          <h1 className="text-xl font-bold">{user.name}</h1>
          <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground mt-1">
            <span className="flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" /> {user.role}</span>
            <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {user.areas.join("・")}</span>
          </div>
          <p className="flex items-center justify-center gap-1 text-xs text-muted-foreground mt-1">
            <CalendarDays className="h-3 w-3" /> {user.joinedDate} 入社
          </p>
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap justify-center gap-2">
        {user.tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="rounded-full">
            {tag}
          </Badge>
        ))}
      </div>

      {/* AI Introduction */}
      <Card className="border-primary/20 bg-warm-light/30">
        <CardContent className="p-4 space-y-2">
          <p className="text-sm font-semibold flex items-center gap-2">
            ✨ AIからの紹介
          </p>
          <p className="text-sm leading-relaxed text-foreground/80">{user.aiIntro}</p>
        </CardContent>
      </Card>
    </div>
  );
}
