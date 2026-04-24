/** DB row types (aligned with railway/schema.sql) */

export type TagCategory = "skill" | "hobby" | "area" | "role" | "other";

export interface Profile {
  id: string;
  name: string;
  avatar_url: string | null;
  role: string | null;
  areas: string[] | null;
  /** Computed via get_profile_tags(id) JOIN. Always populated by the profiles router. */
  tags: string[];
  job_type: string;
  ai_intro: string | null;
  joined_date: string | null;
  created_at: string | null;
  updated_at: string | null;
}

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

export interface ProfileTag {
  profile_id: string;
  tag_id: string;
  source: "manual" | "auto" | "interview" | "daily_question" | "posting";
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

export interface Posting {
  id: string;
  title: string;
  category: string;
  date: string | null;
  date_undecided: boolean | null;
  area: string;
  is_online: boolean | null;
  description: string | null;
  creator_id: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface PostingParticipant {
  id: string;
  posting_id: string;
  user_id: string;
  action: string;
  created_at: string | null;
}

export interface AiQuestion {
  id: string;
  question: string;
  options: string[] | null;
  date: string | null;
  created_at: string | null;
}

export interface AiQuestionResponse {
  id: string;
  question_id: string;
  user_id: string;
  answer: string;
  created_at: string | null;
}

/** API response: posting with creator and participants (with profile) */
export interface PostingWithDetails extends Posting {
  creator: Profile | null;
  participants: (PostingParticipant & { profile: Profile | null })[];
}

/** Extend Express Request with optional userId (set by auth middleware). Module augmentation (no namespace). */
import type {} from "express";
declare module "express-serve-static-core" {
  interface Request {
    userId?: string;
  }
}
