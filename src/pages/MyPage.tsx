import { useState, useEffect, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { GuideModal } from "@/components/GuideModal";
import { useGuide } from "@/hooks/useGuide";
import { guideConfigs } from "@/lib/guideConfig";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { MessageSquare, ClipboardList, Sparkles, Pencil, X, Plus } from "lucide-react";
import UserAvatar from "@/components/UserAvatar";
import AppHeader from "@/components/AppHeader";
import SuggestedTagsSheet from "@/components/SuggestedTagsSheet";
import { useAuth } from "@/hooks/useAuth";
import { useMyProfileTagDetails, useUpdateProfile } from "@/hooks/useProfiles";
import { useMyPostings } from "@/hooks/usePostings";
import { useMyResponses } from "@/hooks/useAIQuestions";
import { useSuggestedTags } from "@/hooks/useSuggestedTags";
import { popularAreas, JOB_TYPES } from "@/lib/constants";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import { formatJoinedDate } from "@/lib/utils";

/**
 * `source='auto'` で 24h 以内に付与された profile_tag を「NEW」として扱う。
 * `source` を絞り込むことで、ユーザーが手動で追加したタグや古い自動タグまで
 * NEW 扱いになるのを防いでいる。
 */
const NEW_TAG_WINDOW_MS = 24 * 60 * 60 * 1000;

export default function MyPage() {
  const { user, profile } = useAuth();
  const { shouldShow: showGuide, dismiss } = useGuide("mypage");
  const updateProfile = useUpdateProfile();
  const { data: myPostings } = useMyPostings(user?.id);
  const { data: myResponses } = useMyResponses(user?.id);
  const { data: suggestedTags } = useSuggestedTags();
  const { data: tagDetails } = useMyProfileTagDetails(!!user);
  const joinedDateLabel = formatJoinedDate(profile?.joined_date);

  const [isEditing, setIsEditing] = useState(false);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [jobType, setJobType] = useState("");
  const [areas, setAreas] = useState<string[]>([]);
  const [newArea, setNewArea] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [aiIntro, setAiIntro] = useState("");

  const pendingCount = suggestedTags?.length ?? 0;
  // `tags` の各要素は profile API が返す get_profile_tags() = tags.name と
  // 同じ文字列。`tagDetails[].name` も同じ tags.name 由来なので、prefix の
  // 加工なしで一致する。useMemo で再計算を抑制。
  const newTagNames = useMemo(() => {
    if (!tagDetails) return new Set<string>();
    const cutoff = Date.now() - NEW_TAG_WINDOW_MS;
    const names = new Set<string>();
    for (const detail of tagDetails) {
      if (detail.source !== "auto") continue;
      if (!detail.created_at) continue;
      const ts = Date.parse(detail.created_at);
      if (Number.isFinite(ts) && ts >= cutoff) {
        names.add(detail.name);
      }
    }
    return names;
  }, [tagDetails]);

  // プロフィールデータをフォームに反映
  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setRole(profile.role);
      setJobType(profile.job_type || "");
      setAreas(profile.areas);
      setTags(profile.tags);
      setAiIntro(profile.ai_intro);
    }
  }, [profile]);

  const handleSave = () => {
    if (!user) return;
    updateProfile.mutate(
      {
        id: user.id,
        updates: { name, role, job_type: jobType, areas, tags, ai_intro: aiIntro },
      },
      {
        onSuccess: () => {
          setIsEditing(false);
          toast.success("プロフィールを更新しました");
        },
      }
    );
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

  const profileMeta = [areas.join("・"), joinedDateLabel ? `${joinedDateLabel}入社` : ""]
    .filter(Boolean)
    .join(" ・ ");

  return (
    <div className="mx-auto max-w-lg px-4 py-6 space-y-6">
      <GuideModal open={showGuide} guide={guideConfigs.mypage} onDismiss={dismiss} />
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
          <p className="text-sm text-muted-foreground">{role}{profile?.job_type ? ` ・ ${JOB_TYPES.find((jt) => jt.value === profile.job_type)?.label ?? profile.job_type}` : ""}</p>
          {profileMeta ? <p className="text-xs text-muted-foreground">{profileMeta}</p> : null}
        </div>
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-accent" /> タグ
        </h3>
        <div className="flex flex-wrap items-center gap-1.5">
          {tags.map((tag) => {
            const isNew = newTagNames.has(tag);
            return (
              <Badge
                key={tag}
                variant="secondary"
                className="rounded-full text-xs font-normal flex items-center gap-1"
              >
                {tag}
                {isNew ? (
                  <span className="rounded-full bg-accent px-1.5 py-0.5 text-[9px] font-semibold leading-none text-accent-foreground">
                    NEW
                  </span>
                ) : null}
              </Badge>
            );
          })}
          {pendingCount > 0 ? (
            <button
              type="button"
              onClick={() => setIsSuggestionsOpen(true)}
              aria-label={`${pendingCount}件のタグ候補を表示`}
              className="inline-flex items-center rounded-full border border-accent/40 bg-accent/10 px-2.5 py-0.5 text-xs font-semibold text-accent hover:bg-accent/20 transition-colors"
            >
              +{pendingCount}
            </button>
          ) : null}
        </div>
      </div>

      <SuggestedTagsSheet open={isSuggestionsOpen} onOpenChange={setIsSuggestionsOpen} />

      {/* AI Intro */}
      <Card>
        <CardContent className="p-4 space-y-1">
          <p className="text-xs font-semibold text-muted-foreground">自己紹介</p>
          {aiIntro ? (
            <p className="text-sm text-foreground/80 leading-relaxed">{aiIntro}</p>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">まだ自己紹介文がありません</p>
              <Link to="/interview">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  AIインタビューで作成する
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Interview history */}
      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
          <MessageSquare className="h-3.5 w-3.5 text-primary" /> 回答履歴
        </h3>
        {(myResponses ?? []).slice(0, 2).map((r) => (
          <Card key={r.id}>
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground">{r.question?.date}</p>
              <p className="text-sm">{r.question?.question}</p>
              <p className="text-xs text-primary mt-1">回答: {r.answer}</p>
            </CardContent>
          </Card>
        ))}
        <Link to="/interview">
          <Button variant="outline" className="w-full" size="sm">
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            AIインタビューで自己紹介を作成・更新する
          </Button>
        </Link>
      </div>

      {/* My postings */}
      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
          <ClipboardList className="h-3.5 w-3.5 text-primary" /> 参加中の募集
        </h3>
        {(myPostings ?? []).map((post) => (
          <Link key={post.id} to={`/board/${post.id}`}>
            <Card className="transition-shadow hover:shadow-sm">
              <CardContent className="p-3">
                <p className="text-sm font-medium">{post.title}</p>
                <p className="text-xs text-muted-foreground">{post.area} ・ {post.date_undecided ? "日程未定" : post.date}</p>
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
              <label className="text-sm font-medium">職種</label>
              <Select value={jobType} onValueChange={setJobType}>
                <SelectTrigger>
                  <SelectValue placeholder="職種を選択" />
                </SelectTrigger>
                <SelectContent>
                  {JOB_TYPES.map((jt) => (
                    <SelectItem key={jt.value} value={jt.value}>
                      {jt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">活動エリア</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {areas.map((a) => (
                  <Badge key={a} variant="secondary" className="rounded-full flex items-center gap-1 pr-1 text-xs font-normal">
                    {a}
                    <button
                      type="button"
                      onClick={() => setAreas(areas.filter((x) => x !== a))}
                      className="rounded-full hover:bg-muted p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newArea}
                  onChange={(e) => setNewArea(e.target.value)}
                  placeholder="エリアを追加（例: 東京、渋谷）"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const v = newArea.trim();
                      if (v && !areas.includes(v)) {
                        setAreas([...areas, v]);
                        setNewArea("");
                      }
                    }
                  }}
                  className="flex-1"
                />
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={() => {
                    const v = newArea.trim();
                    if (v && !areas.includes(v)) {
                      setAreas([...areas, v]);
                      setNewArea("");
                    }
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {popularAreas.filter((a) => !areas.includes(a)).map((a) => (
                  <Badge
                    key={a}
                    variant="outline"
                    className="rounded-full text-xs font-normal cursor-pointer hover:bg-secondary transition-colors"
                    onClick={() => setAreas([...areas, a])}
                  >
                    + {a}
                  </Badge>
                ))}
              </div>
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
              <label className="text-sm font-medium">自己紹介</label>
              <Textarea value={aiIntro} onChange={(e) => setAiIntro(e.target.value)} rows={4} />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsEditing(false)}>キャンセル</Button>
            <Button onClick={handleSave} disabled={updateProfile.isPending}>
              {updateProfile.isPending ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
