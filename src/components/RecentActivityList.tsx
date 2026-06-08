import { Link } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { getCategoryLabel } from "@/lib/constants";
import { formatJapaneseDate } from "@/lib/utils";
import type { Activity } from "@/hooks/useProfiles";

interface RecentActivityListProps {
  activities: Activity[];
}

/** 参加アクションの日本語ラベル。 */
const ACTION_LABEL: Record<"join" | "interested" | "online", string> = {
  join: "参加",
  interested: "気になる",
  online: "オンライン参加",
};

/**
 * 各エントリの安定したキー。募集系は posting.id、質問回答は at で一意化する。
 * （同一秒に複数回答する可能性は無視できるほど低いので at を採用）
 */
function activityKey(activity: Activity): string {
  return activity.type === "question_answered"
    ? `question-${activity.at}`
    : `${activity.type}-${activity.posting.id}`;
}

/** 募集エントリのサブラベル（カテゴリ + 作成/参加種別）。 */
function postingSubLabel(
  activity: Extract<Activity, { type: `posting_${string}` }>
): string {
  const category = getCategoryLabel(activity.posting.category);
  const kind =
    activity.type === "posting_created"
      ? "募集を作成"
      : ACTION_LABEL[activity.action];
  return `${category}・${kind}`;
}

/**
 * メンバー詳細ページの「最近の活動」タイムライン。募集の作成/参加（📋）と
 * AI 質問への回答（💬）を時系列降順で表示する。募集エントリは `/board/:id`
 * へのリンクとして機能する。0 件時は空状態メッセージを表示する。
 */
export default function RecentActivityList({
  activities,
}: RecentActivityListProps) {
  if (activities.length === 0) {
    return <p className="text-sm text-muted-foreground">まだ活動がありません</p>;
  }

  return (
    <ul className="space-y-2">
      {activities.map((activity) => {
        const at = formatJapaneseDate(activity.at);

        if (activity.type === "question_answered") {
          return (
            <li key={activityKey(activity)}>
              <Card>
                <CardContent className="p-3 flex gap-3 items-start">
                  <span className="text-xl leading-none shrink-0" aria-hidden>
                    💬
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{activity.question}</p>
                    <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                      {activity.answer}
                    </p>
                    {at ? (
                      <p className="text-xs text-muted-foreground mt-1">{at}</p>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            </li>
          );
        }

        return (
          <li key={activityKey(activity)}>
            <Link
              to={`/board/${activity.posting.id}`}
              className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
            >
              <Card className="transition-colors hover:bg-muted/50">
                <CardContent className="p-3 flex gap-3 items-start">
                  <span className="text-xl leading-none shrink-0" aria-hidden>
                    📋
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {activity.posting.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {postingSubLabel(activity)}
                      {at ? `・${at}` : ""}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
