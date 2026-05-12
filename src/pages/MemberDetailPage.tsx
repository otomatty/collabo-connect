import { useMemo } from "react";
import { useParams, Link } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { GuideModal } from "@/components/GuideModal";
import { useGuide } from "@/hooks/useGuide";
import { guideConfigs } from "@/lib/guideConfig";
import { Badge } from "@/components/ui/badge";
import { Briefcase, MapPin, CalendarDays } from "lucide-react";
import UserAvatar from "@/components/UserAvatar";
import AppHeader from "@/components/AppHeader";
import CommonGroundCard from "@/components/CommonGroundCard";
import { useAuth } from "@/hooks/useAuth";
import { useProfile, useProfileTags } from "@/hooks/useProfiles";
import { formatJoinedDate } from "@/lib/utils";
import type { ProfilePublicTag, TagCategory } from "@/types/tags";

/**
 * Display order + heading for tag categories on MemberDetailPage. `other` is
 * kept at the end so any tag whose category we don't surface explicitly is
 * still visible rather than silently dropped.
 */
const TAG_CATEGORY_ORDER: TagCategory[] = ["skill", "hobby", "area", "role", "other"];
const TAG_CATEGORY_HEADING: Record<TagCategory, string> = {
  skill: "🛠 スキル",
  hobby: "🎯 興味・趣味",
  area: "📍 活動エリア",
  role: "🎓 役職",
  other: "🏷 その他",
};

function groupTagsByCategory(
  tags: ProfilePublicTag[] | undefined
): Map<TagCategory, ProfilePublicTag[]> {
  const map = new Map<TagCategory, ProfilePublicTag[]>();
  for (const cat of TAG_CATEGORY_ORDER) map.set(cat, []);
  for (const tag of tags ?? []) {
    const bucket = map.get(tag.category) ?? map.get("other")!;
    bucket.push(tag);
  }
  return map;
}

export default function MemberDetailPage() {
  const { id } = useParams({ strict: false });
  const { shouldShow: showGuide, dismiss } = useGuide("member-detail");
  const { user: viewer, profile: viewerProfile, loading: isAuthLoading } = useAuth();
  const { data: user, isLoading } = useProfile(id);
  const { data: profileTags, isLoading: isTagsLoading } = useProfileTags(id);
  const isOwnProfile = !!viewer?.id && viewer.id === id;

  const groupedTags = useMemo(() => groupTagsByCategory(profileTags), [profileTags]);

  // Wait for the tags fetch too: the tag section is prominent on this page,
  // so resolving both in parallel avoids the section flashing empty before
  // categories render. Also wait for auth so the「共通点」section doesn't pop
  // in after first paint and cause layout shift.
  if (isLoading || isTagsLoading || isAuthLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-6">
        <p className="text-muted-foreground">メンバーが見つかりませんでした。</p>
        <Link to="/members" className="text-primary text-sm">← 一覧に戻る</Link>
      </div>
    );
  }

  const joinedDateLabel = formatJoinedDate(user.joined_date);
  const conversationTopics = user.conversation_topics ?? [];
  const nickname = user.nickname?.trim() ?? "";
  const areas = user.areas ?? [];

  return (
    <div className="mx-auto max-w-lg px-4 py-6 space-y-6">
      <GuideModal open={showGuide} guide={guideConfigs["member-detail"]} onDismiss={dismiss} />
      <AppHeader title={user.name} back="/members" />

      {/* 1. Hero */}
      <section className="flex flex-col items-center gap-3 text-center">
        <UserAvatar name={user.name} className="h-24 w-24 text-3xl" />
        <div>
          <h1 className="text-2xl font-bold">
            {user.name}
            {nickname ? (
              <span className="ml-2 text-base font-normal text-muted-foreground">
                ({nickname})
              </span>
            ) : null}
          </h1>
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm text-muted-foreground mt-1">
            {user.role ? (
              <span className="flex items-center gap-1">
                <Briefcase className="h-3.5 w-3.5" /> {user.role}
              </span>
            ) : null}
            {user.job_type ? (
              <Badge variant="outline" className="rounded-full text-xs font-normal">
                {user.job_type}
              </Badge>
            ) : null}
            {areas.length > 0 ? (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> {areas.join("・")}
              </span>
            ) : null}
          </div>
          {joinedDateLabel ? (
            <p className="flex items-center justify-center gap-1 text-xs text-muted-foreground mt-1">
              <CalendarDays className="h-3 w-3" /> {joinedDateLabel}入社
            </p>
          ) : null}
        </div>
      </section>

      {/* 2. 共通点ハイライト (#16) */}
      {!isOwnProfile && viewerProfile ? (
        <CommonGroundCard
          viewerTags={viewerProfile.tags ?? []}
          viewerAreas={viewerProfile.areas ?? []}
          memberTags={profileTags ?? []}
          memberAreas={areas}
        />
      ) : null}

      {/* 3. 会話のきっかけ (#17) */}
      {conversationTopics.length > 0 ? (
        <section>
          <h2 className="text-sm font-semibold mb-2">会話のきっかけ</h2>
          <div className="space-y-2">
            {conversationTopics.map((topic, idx) => (
              <Card key={`${topic.title}-${idx}`}>
                <CardContent className="p-4 flex gap-3">
                  <span className="text-2xl leading-none shrink-0" aria-hidden>
                    {topic.emoji}
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm">{topic.title}</p>
                    {topic.description ? (
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {topic.description}
                      </p>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      {/* 4. タグ (カテゴリ別) */}
      <section>
        <h2 className="text-sm font-semibold mb-2">タグ</h2>
        <div className="space-y-3">
          {TAG_CATEGORY_ORDER.map((category) => {
            const tagsInCategory = groupedTags.get(category) ?? [];
            if (tagsInCategory.length === 0) return null;
            return (
              <div key={category}>
                <p className="text-xs font-medium text-muted-foreground mb-1.5">
                  {TAG_CATEGORY_HEADING[category]}
                </p>
                <div className="flex flex-wrap gap-2">
                  {tagsInCategory.map((tag) => (
                    <Badge
                      key={tag.tag_id}
                      variant="secondary"
                      className="rounded-full"
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. 最近の活動 (#18) */}
      <section>
        <h2 className="text-sm font-semibold mb-2">最近の活動</h2>
        <Card className="border-dashed">
          <CardContent className="p-4 text-sm text-muted-foreground">
            最近の募集・回答タイムラインは近日公開予定です（Coming Soon）。
          </CardContent>
        </Card>
      </section>

      {/* 6. AI 自己紹介 */}
      <section>
        <Card className="border-primary/20 bg-warm-light/30">
          <CardContent className="p-4 space-y-2">
            <p className="text-sm font-semibold flex items-center gap-2">
              ✨ 自己紹介
            </p>
            <p className="text-sm leading-relaxed text-foreground/80">{user.ai_intro ?? ""}</p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
