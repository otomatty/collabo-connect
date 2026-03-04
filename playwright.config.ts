import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E テスト設定
 *
 * 認証フロー:
 * 1. global-setup.ts で Supabase にパスワード認証でログイン
 * 2. 認証済みセッション（storageState）を .auth/user.json に保存
 * 3. 各テストは保存された storageState を再利用して認証済み状態で実行
 *
 * テスト実行:
 *   npx playwright test           # 全テスト実行
 *   npx playwright test --ui      # UIモードで実行
 *   npx playwright test --headed  # ブラウザ表示しながら実行
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["html", { open: "never" }], ["list"]],

  use: {
    baseURL: "http://localhost:8080",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    // 認証セットアップ（最初に実行される）
    {
      name: "setup",
      testMatch: /.*\.setup\.ts/,
    },
    // メインテスト（認証済み状態を使用）
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "./e2e/.auth/user.json",
      },
      dependencies: ["setup"],
    },
  ],

  // 開発サーバーを自動起動（CI/CD向け）
  webServer: {
    command: "npm run dev",
    url: "http://localhost:8080",
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
