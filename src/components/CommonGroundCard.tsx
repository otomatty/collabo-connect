import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ProfilePublicTag, TagCategory } from "@/types/tags";

interface CommonGroundCardProps {
  viewerTags: string[];
  viewerAreas: string[];
  memberTags: ProfilePublicTag[];
  memberAreas: string[];
}

interface CommonGround {
  commonAreas: string[];
  commonTags: ProfilePublicTag[];
  fallback: ProfilePublicTag | null;
}

const FALLBACK_CATEGORY_PRIORITY: TagCategory[] = [
  "skill",
  "hobby",
  "area",
  "role",
  "other",
];

const normalize = (value: string) => value.trim().toLowerCase();

export function computeCommonGround(
  viewerTags: string[],
  viewerAreas: string[],
  memberTags: ProfilePublicTag[],
  memberAreas: string[]
): CommonGround {
  const viewerTagSet = new Set(viewerTags.map(normalize));
  const viewerAreaSet = new Set(viewerAreas.map(normalize));

  const commonAreas = memberAreas.filter((area) =>
    viewerAreaSet.has(normalize(area))
  );

  const commonTags = memberTags.filter((tag) =>
    viewerTagSet.has(normalize(tag.name))
  );

  if (commonAreas.length > 0 || commonTags.length > 0) {
    return { commonAreas, commonTags, fallback: null };
  }

  const fallback = pickFallbackTag(memberTags);
  return { commonAreas: [], commonTags: [], fallback };
}

function pickFallbackTag(memberTags: ProfilePublicTag[]): ProfilePublicTag | null {
  if (memberTags.length === 0) return null;

  const counts = new Map<TagCategory, number>();
  for (const tag of memberTags) {
    counts.set(tag.category, (counts.get(tag.category) ?? 0) + 1);
  }

  let bestCategory: TagCategory | null = null;
  let bestCount = 0;
  for (const category of FALLBACK_CATEGORY_PRIORITY) {
    const count = counts.get(category) ?? 0;
    if (count > bestCount) {
      bestCategory = category;
      bestCount = count;
    }
  }

  if (!bestCategory) return null;
  return memberTags.find((tag) => tag.category === bestCategory) ?? null;
}

export default function CommonGroundCard({
  viewerTags,
  viewerAreas,
  memberTags,
  memberAreas,
}: CommonGroundCardProps) {
  const { commonAreas, commonTags, fallback } = useMemo(
    () => computeCommonGround(viewerTags, viewerAreas, memberTags, memberAreas),
    [viewerTags, viewerAreas, memberTags, memberAreas]
  );

  const hasCommon = commonAreas.length > 0 || commonTags.length > 0;

  if (!hasCommon && !fallback) return null;

  return (
    <section>
      <h2 className="text-sm font-semibold mb-2">共通点</h2>
      <Card className="border-primary/30 bg-warm-light/30">
        <CardContent className="p-4 space-y-2">
          {hasCommon ? (
            <>
              <p className="text-sm font-semibold">🤝 あなたと共通</p>
              <div className="flex flex-wrap gap-2">
                {commonAreas.map((area) => (
                  <Badge
                    key={`area-${area}`}
                    variant="default"
                    className="rounded-full"
                  >
                    #{area}
                  </Badge>
                ))}
                {commonTags.map((tag) => (
                  <Badge
                    key={`tag-${tag.tag_id}`}
                    variant="default"
                    className="rounded-full"
                  >
                    #{tag.name}
                  </Badge>
                ))}
              </div>
            </>
          ) : fallback ? (
            <>
              <p className="text-sm font-semibold">💡 話題にできそう</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="rounded-full">
                  #{fallback.name}
                </Badge>
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
}
