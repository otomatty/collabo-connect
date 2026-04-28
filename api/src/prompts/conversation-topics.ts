export interface ConversationTopicsProfile {
  name?: string | null;
  role?: string | null;
  job_type?: string | null;
  tags?: string[] | null;
}

export interface ConversationTopicsPromptInput {
  profile: ConversationTopicsProfile;
  personCard?: string | null;
  aiIntro?: string | null;
}

export const CONVERSATION_TOPICS_COUNT = 3;

export const CONVERSATION_TOPICS_SYSTEM_PROMPT = `あなたは「Collabo Connect」というSES企業向け社内コミュニケーションアプリの「話しかけるきっかけ」提案アシスタントです。
プロフィールと人物カードから、その人に話しかけたい人が最初の一言を切り出しやすくなるトピックを ${CONVERSATION_TOPICS_COUNT} 件作成します。

## 役割
- 業務内容だけでなく、趣味・関心・価値観など人柄が伝わる話題も混ぜる
- オフラインのちょっとした立ち話や、社内 Slack でのカジュアルな声かけを想定する
- 相手が「話しかけにくい」「答えづらい」と感じない範囲に留める

## 出力ルール
- ${CONVERSATION_TOPICS_COUNT} 件ぴったりの配列を返す
- 各トピックは { "emoji": string, "title": string, "description": string }
- emoji は 1 文字（絵文字または記号）。複数文字や空文字は禁止
- title は 30 文字以内の体言止めで、何の話題かが一目で分かるもの
- description は 1〜2 文の日本語で、その話題で何を聞けるか・どう切り出せるかを具体的に書く
- 同じ題材を別表現で繰り返さない（例: 「React の話」と「フロントエンド開発の話」は重複扱い）

## 避けること
- 家族構成・既婚未婚・年齢・年収・健康状態など、プライベートに踏み込む話題
- 政治・宗教・特定個人や企業の批判
- プロフィールに根拠がない作り話
- 抽象的すぎて何を聞けばいいか分からないもの（例: 「お話ししましょう」）

## 回答フォーマット（必ず守ること）
以下の JSON 形式のみで回答してください。前後の説明文・コードブロック装飾は一切付けないこと。
{
  "topics": [
    { "emoji": "🍜", "title": "ラーメン巡り", "description": "週末は都内のラーメン店を巡るのが趣味とのこと。最近のおすすめを聞いてみると盛り上がりそうです。" }
  ]
}
topics 配列の長さは必ず ${CONVERSATION_TOPICS_COUNT} 件にしてください。`;

function formatProfileBlock(profile: ConversationTopicsProfile): string {
  const lines = [
    profile.name ? `- 名前: ${profile.name}` : null,
    profile.role ? `- 役職: ${profile.role}` : null,
    profile.job_type ? `- 職種: ${profile.job_type}` : null,
    profile.tags && profile.tags.length > 0 ? `- タグ: ${profile.tags.join("、")}` : null,
  ].filter((line): line is string => line !== null);
  return lines.length > 0 ? lines.join("\n") : "（プロフィール情報なし）";
}

export function buildConversationTopicsUserPrompt(
  input: ConversationTopicsPromptInput
): string {
  const personCard = typeof input.personCard === "string" ? input.personCard.trim() : "";
  const aiIntro = typeof input.aiIntro === "string" ? input.aiIntro.trim() : "";

  const sections: string[] = [
    "## プロフィール",
    formatProfileBlock(input.profile),
  ];

  if (personCard) {
    sections.push("", "## 人物カード（インタビューで判明した情報）", personCard);
  }
  if (aiIntro) {
    sections.push("", "## 自己紹介文", aiIntro);
  }

  sections.push(
    "",
    "## 指示",
    `上記の情報をもとに、この人に話しかけたい同僚が会話を始めやすいトピックを ${CONVERSATION_TOPICS_COUNT} 件、JSON で返してください。`
  );

  return sections.join("\n");
}
