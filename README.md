# Collabo-Connect

**AIインタビュー × グループ募集で社内コミュニケーションを活性化するWebアプリ**

<p align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-6-646CFF?logo=vite" alt="Vite" />
  <img src="https://img.shields.io/badge/Supabase-Backend-3FCF8E?logo=supabase" alt="Supabase" />
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
| バックエンド / DB | [Supabase](https://supabase.com/) (Auth + PostgreSQL + RLS) |
| 状態管理 / データ取得 | TanStack React Query |
| ルーティング | React Router v6 |
| デプロイ | Vercel |

## データベース構成

| テーブル | 説明 |
|---|---|
| `profiles` | ユーザープロフィール（名前・役職・エリア・タグ・AI紹介文） |
| `postings` | 掲示板の募集投稿 |
| `posting_participants` | 投稿への参加情報（参加 / 興味あり / オンライン） |
| `ai_questions` | AIインタビュー質問マスタ |
| `ai_question_responses` | ユーザーの質問に対する回答 |

全テーブルに Row Level Security (RLS) を適用。閲覧は全員可能、編集は本人のみ。

## セットアップ

### 前提条件

- **Node.js** 18 以上
- **npm** または **bun**
- **Supabase** プロジェクト（ローカル or クラウド）

### インストール & 起動

```sh
# リポジトリをクローン
git clone <YOUR_GIT_URL>
cd collabo-connect

# 依存パッケージのインストール
npm install

# 環境変数の設定（.env ファイルを作成）
cp .env.example .env
# VITE_SUPABASE_URL と VITE_SUPABASE_PUBLISHABLE_KEY を設定

# 開発サーバーの起動
npm run dev
```

### Supabase のセットアップ

1. Supabase プロジェクトを作成
2. `supabase/schema.sql` を SQL Editor で実行（テーブル・RLS・トリガーが作成されます）
3. 必要に応じて `supabase/seed.sql` でテスト用データを投入

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

Vercel へのデプロイ手順は [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md) を参照してください。

環境変数（`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`）の設定が必要です。

## ディレクトリ構成

```
src/
├── components/       # 共通UIコンポーネント
│   └── ui/           # shadcn/ui コンポーネント
├── hooks/            # カスタムフック（認証・データ取得）
├── lib/              # ユーティリティ・定数・Supabase クライアント
├── pages/            # ページコンポーネント
├── test/             # テストファイル
└── types/            # 型定義（Supabase 自動生成）
supabase/
├── schema.sql        # データベーススキーマ定義
└── seed.sql          # テスト用シードデータ
```

## ライセンス

Private
