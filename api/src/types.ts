/** DB row types (aligned with railway/schema.sql) */

export interface Profile {
  id: string;
  name: string;
  avatar_url: string | null;
  role: string | null;
  areas: string[] | null;
  tags: string[] | null;
  job_type: string;
  ai_intro: string | null;
  joined_date: string | null;
  created_at: string | null;
  updated_at: string | null;
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

/** Extend Express Request with optional userId (set by auth middleware) */
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}
