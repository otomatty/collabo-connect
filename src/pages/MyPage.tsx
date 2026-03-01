import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Settings, MessageSquare, ClipboardList, Sparkles } from "lucide-react";
import UserAvatar from "@/components/UserAvatar";
import { currentUser, mockPostings, mockQuestions } from "@/lib/mockData";

export default function MyPage() {
  const myPostings = mockPostings.filter(
    (p) => p.creatorId === currentUser.id || p.participants.some((pt) => pt.userId === currentUser.id)
  );

  return (
    <div className="mx-auto max-w-lg px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">マイページ</h1>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Settings className="h-5 w-5" />
        </Button>
      </div>

      {/* Profile */}
      <div className="flex items-center gap-4">
        <UserAvatar name={currentUser.name} className="h-16 w-16 text-xl" />
        <div className="space-y-1">
          <h2 className="text-lg font-bold">{currentUser.name}</h2>
          <p className="text-sm text-muted-foreground">{currentUser.role}</p>
          <p className="text-xs text-muted-foreground">{currentUser.area} ・ {currentUser.joinedDate} 入社</p>
        </div>
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" /> AI生成タグ
        </h3>
        <div className="flex flex-wrap gap-2">
          {currentUser.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="rounded-full">
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      {/* AI Intro */}
      <Card className="border-primary/20 bg-warm-light/30">
        <CardContent className="p-4 space-y-1">
          <p className="text-sm font-semibold">✨ あなたの紹介文</p>
          <p className="text-sm text-foreground/80 leading-relaxed">{currentUser.aiIntro}</p>
        </CardContent>
      </Card>

      {/* Interview history */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" /> 回答履歴
        </h3>
        {mockQuestions.slice(0, 2).map((q) => (
          <Card key={q.id}>
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground">{q.date}</p>
              <p className="text-sm">{q.question}</p>
            </CardContent>
          </Card>
        ))}
        <Link to="/interview">
          <Button variant="outline" className="w-full rounded-xl" size="sm">
            インタビューに答える →
          </Button>
        </Link>
      </div>

      {/* My postings */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-primary" /> 参加中の募集
        </h3>
        {myPostings.map((post) => (
          <Link key={post.id} to={`/board/${post.id}`}>
            <Card className="transition-shadow hover:shadow-md">
              <CardContent className="p-3">
                <p className="text-sm font-medium">{post.title}</p>
                <p className="text-xs text-muted-foreground">{post.area} ・ {post.dateUndecided ? "日程未定" : post.date}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
