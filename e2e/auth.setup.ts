/**
 * Playwright E2E グローバルセットアップ
 *
 * テスト実行前に Supabase にパスワード認証でログインし、
 * 認証済みセッション（localStorage の Supabase トークン）を
 * storageState として保存する。
 *
 * 環境変数:
 *   E2E_USER_EMAIL    - テスト用ユーザーのメールアドレス
 *   E2E_USER_PASSWORD - テスト用ユーザーのパスワード
 *
 * セットアップ手順:
 *   1. Supabase Dashboard でテスト用ユーザーを作成（パスワード認証有効）
 *   2. .env に E2E_USER_EMAIL / E2E_USER_PASSWORD を設定
 *   3. npx playwright test で自動実行
 */
import { test as setup, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// .env から VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY を読み込む
function loadEnv(): Record<string, string> {
  const envPath = path.resolve(__dirname, "../.env");
  const env: Record<string, string> = {};
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIndex = trimmed.indexOf("=");
      if (eqIndex === -1) continue;
      const key = trimmed.slice(0, eqIndex).trim();
      const value = trimmed.slice(eqIndex + 1).trim();
      env[key] = value;
    }
  }
  return env;
}

const authFile = path.join(__dirname, ".auth", "user.json");

setup("authenticate", async ({ page }) => {
  const env = loadEnv();
  const supabaseUrl = env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey =
    env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const email = process.env.E2E_USER_EMAIL || env.E2E_USER_EMAIL;
  const password = process.env.E2E_USER_PASSWORD || env.E2E_USER_PASSWORD;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY. Set them in .env"
    );
  }
  if (!email || !password) {
    throw new Error(
      "Missing E2E_USER_EMAIL or E2E_USER_PASSWORD.\n" +
        "Set them in .env or as environment variables.\n\n" +
        "テスト用ユーザーの作成手順:\n" +
        "1. Supabase Dashboard → Authentication → Users → Add user\n" +
        "2. Email / Password でユーザーを作成\n" +
        "3. .env に以下を追加:\n" +
        "   E2E_USER_EMAIL=test@example.com\n" +
        "   E2E_USER_PASSWORD=your-password"
    );
  }

  // Supabase JS で直接ログイン（APIレベル）
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(
      `Supabase login failed: ${error.message}\n` +
        `Email: ${email}\n` +
        "テスト用ユーザーが Supabase に存在し、パスワード認証が有効か確認してください。"
    );
  }

  const session = data.session;
  if (!session) {
    throw new Error("Login succeeded but no session returned.");
  }

  // ブラウザにアクセスして localStorage にセッションを注入
  await page.goto("http://localhost:8080/login");

  // Supabase が localStorage に保存するキーにセッション情報を注入
  const storageKey = `sb-${new URL(supabaseUrl).hostname.split(".")[0]}-auth-token`;
  await page.evaluate(
    ({ key, session }) => {
      localStorage.setItem(key, JSON.stringify(session));
    },
    { key: storageKey, session }
  );

  // セッション注入後にリロードして認証状態を反映
  await page.goto("http://localhost:8080/");

  // 認証が通ってログインページ以外に遷移することを確認
  // （初期セットアップが必要な場合は /setup に遷移する可能性がある）
  await page.waitForURL((url) => {
    const pathname = url.pathname;
    return pathname !== "/login";
  }, { timeout: 15_000 });

  // 認証成功を確認（ログインページでないこと）
  const currentUrl = page.url();
  console.log(`✅ Authentication successful. Current URL: ${currentUrl}`);

  // .auth ディレクトリを作成
  const authDir = path.dirname(authFile);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  // 認証済みの storageState を保存
  await page.context().storageState({ path: authFile });
  console.log(`✅ Storage state saved to ${authFile}`);
});
