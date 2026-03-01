// Mock data for Collabo-Link

export interface User {
  id: string;
  name: string;
  avatar: string;
  role: string;
  areas: string[];
  tags: string[];
  aiIntro: string;
  joinedDate: string;
}

export interface Posting {
  id: string;
  title: string;
  category: "food" | "study" | "event";
  date: string;
  dateUndecided: boolean;
  area: string;
  isOnline: boolean;
  description: string;
  creatorId: string;
  participants: { userId: string; action: "join" | "interested" | "online" }[];
}

export interface AIQuestion {
  id: string;
  question: string;
  options: string[];
  date: string;
}

export const mockUsers: User[] = [
  {
    id: "u1",
    name: "田中 太郎",
    avatar: "",
    role: "フロントエンドエンジニア",
    areas: ["新宿", "東京"],
    tags: ["#React", "#TypeScript", "#甘党", "#AWS学習中"],
    aiIntro: "田中さんはReactとTypeScriptを得意とするフロントエンドエンジニアです。最近はAWS認定資格の取得に向けて勉強中で、向上心が強く、チームメンバーからの信頼も厚い方です。",
    joinedDate: "2024-04",
  },
  {
    id: "u2",
    name: "佐藤 花子",
    avatar: "",
    role: "バックエンドエンジニア",
    areas: ["渋谷", "世田谷"],
    tags: ["#Java", "#Spring", "#ラーメン好き", "#読書家"],
    aiIntro: "佐藤さんはJavaとSpringを軸にしたバックエンド開発のスペシャリストです。丁寧なコードレビューで知られ、後輩の面倒見がとても良い頼れる先輩エンジニアです。",
    joinedDate: "2023-10",
  },
  {
    id: "u3",
    name: "鈴木 一郎",
    avatar: "",
    role: "インフラエンジニア",
    areas: ["品川", "川崎"],
    tags: ["#AWS", "#Docker", "#登山", "#コーヒー"],
    aiIntro: "鈴木さんはAWSとDockerに精通したインフラエンジニアです。休日は登山を楽しむアウトドア派で、おいしいコーヒーの淹れ方にもこだわる多趣味な方です。",
    joinedDate: "2024-01",
  },
  {
    id: "u4",
    name: "山田 美咲",
    avatar: "",
    role: "フルスタックエンジニア",
    areas: ["新宿", "中野"],
    tags: ["#Next.js", "#Python", "#猫好き", "#ヨガ"],
    aiIntro: "山田さんはフロントからバックエンドまで幅広く対応できるフルスタックエンジニアです。新しい技術のキャッチアップが早く、社内勉強会の企画にも積極的な方です。",
    joinedDate: "2024-06",
  },
  {
    id: "u5",
    name: "高橋 健太",
    avatar: "",
    role: "モバイルエンジニア",
    areas: ["横浜"],
    tags: ["#Flutter", "#Swift", "#ゲーム好き", "#筋トレ"],
    aiIntro: "高橋さんはFlutterとSwiftを使ったモバイルアプリ開発が得意なエンジニアです。ゲーム開発にも興味があり、個人でインディーゲームを作るほどの情熱家です。",
    joinedDate: "2023-08",
  },
  {
    id: "u6",
    name: "伊藤 さくら",
    avatar: "",
    role: "QAエンジニア",
    areas: ["渋谷", "目黒"],
    tags: ["#テスト自動化", "#Selenium", "#カフェ巡り", "#写真"],
    aiIntro: "伊藤さんはテスト自動化のスペシャリストで、品質へのこだわりが強いQAエンジニアです。カフェ巡りが趣味で、素敵なカフェの情報をよく共有してくれます。",
    joinedDate: "2024-03",
  },
];

export const mockPostings: Posting[] = [
  {
    id: "p1",
    title: "新宿でランチ行きませんか？🍜",
    category: "food",
    date: "2026-03-05",
    dateUndecided: false,
    area: "新宿",
    isOnline: false,
    description: "新宿駅周辺でおすすめのラーメン屋さんを開拓したいです！お昼休みに一緒に行ける方、気軽に参加してください。",
    creatorId: "u2",
    participants: [
      { userId: "u1", action: "join" },
      { userId: "u4", action: "interested" },
    ],
  },
  {
    id: "p2",
    title: "AWS勉強会やりたい📚",
    category: "study",
    date: "",
    dateUndecided: true,
    area: "オンライン",
    isOnline: true,
    description: "AWS認定ソリューションアーキテクト試験に向けて一緒に勉強しませんか？週1回ペースでオンラインでの開催を考えています。",
    creatorId: "u3",
    participants: [
      { userId: "u1", action: "online" },
      { userId: "u6", action: "interested" },
      { userId: "u4", action: "join" },
    ],
  },
  {
    id: "p3",
    title: "週末ボードゲーム会🎲",
    category: "event",
    date: "2026-03-08",
    dateUndecided: false,
    area: "渋谷",
    isOnline: false,
    description: "渋谷のボードゲームカフェで遊びましょう！初心者も大歓迎です。軽いゲームから始めるので気軽に来てください。",
    creatorId: "u5",
    participants: [
      { userId: "u2", action: "join" },
      { userId: "u6", action: "join" },
    ],
  },
  {
    id: "p4",
    title: "React最新動向シェア会⚛️",
    category: "study",
    date: "2026-03-10",
    dateUndecided: false,
    area: "品川",
    isOnline: false,
    description: "React 19の新機能やServer Componentsについて情報交換しませんか？各自気になるトピックを持ち寄る形式です。",
    creatorId: "u1",
    participants: [
      { userId: "u4", action: "join" },
      { userId: "u3", action: "interested" },
    ],
  },
];

export const mockQuestions: AIQuestion[] = [
  {
    id: "q1",
    question: "最近、現場で一番よく使っている技術は何ですか？",
    options: ["React / Vue などフロントエンド", "Java / Python などバックエンド", "AWS / GCP などクラウド", "その他"],
    date: "2026-03-01",
  },
  {
    id: "q2",
    question: "週末の過ごし方で一番多いのは？",
    options: ["家でゆっくり", "カフェや外出", "スポーツ・アウトドア", "勉強・スキルアップ"],
    date: "2026-02-28",
  },
  {
    id: "q3",
    question: "社内の人ともっと話してみたいテーマは？",
    options: ["技術・キャリア相談", "趣味・プライベート", "おすすめのお店・スポット", "業界ニュース・トレンド"],
    date: "2026-02-27",
  },
];

export const currentUser = mockUsers[0];

export const getCategoryLabel = (cat: Posting["category"]) => {
  switch (cat) {
    case "food": return "ごはん・飲み";
    case "study": return "勉強会・技術相談";
    case "event": return "イベント";
  }
};

export const popularAreas = ["新宿", "渋谷", "品川", "東京", "横浜", "オンライン", "秋葉原", "中野", "目黒", "川崎"];

export const getCategoryEmoji = (cat: Posting["category"]) => {
  switch (cat) {
    case "food": return "🍽️";
    case "study": return "📚";
    case "event": return "🎉";
  }
};
