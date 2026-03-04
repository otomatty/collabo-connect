/** 各画面のガイド設定 */
export type GuideKey =
  | "home"
  | "board"
  | "board-detail"
  | "board-create"
  | "interview"
  | "members"
  | "member-detail"
  | "mypage"
  | "setup";

export interface GuideConfig {
  key: GuideKey;
  title: string;
  description: string;
}

const homeDesc = [
  "ここはあなたのホーム画面です。",
  "",
  "• **今日の質問**: 毎日のAI質問に答えて、プロフィールを充実させましょう",
  "• **おすすめ**: あなたにぴったりの募集が表示されます",
  "• **最近の募集**: 最新のグループ募集を確認できます",
  "",
  "気軽に参加したい募集を見つけて、仲間とのつながりを広げていきましょう！",
].join("\n");

const boardDesc = [
  "グループ募集を閲覧・検索できる画面です。",
  "",
  "• **タブ**: ごはん・勉強会・イベントなどカテゴリで絞り込めます",
  "• **募集する**: 右上のボタンから、あなた主催の募集を作成できます",
  "• **カードをタップ**: 募集の詳細を確認し、参加意思を表明できます",
  "",
  "興味のある募集があれば、ぜひ「行きたい！」と反応してみてください！",
].join("\n");

const boardDetailDesc = [
  "募集の詳細を確認できる画面です。",
  "",
  "• **参加意思を表明する**: 「行きたい！」「興味あり」など、あなたの気持ちを伝えられます",
  "• **反応した人**: 同じく興味を持ったメンバーを確認できます。タップするとプロフィールを見られます",
  "",
  "気になる募集があれば、積極的に反応してみましょう！",
].join("\n");

const boardCreateDesc = [
  "自分主催のグループ募集を作成できる画面です。",
  "",
  "• **集まりやすいテーマ**: 人気のテーマをワンタップで入力できます",
  "• **カテゴリ・日時・エリア**: 必須項目を入力して募集内容を設定",
  "• **メンバーを誘う**: 興味が近い人におすすめメンバーとして表示され、招待できます",
  "",
  "気軽なランチや勉強会など、まずは身近なテーマで始めてみましょう！",
].join("\n");

const interviewDesc = [
  "AIがあなたに質問して、自己紹介文を一緒に作れる機能です。",
  "",
  "• **インタビューを始める**: AIがいくつか質問します",
  "• **選択肢 or 自由入力**: 選択肢を選んだり、自由に答えたりできます",
  "• **自己紹介文を作成**: 回答をもとに、あなたらしい自己紹介文が自動生成されます",
  "",
  "完成した自己紹介文はプロフィールに保存され、メンバー検索で他の人に伝わります！",
].join("\n");

const membersDesc = [
  "社内メンバーを探せる画面です。",
  "",
  "• **検索**: 名前やタグ（興味・スキル）で検索できます",
  "• **タグフィルター**: タグをタップして、同じ興味を持つ人を絞り込み",
  "• **カードをタップ**: メンバーの詳細プロフィールと自己紹介を確認できます",
  "",
  "気になる人を見つけたら、ぜひプロフィールをのぞいてみてください！",
].join("\n");

const memberDetailDesc = [
  "メンバーのプロフィールを確認できる画面です。",
  "",
  "• **役職・活動エリア**: 基本的な情報を確認",
  "• **タグ**: 興味やスキルが分かります",
  "• **自己紹介**: AIインタビューで作成された自己紹介文を読めます",
  "",
  "共通点を見つけて、グループ募集で一緒に参加してみましょう！",
].join("\n");

const mypageDesc = [
  "あなたのプロフィールを管理する画面です。",
  "",
  "• **自己紹介**: AIインタビューで作成・更新できます",
  "• **回答履歴**: 今日の質問などへの回答を確認",
  "• **参加中の募集**: あなたが反応した募集の一覧",
  "",
  "プロフィールを充実させると、より多くの人とつながりやすくなります！",
].join("\n");

const setupDesc = [
  "Collabo Connectを始めるための設定です。",
  "",
  "• **表示名**: 他のメンバーに表示される名前",
  "• **アイコン**: 画像URLを指定（任意）",
  "• **興味・スキル**: タグで入力すると、同じ趣味の仲間とマッチしやすくなります",
  "",
  "設定が完了したら、ホーム画面で使っていきましょう！",
].join("\n");

export const guideConfigs: Record<GuideKey, GuideConfig> = {
  home: { key: "home", title: "ホーム画面へようこそ", description: homeDesc },
  board: { key: "board", title: "グループ募集一覧", description: boardDesc },
  "board-detail": { key: "board-detail", title: "募集の詳細", description: boardDetailDesc },
  "board-create": { key: "board-create", title: "募集を作成", description: boardCreateDesc },
  interview: { key: "interview", title: "AIインタビュー", description: interviewDesc },
  members: { key: "members", title: "メンバー一覧", description: membersDesc },
  "member-detail": { key: "member-detail", title: "メンバー詳細", description: memberDetailDesc },
  mypage: { key: "mypage", title: "マイページ", description: mypageDesc },
  setup: { key: "setup", title: "初期設定", description: setupDesc },
};
