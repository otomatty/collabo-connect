# Vercelデプロイ手順

このドキュメントでは、現在開発中のアプリケーションをVercelにデプロイする手順を説明します。

## 事前準備

Vercelアカウントを作成し、GitHubアカウントと連携していることを確認してください。また、コードがGitHubのメインブランチ（例: `main` または `master`）にプッシュされていることを確認してください。

## デプロイ手順

### 1. Vercelダッシュボードで新しいプロジェクトを作成

1. Vercelのダッシュボードにログインします。
2. 右上の「Add New...」ボタンをクリックし、「Project」を選択します。
3. デプロイしたいGitHubリポジトリ（例: `collabo-connect`）を見つけて、「Import」ボタンをクリックします。

### 2. プロジェクトの設定

プロジェクトのインポート画面で、以下の設定を行います。

#### Project Name
任意のプロジェクト名を入力します。

#### Framework Preset
基本的には `Vite` が自動的に選択されます。選択されていない場合は `Vite` を手動で選択してください。

#### Root Directory
リポジトリのルートディレクトリにプロジェクトがあるため、変更は不要です（空欄のままでOK）。

#### Build and Output Settings
`vercel.json` で設定されているため、特別な設定は不要ですが、念のため確認してください。
*   **Build Command**: `bun run build`
*   **Output Directory**: `dist`
*   **Install Command**: `bun install`

#### Environment Variables (環境変数)
Supabaseと連携しているため、環境変数の設定が必須です。以下の環境変数を追加してください。

*   **Name**: `VITE_SUPABASE_URL`
    *   **Value**: SupabaseのProject Settings > API > URLにある `Project URL`
*   **Name**: `VITE_SUPABASE_PUBLISHABLE_KEY`
    *   **Value**: SupabaseのProject Settings > API > Project API keysにある `anon` または `publishable` キー

※ローカルの `.env` ファイルに設定している値と同じものを入力します。

### 3. デプロイの実行

すべての設定が完了したら、「Deploy」ボタンをクリックします。
ビルドプロセスが開始され、数分で完了します。

## デプロイ後の確認

デプロイが成功すると、プレビュー画面とURL（Domains）が表示されます。提供されたURLにアクセスし、以下の点を確認してください。

1.  画面が正常に表示されるか。
2.  データベース（Supabase）との通信（データの読み書きなど）が正常に行われるか。
3.  ルーティングが正しく機能するか。(ページ遷移してリロードしても404にならないか。※`vercel.json` の設定でSPAとしてルーティングされるようになっています。)

## その他の設定 (必要に応じて)

### カスタムドメインの設定
Vercelダッシュボードのプロジェクト内の「Settings」>「Domains」から、独自のドメインを設定することができます。

### Supabaseの認証設定 (Authentication)
SupabaseのAuthentication（ログイン機能）を使用している場合、Vercelのデプロイドメイン（またはカスタムドメイン）をSupabase側の許可リストに追加する必要があります。

1.  Supabaseダッシュボードを開きます。
2.  「Authentication」>「URL Configuration」を開きます。
3.  「Site URL」にVercelのメインURLを設定します。
4.  「Additional Redirect URLs」に、Vercelの他のプレビューURLなどを追加します。
