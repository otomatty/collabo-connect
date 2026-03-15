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
import { JOB_TYPES } from "@/lib/constants";

export default function InitialSetupPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { shouldShow: showGuide, dismiss } = useGuide("setup");
  const { data: profile } = useProfile(user?.id);
  const updateProfile = useUpdateProfile();
  
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [joinedDate, setJoinedDate] = useState("");
  const [jobType, setJobType] = useState("");
  const [tagsInput, setTagsInput] = useState("");

  // プロフィールの初期値をセット（メールアドレス等から推定された名前が設定されている場合）
  useEffect(() => {
    if (profile) {
      // メールアドレスがそのまま名前になっている場合は空にして入力させる
      const initialName = profile.name.includes("@") ? "" : profile.name;
      setName(initialName);
      setAvatarUrl(profile.avatar_url || "");
      setJoinedDate(profile.joined_date || "");
      setJobType(profile.job_type || "");
      setTagsInput(profile.tags ? profile.tags.join(", ") : "");
    }
  }, [profile]);

  // URLが空の場合は、名前をシードにしたデフォルトのアバターURLを生成
  const previewAvatarUrl = avatarUrl.trim() 
    ? avatarUrl.trim() 
    : (name.trim() ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}` : "");

  const handleSave = () => {
    if (!user) return;
    if (!name.trim()) {
      toast.error("表示名を入力してください");
      return;
    }

    const tags = tagsInput
      .split(/[,、]/)
      .map((tag) => tag.trim())
      .filter((tag) => tag !== "");

    updateProfile.mutate(
      {
        id: user.id,
        updates: { 
          name, 
          avatar_url: previewAvatarUrl,
          joined_date: joinedDate || null,
          job_type: jobType || "",
          tags: tags.length > 0 ? tags : null,
        },
      },
      {
        onSuccess: () => {
          toast.success("初期設定が完了しました！");
          navigate({ to: "/" });
        },
        onError: () => {
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
            <UserAvatar name={name || "User"} url={previewAvatarUrl} className="h-24 w-24 text-3xl" />

            
            <div className="w-full space-y-2">
              <Label htmlFor="avatarUrl">画像URL (任意)</Label>
              <Input
                id="avatarUrl"
                placeholder="https://example.com/icon.png"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground text-center">
                ※URLを指定しない場合は、名前の頭文字が表示されます。
              </p>
            </div>
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

          <div className="space-y-2">
            <Label htmlFor="joinedDate">入社年月 (任意)</Label>
            <Input
              id="joinedDate"
              type="month"
              value={joinedDate}
              onChange={(e) => setJoinedDate(e.target.value)}
            />
          </div>

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
            <Input
              id="tags"
              placeholder="カンマ区切りで入力 (例: React, 読書, キャンプ)"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              カンマまたは読点で区切って複数入力できます。
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
