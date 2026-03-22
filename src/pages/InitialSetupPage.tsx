import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { GuideModal } from "@/components/GuideModal";
import { useGuide } from "@/hooks/useGuide";
import { guideConfigs } from "@/lib/guideConfig";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useProfile, useUpdateProfile } from "@/hooks/useProfiles";
import { toast } from "@/components/ui/sonner";
import UserAvatar from "@/components/UserAvatar";
import { ImageIcon } from "lucide-react";
import { JOB_TYPES, popularTags } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { MonthYearPicker } from "@/components/MonthYearPicker";
import { clearSetupDebug, setupDebug } from "@/lib/setupDebug";

export default function InitialSetupPage() {
  const navigate = useNavigate();
  const { user, setProfile } = useAuth();
  const { shouldShow: showGuide, dismiss } = useGuide("setup");
  const { data: profile } = useProfile(user?.id);
  const updateProfile = useUpdateProfile();
  
  const [name, setName] = useState("");
  const [joinedDate, setJoinedDate] = useState("");
  const [jobType, setJobType] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | null>(null);

  useEffect(() => {
    setupDebug("InitialSetupPage.render", {
      userId: user?.id ?? null,
      profileId: profile?.id ?? null,
      profileAvatarUrl: profile?.avatar_url ?? null,
      localName: name,
      joinedDate,
      jobType,
      tagsCount: tagsInput.split(/[,、]/).map((tag) => tag.trim()).filter(Boolean).length,
      hasAvatarDataUrl: Boolean(avatarDataUrl),
      isPending: updateProfile.isPending,
    });
  }, [avatarDataUrl, joinedDate, jobType, name, profile?.avatar_url, profile?.id, tagsInput, updateProfile.isPending, user?.id]);

  // プロフィールの初期値をセット（表示名はデフォルト空のためセットしない）
  useEffect(() => {
    if (profile) {
      setupDebug("InitialSetupPage.profileLoaded", {
        profileId: profile.id,
        profileAvatarUrl: profile.avatar_url,
        profileName: profile.name,
        joinedDate: profile.joined_date,
      });
      setJoinedDate(profile.joined_date || "");
      setJobType(profile.job_type || "");
      setTagsInput(profile.tags ? profile.tags.join(", ") : "");
    }
  }, [profile]);

  // 既存のアバターURLがあればそれを使用、なければ名前ベースのデフォルトアバター
  const previewAvatarUrl = profile?.avatar_url?.trim()
    ? profile.avatar_url.trim()
    : (name.trim() ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}` : "");
  const displayAvatarUrl = avatarDataUrl ?? previewAvatarUrl;

  const addTag = (tag: string) => {
    const current = tagsInput
      .split(/[,、]/)
      .map((t) => t.trim())
      .filter(Boolean);
    if (current.includes(tag)) return;
    setTagsInput(current.length ? [...current, tag].join(", ") : tag);
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") setAvatarDataUrl(result);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleSave = () => {
    if (!user) return;
    clearSetupDebug();
    if (!name.trim()) {
      setupDebug("InitialSetupPage.handleSave:validationError", {
        reason: "name-empty",
      });
      toast.error("表示名を入力してください");
      return;
    }

    const tags = tagsInput
      .split(/[,、]/)
      .map((tag) => tag.trim())
      .filter((tag) => tag !== "");

    const existingAvatarUrl = profile?.avatar_url?.trim();
    const nextAvatarUrl = avatarDataUrl ?? (existingAvatarUrl ? existingAvatarUrl : previewAvatarUrl);
    setupDebug("InitialSetupPage.handleSave:start", {
      userId: user.id,
      name,
      joinedDate,
      jobType,
      tags,
      nextAvatarUrl,
      currentProfileAvatarUrl: profile?.avatar_url ?? null,
    });

    updateProfile.mutate(
      {
        id: user.id,
        updates: {
          name,
          avatar_url: nextAvatarUrl,
          joined_date: joinedDate || null,
          job_type: jobType || "",
          tags: tags.length > 0 ? tags : null,
        },
      },
      {
        onSuccess: (updatedProfile) => {
          setupDebug("InitialSetupPage.handleSave:success", {
            updatedProfileId: updatedProfile.id,
            updatedAvatarUrl: updatedProfile.avatar_url,
            updatedName: updatedProfile.name,
          });
          setProfile(updatedProfile);
          toast.success("初期設定が完了しました！");
          setupDebug("InitialSetupPage.handleSave:navigate", {
            to: "/",
          });
          navigate({ to: "/" });
        },
        onError: (error) => {
          setupDebug("InitialSetupPage.handleSave:error", {
            error: error instanceof Error ? error.message : String(error),
          });
          toast.error("エラーが発生しました");
        }
      }
    );
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-10">
      <GuideModal open={showGuide} guide={guideConfigs.setup} onDismiss={dismiss} />
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl font-bold">プロフィール設定</CardTitle>
          <CardDescription>
            Collabo Connectへようこそ！
            <br />
            まずは表示名とアイコンを設定しましょう。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center space-y-4">
            <label
              htmlFor="avatar-upload"
              className="group relative flex cursor-pointer rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              aria-label="クリックで画像を変更"
            >
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleAvatarFileChange}
              />
              <UserAvatar name={name || "User"} url={displayAvatarUrl} className="h-24 w-24 text-3xl" />
              <span
                className="absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
                aria-hidden
              >
                <ImageIcon className="h-8 w-8 text-white" />
                <span className="text-xs font-medium text-white">画像を選択する</span>
              </span>
            </label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">表示名 (必須)</Label>
            <Input
              id="name"
              placeholder="表示名を入力"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <MonthYearPicker
            id="joinedDate"
            label="入社年月 (任意)"
            value={joinedDate}
            onChange={setJoinedDate}
            placeholder="選択してください"
          />

          <div className="space-y-2">
            <Label htmlFor="jobType">職種</Label>
            <Select value={jobType} onValueChange={setJobType}>
              <SelectTrigger>
                <SelectValue placeholder="職種を選択してください" />
              </SelectTrigger>
              <SelectContent>
                {JOB_TYPES.map((jt) => (
                  <SelectItem key={jt.value} value={jt.value}>
                    {jt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              AIインタビューで職種に合った質問が行われます。
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">興味があること / スキル (任意)</Label>
            <div className="flex flex-wrap gap-1.5">
              {popularTags.map((tag) => {
                const current = tagsInput.split(/[,、]/).map((t) => t.trim()).filter(Boolean);
                const selected = current.includes(tag);
                return (
                  <Badge
                    key={tag}
                    variant={selected ? "secondary" : "outline"}
                    className="cursor-pointer rounded-full text-xs font-normal transition-colors hover:bg-secondary"
                    onClick={() => addTag(tag)}
                  >
                    {selected ? "✓ " : "+ "}{tag}
                  </Badge>
                );
              })}
            </div>
            <Input
              id="tags"
              placeholder="カンマ区切りで入力 (例: React, 読書, キャンプ)"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              上の項目を選ぶか、カンマまたは読点で区切って入力できます。
            </p>
          </div>

          <Button 
            className="w-full" 
            size="lg" 
            onClick={handleSave} 
            disabled={updateProfile.isPending}
          >
            {updateProfile.isPending ? "保存中..." : "はじめる"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
