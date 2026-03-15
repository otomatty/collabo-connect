# Railway デプロイ手順（フル移行）

**現在のプロジェクト**: [collabo-connect](https://railway.com/project/c26ffc11-b25c-43df-836c-931a9697544c)

- **API**: https://api-production-4d1b.up.railway.app
- **Web**: https://web-production-28ea3.up.railway.app
- **Postgres**: プロジェクト内で追加済み

## 1. プロジェクトとリソース作成（完了済み）

- プロジェクト `collabo-connect` 作成・リンク済み
- Postgres / api / web サービス追加済み
- api 用環境変数: `DATABASE_URL`（Postgres 参照）、`SUPABASE_JWT_SECRET` / `GEMINI_API_KEY` / `CRON_SECRET`（要ダッシュボードで実値に変更）
- web 用: `VITE_API_URL=https://api-production-4d1b.up.railway.app` 設定済み
- 各サービスの Railway 提供ドメインを発行済み

## 2. API サービスの設定

**ダッシュボードで実施**（Railway プロジェクト → api サービス）:

1. **Source**: GitHub リポジトリを接続（`https://github.com/otomatty/collabo-connect`）
2. **Root Directory**: `api`
3. **Build Command**: `npm run build`
4. **Start Command**: `npm start`
5. **環境変数**: `SUPABASE_JWT_SECRET`・`GEMINI_API_KEY`・`CRON_SECRET` をプレースホルダから実値に変更  
   - Supabase: Project Settings → API → JWT Secret  
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

**いずれかで実行**:

- **Railway ダッシュボード**: Postgres サービス → **Data** タブ → **Query** で `railway/schema.sql` の内容を貼って実行
- **ローカルに psql がある場合**:
  ```bash
  railway link --service Postgres --environment production
  railway run -e production -- psql "$DATABASE_PUBLIC_URL" -f railway/schema.sql
  ```

## 5. Cron（日次質問生成）

api サービスで Cron を有効にする場合:

- ダッシュボードの **api** → **Settings** で **Cron Schedule** に `0 15 * * *`（UTC 15:00 = JST 00:00）を設定。
- 実行時に `POST https://api-production-4d1b.up.railway.app/api/cron/generate-daily-question` を `x-cron-secret: <CRON_SECRET>` 付きで呼ぶ必要があります（Railway の Cron ドキュメント参照）。

## 6. ドメイン

- API / Web の Railway 提供ドメインは発行済み（上記 URL）。
- カスタムドメインはダッシュボードの各サービス **Settings** → **Networking** で追加できます。
