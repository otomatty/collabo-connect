<h1 align="center">Collabo-Connect</h1>

<p align="center">AIインタビュー × グループ募集で社内コミュニケーションを活性化するWebアプリ</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-6-646CFF?logo=vite" alt="Vite" />
  <img src="https://img.shields.io/badge/Cloudflare-Workers%20%2B%20D1-F38020?logo=cloudflare&logoColor=white" alt="Cloudflare" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss" alt="Tailwind CSS" />
</p>

---

## 概要

Collabo-Connect は、社員同士の交流を自然に生み出す**社内コミュニケーションプラットフォーム**です。

- **AIインタビュー**で社員の人柄・興味を引き出し、プロフィールを自動生成
- **グループ募集掲示板**で「ごはん・勉強会・イベント」の仲間を簡単に集められる
- **メンバー検索**でタグや興味から気の合う同僚を発見

## 主な機能

### 🏠 ホーム
- 「今日の質問」に回答すると、AIがプロフィールを自動更新
- おすすめ・最新の募集をひと目で確認

### 💬 AIインタビュー
- チャット形式で複数の質問に回答
- 回答内容をもとにAI紹介文を生成

### 📋 グループ募集掲示板
- **3カテゴリ**：🍽️ ごはん・飲み / 📚 勉強会・技術相談 / 🎉 イベント
- 日程・エリア・オンライン可否を指定して募集を投稿
- カテゴリ・タグに基づくおすすめメンバーのレコメンド
- 参加アクション（参加 / 興味あり / オンライン参加）

### 👥 メンバー一覧
- 名前・タグで検索＆フィルタリング
- メンバー詳細ページでAI紹介文・タグ・経歴を確認

### 👤 マイページ
- プロフィール編集（名前・役職・エリア・タグ・紹介文）
- 自分の投稿一覧・回答履歴の確認

## 技術スタック

| レイヤー | 技術 |
|---|---|
| フロントエンド | React 18 + TypeScript + Vite |
| UIライブラリ | [shadcn/ui](https://ui.shadcn.com/) + Tailwind CSS |
| バックエンド | [Cloudflare Workers](https://workers.cloudflare.com/) + [Hono](https://hono.dev/) + [Better Auth](https://www.better-auth.com/)（マジックリンク） |
| データベース | [Cloudflare D1](https://developers.cloudflare.com/d1/)（SQLite） |
| 状態管理 / データ取得 | TanStack React Query |
| ルーティング | React Router v6 |
| バッチ | Cloudflare Cron Triggers（日次の質問生成） |
| デプロイ | Cloudflare（API: Workers / フロント: Workers 静的アセット） |

## データベース構成

| テーブル | 説明 |
|---|---|
| `profiles` | ユーザープロフィール（名前・役職・エリア・タグ・AI紹介文） |
| `postings` | 掲示板の募集投稿 |
| `posting_participants` | 投稿への参加情報（参加 / 興味あり / オンライン） |
| `ai_questions` | AIインタビュー質問マスタ |
| `ai_question_responses` | ユーザーの質問に対する回答 |

権限は API 層（Better Auth セッション）で制御。閲覧は全員可能、編集は本人のみ。スキーマは [`api/migrations/0001_init.sql`](api/migrations/0001_init.sql)、テストデータは [`api/seed/seed.sql`](api/seed/seed.sql)。

## セットアップ

### 前提条件

- **Node.js** 18 以上
- **npm** または **bun**
- **Cloudflare アカウント** と [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)（API / D1 / デプロイ用）

### インストール & 起動

```sh
# リポジトリをクローン
git clone <YOUR_GIT_URL>
cd collabo-connect

# 依存パッケージのインストール
npm install

# 環境変数の設定（.env ファイルを作成）
cp .env.example .env
# VITE_API_URL に Cloudflare Workers API の URL を設定（ローカル API 利用時は http://localhost:8787）

# フロント開発サーバーの起動
npm run dev
```

### API（Cloudflare Workers + D1）のローカル起動

```sh
cd api
npm install
cp .dev.vars.example .dev.vars   # BETTER_AUTH_SECRET / GEMINI_API_KEY などを設定

# ローカル D1 にスキーマとシードを適用
npm run db:migrate:local
npm run db:seed:local

# API をローカル起動（http://localhost:8787）
npm run dev
```

本番デプロイ・D1 の作成手順は [CLOUDFLARE.md](CLOUDFLARE.md) を参照してください。

### 利用可能なスクリプト

| コマンド | 説明 |
|---|---|
| `npm run dev` | 開発サーバー起動 |
| `npm run build` | プロダクションビルド |
| `npm run preview` | ビルド結果のプレビュー |
| `npm run lint` | ESLint によるコード検査 |
| `npm run test` | テストの実行 |
| `npm run supabase:types` | Supabase の型定義を自動生成 |

## デプロイ

Cloudflare へのデプロイ手順（D1 作成・マイグレーション・シークレット設定・API/フロントのデプロイ・Cron）は [CLOUDFLARE.md](CLOUDFLARE.md) を参照してください。

- **API**: `cd api && npm run deploy`（Cloudflare Workers + D1 + Cron Trigger）
- **フロント**: `npm run cf:deploy`（ビルド後 Workers 静的アセットへデプロイ。`VITE_API_URL` に API の URL を設定）

## ディレクトリ構成

```
src/
├── components/       # 共通UIコンポーネント
│   └── ui/           # shadcn/ui コンポーネント
├── hooks/            # カスタムフック（認証・データ取得）
├── lib/              # ユーティリティ・定数・Supabase クライアント
├── pages/            # ページコンポーネント
├── test/             # テストファイル
└── types/            # 型定義
api/                  # Cloudflare Workers API（Hono + Better Auth + D1）
├── src/              # Worker エントリ・ルート・サービス
├── migrations/       # D1 スキーマ（SQLite）
├── seed/             # テスト用シードデータ
└── wrangler.toml     # Worker 設定（D1 バインディング・Cron）
wrangler.jsonc        # フロント（静的アセット）の Cloudflare 設定
```

## ライセンス

このプロジェクトは [MIT License](LICENSE) のもとで公開されています。自由に利用・改変・再配布が可能です。詳細は LICENSE ファイルをご確認ください。
