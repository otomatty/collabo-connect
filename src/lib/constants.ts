/** カテゴリのラベルを返す */
export const getCategoryLabel = (cat: "food" | "study" | "event") => {
  switch (cat) {
    case "food":
      return "ごはん・飲み";
    case "study":
      return "勉強会・技術相談";
    case "event":
      return "イベント";
  }
};

/** カテゴリの絵文字を返す */
export const getCategoryEmoji = (cat: "food" | "study" | "event") => {
  switch (cat) {
    case "food":
      return "🍽️";
    case "study":
      return "📚";
    case "event":
      return "🎉";
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
