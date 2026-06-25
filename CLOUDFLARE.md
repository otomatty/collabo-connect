# Cloudflare デプロイ手順（フル移行）

インフラを **Cloudflare に完全移行**した構成のデプロイ手順です。

| レイヤー | 旧構成 | 新構成 |
|---|---|---|
| フロント（SPA） | Vercel | **Cloudflare Workers 静的アセット**（`wrangler.jsonc`） |
| API | Railway（Express + Node） | **Cloudflare Workers**（Hono、`api/`） |
| 認証 | Better Auth + pg | **Better Auth + Kysely D1 dialect** |
| DB | Railway Postgres | **Cloudflare D1**（SQLite） |
| Cron（日次質問） | Railway Cron | **Cloudflare Cron Triggers**（`api/wrangler.toml` の `[triggers]`） |
| メール | Resend | Resend（変更なし・HTTP API） |
| 生成AI | Gemini | Gemini（変更なし・HTTP API） |

> Postgres 固有機能（`text[]` / `jsonb` / `uuid-ossp` / plpgsql 関数）は SQLite 向けに移植済みです。配列・JSON カラムは TEXT(JSON) として保存し、API の DB 層（`api/src/db.ts`）が読み書き時に自動変換します。

## 前提

- Cloudflare アカウント
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)（`npx wrangler` で利用可）
- `wrangler login` 済み

## 1. API（Workers + D1）

```sh
cd api
npm install

# 1-1. D1 データベースを作成し、返ってきた database_id を wrangler.toml に貼る
npx wrangler d1 create collabo-connect
#   → [[d1_databases]] の database_id = "..." を api/wrangler.toml に設定

# 1-2. スキーマ（マイグレーション）を適用
npm run db:migrate          # 本番 D1（--remote）
# ローカル検証用: npm run db:migrate:local

# 1-3. テストデータを投入（任意）
npm run db:seed             # 本番（--remote）
# ローカル: npm run db:seed:local

# 1-4. シークレットを設定（コミット禁止）
npx wrangler secret put BETTER_AUTH_SECRET   # openssl rand -base64 32
npx wrangler secret put GEMINI_API_KEY
npx wrangler secret put CRON_SECRET
npx wrangler secret put RESEND_API_KEY       # マジックリンク送信（本番は必須）

# 1-5. wrangler.toml の [vars] を実値に更新
#   BETTER_AUTH_URL              … この Worker の公開 URL（/api/auth を提供する側）
#   BETTER_AUTH_TRUSTED_ORIGINS  … フロントのオリジン + localhost
#   CORS_ORIGINS                 … 同上（フロントのオリジンを必ず含める）

# 1-6. デプロイ
npm run deploy
```

デプロイ後に発行された Worker URL（例 `https://collabo-connect-api.<account>.workers.dev`）を
`BETTER_AUTH_URL` に設定し直して再デプロイしてください（マジックリンク URL の生成に使われます）。

### Cron（日次質問生成）

`api/wrangler.toml` の `[triggers] crons = ["0 15 * * *"]`（UTC 15:00 = JST 00:00）で
`scheduled()` が起動し、`runGenerateDailyQuestion()` を実行します。手動実行は次の HTTP でも可能です:

```sh
curl -X POST https://<api-url>/api/cron/generate-daily-question -H "x-cron-secret: <CRON_SECRET>"
```

## 2. フロント（Workers 静的アセット）

リポジトリルートの `wrangler.jsonc` が `./dist` を SPA として配信します（Vercel の rewrite 相当）。

```sh
# ルートで実行
cp .env.example .env
# VITE_API_URL に 1. の API URL を設定（例: https://collabo-connect-api.<account>.workers.dev）

npm run cf:deploy   # bun run build → npx wrangler deploy
```

> Cloudflare Pages（GitHub 連携の自動ビルド）を使う場合は、Build command を `npm run build`、
> Output directory を `dist`、環境変数に `VITE_API_URL` を設定してください。

## 3. ローカル開発

```sh
# API（http://localhost:8787）
cd api
cp .dev.vars.example .dev.vars   # ローカル用シークレット
npm run db:migrate:local && npm run db:seed:local
npm run dev

# 別ターミナルでフロント（http://localhost:8080）
VITE_API_URL=http://localhost:8787 npm run dev
```

ローカルから本番 API に繋ぐ場合は、API 側の `BETTER_AUTH_TRUSTED_ORIGINS` / `CORS_ORIGINS` に
`http://localhost:8080` を含めてください。

## 4. カスタムドメイン

Workers の **Settings → Triggers/Domains & Routes** からカスタムドメインを割り当てられます。
割り当て後は `BETTER_AUTH_URL` とフロントの `VITE_API_URL` を新ドメインに更新してください。
