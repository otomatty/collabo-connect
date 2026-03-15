export interface ProfileData {
  name: string;
  role: string;
  job_type: string;
  areas: string[];
  tags: string[];
  ai_intro: string;
}

export interface PastResponse {
  question: string;
  answer: string;
}

export interface JobTypePrompt {
  description: string;
  interviewAngles: string;
  generateFocus: string;
}
