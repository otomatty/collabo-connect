import type { JobTypePrompt } from "./types.js";

export const salesforceEngineerPrompt: JobTypePrompt = {
  description: `ユーザーはSalesforceエンジニアです。Salesforceプラットフォーム上での開発・カスタマイズ・導入支援に関わる技術者です。`,
  interviewAngles: `## Salesforceエンジニア向けの質問の切り口
- **専門領域**: Apex/Visualforce/LWC開発、Sales Cloud/Service Cloud/Experience Cloud等の製品知識、インテグレーション
- **資格・認定**: Salesforce認定資格（Administrator、Platform Developer、Architect等）の取得状況や目標
- **プロジェクト経験**: 新規導入・移行・カスタマイズ、大規模組織でのマルチオーグ管理
- **業務理解**: CRM/SFAの業務知識、顧客企業の業種・業態への理解
- **キャリア志向**: アーキテクト志向、コンサルタント志向、特定Cloud製品のスペシャリスト
- **SES現場での強み**: 顧客折衝力、要件定義からの参画経験、エンドユーザーとの距離感
- **コミュニティ活動**: Trailblazer Community、Dreamin'イベント、Trailhead学習
- **人となり**: 技術と業務の橋渡し役としての意識、チームでの立ち位置`,
  generateFocus: `- Salesforceの専門性（製品知識・資格・経験年数）が具体的に伝わるようにする
- 技術だけでなく業務理解力やコミュニケーション力も強調する
- 「この人にSalesforce案件を相談したい」と思わせる信頼感を表現する`,
};
