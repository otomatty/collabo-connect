// ---------- 共通型定義 ----------

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
  /** この職種の説明（システムプロンプトに埋め込む） */
  description: string;
  /** インタビューで深掘りすべき切り口 */
  interviewAngles: string;
  /** 自己紹介文の生成で強調すべきポイント */
  generateFocus: string;
}
