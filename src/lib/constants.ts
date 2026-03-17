export type Category = "food" | "study" | "event";

/** カテゴリのラベルを返す */
export const getCategoryLabel = (cat: string): string => {
  switch (cat) {
    case "food":
      return "ごはん・飲み";
    case "study":
      return "勉強会・技術相談";
    case "event":
      return "イベント";
    default:
      return cat;
  }
};

/** カテゴリの絵文字を返す */
export const getCategoryEmoji = (cat: string): string => {
  switch (cat) {
    case "food":
      return "🍽️";
    case "study":
      return "📚";
    case "event":
      return "🎉";
    default:
      return "📌";
  }
};

export const popularAreas = [
  "新宿",
  "渋谷",
  "品川",
  "東京",
  "横浜",
  "オンライン",
  "秋葉原",
  "中野",
  "目黒",
  "川崎",
];

/** 職種一覧 */
export const JOB_TYPES = [
  { value: "web-engineer", label: "Webエンジニア" },
  { value: "salesforce-engineer", label: "Salesforceエンジニア" },
  { value: "pm-pmo", label: "PM / PMO" },
  { value: "sales", label: "営業" },
  { value: "back-office", label: "バックオフィス（総務・人事・経理等）" },
  { value: "other", label: "その他" },
] as const;

export type JobTypeValue = (typeof JOB_TYPES)[number]["value"];

/** 興味・スキルでよくある項目（セットアップ等でクイック選択用） */
export const popularTags = [
  "React",
  "TypeScript",
  "JavaScript",
  "Python",
  "読書",
  "キャンプ",
  "カフェ",
  "ランニング",
  "料理",
  "写真",
  "音楽",
  "旅行",
  "ゲーム",
  "映画",
];
