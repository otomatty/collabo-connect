/**
 * E2E テスト用ユーザー作成スクリプト
 *
 * Supabase の signUp API を使ってテスト用ユーザーを作成します。
 *
 * 使い方:
 *   node e2e/create-test-user.mjs
 *
 * 環境変数（.env から自動読み込み）:
 *   VITE_SUPABASE_URL            - Supabase プロジェクトURL
 *   VITE_SUPABASE_PUBLISHABLE_KEY - Supabase anon key
 *   E2E_USER_EMAIL               - 作成するテスト用ユーザーのメール（デフォルト: e2e-test@collabo-connect.test）
 *   E2E_USER_PASSWORD            - パスワード（デフォルト: e2e-test-password-2024）
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync, appendFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");

// .env 読み込み
function loadEnv() {
  const envPath = resolve(rootDir, ".env");
  const env = {};
  if (existsSync(envPath)) {
    const content = readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIndex = trimmed.indexOf("=");
      if (eqIndex === -1) continue;
      env[trimmed.slice(0, eqIndex).trim()] = trimmed.slice(eqIndex + 1).trim();
    }
  }
  return env;
}

const env = loadEnv();
const supabaseUrl = env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const DEFAULT_EMAIL = "e2e-test@collabo-connect.test";
const DEFAULT_PASSWORD = "e2e-test-password-2024";

const email = env.E2E_USER_EMAIL || process.env.E2E_USER_EMAIL || DEFAULT_EMAIL;
const password = env.E2E_USER_PASSWORD || process.env.E2E_USER_PASSWORD || DEFAULT_PASSWORD;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ VITE_SUPABASE_URL と VITE_SUPABASE_PUBLISHABLE_KEY が必要です。");
  console.error("   .env ファイルに設定されているか確認してください。");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestUser() {
  console.log("🔧 E2E テスト用ユーザーを作成中...");
  console.log(`   Email: ${email}`);

  // まずログインを試みる（既にユーザーが存在するか確認）
  const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (loginData?.session) {
    console.log("✅ テスト用ユーザーは既に存在します。ログインに成功しました。");
    ensureEnvVars();
    return;
  }

  // ユーザーが存在しない場合、新規作成
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // メール確認をスキップするためのデータ
      data: {
        name: "E2E Test User",
      },
    },
  });

  if (error) {
    console.error(`❌ ユーザー作成に失敗: ${error.message}`);
    console.error("");
    console.error("💡 対処法:");
    console.error("   1. Supabase Dashboard → Authentication → Providers");
    console.error("      Email provider で 'Confirm email' を一時的に無効にする");
    console.error("   2. または Supabase Dashboard → Authentication → Users");
    console.error("      から手動でユーザーを作成してください");
    console.error("");
    console.error(`   Email: ${email}`);
    console.error(`   Password: ${password}`);
    process.exit(1);
  }

  if (data.user) {
    console.log(`✅ テスト用ユーザーを作成しました (ID: ${data.user.id})`);

    if (data.user.confirmed_at || data.session) {
      console.log("✅ メール確認済みです。すぐにテストを実行できます。");
    } else {
      console.warn("⚠️  メール確認が必要です。");
      console.warn("   Supabase Dashboard → Authentication → Users で該当ユーザーの");
      console.warn("   メールアドレスを手動で確認（Confirm）してください。");
      console.warn("");
      console.warn("   または Supabase Dashboard → Authentication → Providers → Email で");
      console.warn("   'Confirm email' を無効にして再度このスクリプトを実行してください。");
    }
  }

  ensureEnvVars();
}

function ensureEnvVars() {
  const envPath = resolve(rootDir, ".env");
  if (!existsSync(envPath)) {
    console.warn("⚠️  .env ファイルが見つかりません");
    return;
  }

  const content = readFileSync(envPath, "utf-8");
  const additions = [];

  if (!content.includes("E2E_USER_EMAIL")) {
    additions.push(`E2E_USER_EMAIL=${email}`);
  }
  if (!content.includes("E2E_USER_PASSWORD")) {
    additions.push(`E2E_USER_PASSWORD=${password}`);
  }

  if (additions.length > 0) {
    const toAppend = "\n\n# E2E テスト用ユーザー\n" + additions.join("\n") + "\n";
    appendFileSync(envPath, toAppend);
    console.log("✅ .env に E2E テスト用の認証情報を追加しました。");
  } else {
    console.log("ℹ️  .env には既に E2E 認証情報が設定されています。");
  }
}

createTestUser().catch(console.error);
