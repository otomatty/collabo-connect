import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { MessageSquare, ClipboardList, Sparkles, Pencil, X, Plus } from "lucide-react";
import UserAvatar from "@/components/UserAvatar";
import AppHeader from "@/components/AppHeader";
import { currentUser, mockPostings, mockQuestions } from "@/lib/mockData";
import { toast } from "@/hooks/use-toast";

export default function MyPage() {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(currentUser.name);
  const [role, setRole] = useState(currentUser.role);
  const [area, setArea] = useState(currentUser.area);
  const [tags, setTags] = useState(currentUser.tags);
  const [newTag, setNewTag] = useState("");
  const [aiIntro, setAiIntro] = useState(currentUser.aiIntro);

  const myPostings = mockPostings.filter(
    (p) => p.creatorId === currentUser.id || p.participants.some((pt) => pt.userId === currentUser.id)
  );

  const handleSave = () => {
    setIsEditing(false);
    toast({ title: "プロフィールを更新しました" });
  };

  const handleAddTag = () => {
    const tag = newTag.trim();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag.startsWith("#") ? tag : `#${tag}`]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-6 space-y-6">
      <AppHeader
        title="マイページ"
        hideAvatar
        action={
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setIsEditing(true)}>
            <Pencil className="h-4 w-4" />
          </Button>
        }
      />

      {/* Profile */}
      <div className="flex items-center gap-4">
        <UserAvatar name={name} className="h-14 w-14 text-lg" />
        <div className="space-y-0.5">
          <h2 className="text-base font-semibold">{name}</h2>
          <p className="text-sm text-muted-foreground">{role}</p>
          <p className="text-xs text-muted-foreground">{area} ・ {currentUser.joinedDate} 入社</p>
        </div>
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-accent" /> タグ
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="rounded-full text-xs font-normal">
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      {/* AI Intro */}
      <Card>
        <CardContent className="p-4 space-y-1">
          <p className="text-xs font-semibold text-muted-foreground">紹介文</p>
          <p className="text-sm text-foreground/80 leading-relaxed">{aiIntro}</p>
        </CardContent>
      </Card>

      {/* Interview history */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
          <MessageSquare className="h-3.5 w-3.5 text-primary" /> 回答履歴
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
          <Button variant="outline" className="w-full" size="sm">
            インタビューに答える →
          </Button>
        </Link>
      </div>

      {/* My postings */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
          <ClipboardList className="h-3.5 w-3.5 text-primary" /> 参加中の募集
        </h3>
        {myPostings.map((post) => (
          <Link key={post.id} to={`/board/${post.id}`}>
            <Card className="transition-shadow hover:shadow-sm">
              <CardContent className="p-3">
                <p className="text-sm font-medium">{post.title}</p>
                <p className="text-xs text-muted-foreground">{post.area} ・ {post.dateUndecided ? "日程未定" : post.date}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-md mx-auto max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>プロフィール編集</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">名前</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">役職</label>
              <Input value={role} onChange={(e) => setRole(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">エリア</label>
              <Input value={area} onChange={(e) => setArea(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">タグ</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="rounded-full flex items-center gap-1 pr-1 text-xs font-normal">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="rounded-full hover:bg-muted p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="新しいタグを追加"
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                  className="flex-1"
                />
                <Button type="button" size="icon" variant="outline" onClick={handleAddTag}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">紹介文</label>
              <Textarea value={aiIntro} onChange={(e) => setAiIntro(e.target.value)} rows={4} />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsEditing(false)}>キャンセル</Button>
            <Button onClick={handleSave}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
