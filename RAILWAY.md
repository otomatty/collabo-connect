# Railway デプロイ手順（フル移行）

**現在のプロジェクト**: [collabo-connect](https://railway.com/project/c26ffc11-b25c-43df-836c-931a9697544c)

**想定**: 本番 DB が稼働するプロトタイプとして、**ホスト済みアプリ（Railway Web）** と **ローカル開発（localhost）** の両方から同じ Railway API・Postgres に接続できるようにする。

- **API**: https://api-production-4d1b.up.railway.app
- **Web**: https://web-production-28ea3.up.railway.app
- **Postgres**: プロジェクト内で追加済み

## 1. プロジェクトとリソース作成（完了済み）

- プロジェクト `collabo-connect` 作成・リンク済み
- Postgres / api / web サービス追加済み
- api 用環境変数: `DATABASE_URL`（Postgres 参照）、`BETTER_AUTH_SECRET` / `BETTER_AUTH_URL` / `BETTER_AUTH_TRUSTED_ORIGINS` / `CORS_ORIGINS` / `GEMINI_API_KEY` / `CRON_SECRET`（要ダッシュボードで実値に変更）。**CORS_ORIGINS** に本番 Web のオリジンを含める（例: `https://web-production-28ea3.up.railway.app`）。含めないとブラウザから API 呼び出しで CORS エラーになる。
- web 用: `VITE_API_URL=https://api-production-4d1b.up.railway.app` 設定済み
- 各サービスの Railway 提供ドメインを発行済み

## 2. API サービスの設定

**ダッシュボードで実施**（Railway プロジェクト → api サービス）:

1. **Source**: GitHub リポジトリを接続（`https://github.com/otomatty/collabo-connect`）
2. **Root Directory**: `api`
3. **Build Command**: `npm run build`
4. **Start Command**: `npm start`
5. **環境変数**: `BETTER_AUTH_SECRET`・`BETTER_AUTH_URL`・`GEMINI_API_KEY`・`CRON_SECRET` を実値に変更  
   - `BETTER_AUTH_SECRET`: ランダム文字列（例: `openssl rand -base64 32`）  
   - `BETTER_AUTH_URL`: API の公開 URL（例: `https://api-production-4d1b.up.railway.app`）  
   - `BETTER_AUTH_TRUSTED_ORIGINS`: **ホスト済み Web と localhost の両方**をカンマ区切りで指定（プロトタイプでローカルから本番 API に繋ぐため）。  
     例: `https://web-production-28ea3.up.railway.app,http://localhost:8080`  
   - **`CORS_ORIGINS`**: 同上。API がブラウザからのリクエストを許可するオリジン。未設定だと本番 Web から API 呼び出しで CORS エラーになる。例: `https://web-production-28ea3.up.railway.app,http://localhost:8080,http://localhost:5173`  
   - マジックリンク送信（本番）: `RESEND_API_KEY` と任意で `RESEND_FROM` を設定（手順は [RESEND.md](RESEND.md) を参照）  
   - CRON_SECRET: ランダム文字列（Cron 実行時に `x-cron-secret` ヘッダで送る値）

（`DATABASE_URL` は `${{Postgres.DATABASE_URL}}` で設定済み）

## 3. Web サービスの設定

**ダッシュボードで実施**（Railway プロジェクト → web サービス）:

1. **Source**: 上記と同じ GitHub リポジトリ（プロジェクトで 1 回接続すれば api/web で共有）
2. **Root Directory**: 指定しない（リポジトリルート）
3. **Build Command**: `npm run build`
4. **Start / Static**: Railpack が Vite ビルドと `dist` を自動検出

`VITE_API_URL=https://api-production-4d1b.up.railway.app` は設定済みです。

## 4. データベースの初期化

Railway CLI で Postgres にリンクし、Node スクリプトでスキーマを適用する（`railway run` が Postgres の `DATABASE_PUBLIC_URL` を注入するため、手動で URL を設定する必要はない）。

1. **Postgres にリンク**（初回またはサービスを切り替えるとき）:
   ```bash
   railway link --project c26ffc11-b25c-43df-836c-931a9697544c --service Postgres --environment production
   ```

2. **スキーマを適用**（`railway/schema.sql` → `railway/better-auth-schema.sql` の順で実行）:
   ```bash
   cd api && railway run -- node scripts/run-schema.mjs
   ```

- 事前に [Railway CLI のインストール](https://docs.railway.com/develop/cli) と `railway login` が必要。
- スキーマは冪等なので、再実行しても既存テーブルはそのままになる。

## 5. Cron（日次質問生成）

api サービスで Cron を有効にする場合:

- ダッシュボードの **api** → **Settings** で **Cron Schedule** に `0 15 * * *`（UTC 15:00 = JST 00:00）を設定。
- 実行時に `POST https://api-production-4d1b.up.railway.app/api/cron/generate-daily-question` を `x-cron-secret: <CRON_SECRET>` 付きで呼ぶ必要があります（Railway の Cron ドキュメント参照）。

## 6. ドメイン

- API / Web の Railway 提供ドメインは発行済み（上記 URL）。
- カスタムドメインはダッシュボードの各サービス **Settings** → **Networking** で追加できます。

## 7. ローカルから本番 API・DB に接続（プロトタイプ用）

本番の DB が稼働した状態で、ローカルでフロントのみ動かして同じ API に繋ぐ場合:

1. **API の `BETTER_AUTH_TRUSTED_ORIGINS`** に `http://localhost:8080`（ローカル開発サーバーのポート）を上記のとおり含めておく。
2. **ローカルで Web を起動**するとき、本番 API を向かせる:
   - 例: `VITE_API_URL=https://api-production-4d1b.up.railway.app npm run dev`（ルートで実行）
   - または `.env` に `VITE_API_URL=https://api-production-4d1b.up.railway.app` を設定。
3. ローカルの api は起動せず、ブラウザは Railway の API と Postgres を利用する。
