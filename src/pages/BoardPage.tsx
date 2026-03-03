import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Calendar, MapPin } from "lucide-react";
import UserAvatar from "@/components/UserAvatar";
import AppHeader from "@/components/AppHeader";
import { usePostings } from "@/hooks/usePostings";
import { getCategoryEmoji, getCategoryLabel } from "@/lib/constants";

export default function BoardPage() {
  const [tab, setTab] = useState("all");
  const { data: postings, isLoading } = usePostings(tab);

  return (
    <div className="mx-auto max-w-lg px-4 py-6 space-y-4">
      <AppHeader
        title="グループ募集"
        action={
          <Link to="/board/create">
            <Button size="sm" className="rounded-full gap-1">
              <Plus className="h-4 w-4" /> 募集する
            </Button>
          </Link>
        }
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full rounded-full bg-secondary">
          <TabsTrigger value="all" className="rounded-full flex-1 text-xs">すべて</TabsTrigger>
          <TabsTrigger value="food" className="rounded-full flex-1 text-xs">🍽️ ごはん</TabsTrigger>
          <TabsTrigger value="study" className="rounded-full flex-1 text-xs">📚 勉強会</TabsTrigger>
          <TabsTrigger value="event" className="rounded-full flex-1 text-xs">🎉 イベント</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {(postings ?? []).map((post) => (
            <Link key={post.id} to={`/board/${post.id}`}>
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl mt-0.5">{getCategoryEmoji(post.category as "food" | "study" | "event")}</div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="font-semibold text-sm">{post.title}</p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="secondary" className="rounded-full text-xs">
                          {getCategoryLabel(post.category as "food" | "study" | "event")}
                        </Badge>
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
                        {post.is_online && <Badge variant="outline" className="rounded-full text-xs">オンライン</Badge>}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{post.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-2">
                      {post.participants.map((p) =>
                        p.profile ? (
                          <UserAvatar key={p.id} name={p.profile.name} className="h-7 w-7 text-xs border-2 border-card" />
                        ) : null
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {post.participants.length}人が反応
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
