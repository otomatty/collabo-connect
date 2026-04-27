export type TagCategory = "skill" | "hobby" | "area" | "role" | "other";

export interface Tag {
  id: string;
  name: string;
  aliases: string[];
  category: TagCategory;
  usage_count: number;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export type ProfileTagSource =
  | "manual"
  | "auto"
  | "interview"
  | "daily_question"
  | "posting";

/**
 * Row returned by GET /api/profiles/me/tags. Carries the per-assignment
 * `source` and `created_at` needed to render the "NEW" badge on auto-applied
 * tags in MyPage.
 */
export interface ProfileTagDetail {
  tag_id: string;
  name: string;
  category: TagCategory;
  aliases: string[];
  source: ProfileTagSource;
  created_at: string | null;
}

export interface SuggestedTag {
  id: string;
  user_id: string;
  tag_id: string | null;
  proposed_name: string | null;
  proposed_category: TagCategory;
  source: "interview" | "daily_question" | "posting";
  confidence: "high" | "medium";
  reason: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string | null;
  resolved_at: string | null;
}
