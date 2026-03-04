import { test, expect } from "@playwright/test";

/**
 * 掲示板（Board）機能の E2E テスト
 *
 * テスト対象:
 * - 掲示板ページの基本表示
 * - カテゴリタブの切り替え
 * - 募集作成ページへの遷移
 * - フォーム入力・バリデーション
 * - ナビゲーション（ボトムナビ）
 */

test.describe("掲示板機能", () => {
  test.beforeEach(async ({ page }) => {
    // 各テスト前に掲示板ページへ遷移
    await page.goto("/board");
    // ページが完全にロードされるまで待つ
    await page.waitForLoadState("networkidle");
  });

  test("掲示板ページが正常に表示される", async ({ page }) => {
    // ページタイトル「グループ募集」が表示されていること
    await expect(page.getByText("グループ募集")).toBeVisible();

    // カテゴリタブが表示されていること
    await expect(page.getByRole("tab", { name: "すべて" })).toBeVisible();
    await expect(page.getByRole("tab", { name: /ごはん/ })).toBeVisible();
    await expect(page.getByRole("tab", { name: /勉強会/ })).toBeVisible();
    await expect(page.getByRole("tab", { name: /イベント/ })).toBeVisible();

    // 「募集する」ボタンが表示されていること
    await expect(page.getByRole("link", { name: /募集する/ })).toBeVisible();
  });

  test("カテゴリタブを切り替えられる", async ({ page }) => {
    // 初期状態で「すべて」タブが選択されている
    const allTab = page.getByRole("tab", { name: "すべて" });
    await expect(allTab).toHaveAttribute("data-state", "active");

    // 「ごはん」タブをクリック
    const foodTab = page.getByRole("tab", { name: /ごはん/ });
    await foodTab.click();
    await expect(foodTab).toHaveAttribute("data-state", "active");

    // 「勉強会」タブをクリック
    const studyTab = page.getByRole("tab", { name: /勉強会/ });
    await studyTab.click();
    await expect(studyTab).toHaveAttribute("data-state", "active");

    // 「イベント」タブをクリック
    const eventTab = page.getByRole("tab", { name: /イベント/ });
    await eventTab.click();
    await expect(eventTab).toHaveAttribute("data-state", "active");

    // 「すべて」に戻す
    await allTab.click();
    await expect(allTab).toHaveAttribute("data-state", "active");
  });

  test("「募集する」ボタンから募集作成ページに遷移できる", async ({ page }) => {
    // 「募集する」ボタンをクリック
    await page.getByRole("link", { name: /募集する/ }).click();

    // 募集作成ページに遷移していること
    await expect(page).toHaveURL(/\/board\/create/);

    // 作成ページの主要要素が表示されていること
    await expect(page.getByText("募集を作成")).toBeVisible();
    await expect(page.getByText("集まりやすいテーマ")).toBeVisible();
    await expect(page.getByText("カテゴリ")).toBeVisible();
    await expect(page.getByLabel("タイトル")).toBeVisible();
    await expect(page.getByLabel("エリア")).toBeVisible();
  });

  test("募集作成フォームに入力できる", async ({ page }) => {
    await page.goto("/board/create");
    await page.waitForLoadState("networkidle");

    // カテゴリ選択：「勉強会」を選択
    await page.getByRole("button", { name: /勉強会/ }).click();

    // タイトル入力
    const titleInput = page.getByLabel("タイトル");
    await titleInput.fill("React勉強会を開催します！");
    await expect(titleInput).toHaveValue("React勉強会を開催します！");

    // 「日程未定」をクリック
    await page.getByRole("button", { name: "未定" }).click();

    // エリア入力
    const areaInput = page.getByLabel("エリア");
    await areaInput.fill("渋谷");
    await expect(areaInput).toHaveValue("渋谷");

    // 概要入力
    const descTextarea = page.getByLabel("概要");
    await descTextarea.fill("Reactの最新機能について一緒に学びましょう！初心者大歓迎です。");
    await expect(descTextarea).toHaveValue(
      "Reactの最新機能について一緒に学びましょう！初心者大歓迎です。"
    );

    // 投稿ボタンが有効になっていること（タイトルとエリアが入力済み）
    const submitButton = page.getByRole("button", { name: /募集を投稿する/ });
    await expect(submitButton).toBeEnabled();
  });

  test("タイトル未入力で投稿ボタンが無効になる", async ({ page }) => {
    await page.goto("/board/create");
    await page.waitForLoadState("networkidle");

    // エリアだけ入力してタイトルは空のまま
    await page.getByLabel("エリア").fill("新宿");

    // 投稿ボタンが無効であること
    const submitButton = page.getByRole("button", { name: /募集を投稿する/ });
    await expect(submitButton).toBeDisabled();
  });

  test("おすすめテーマをクリックするとフォームに反映される", async ({ page }) => {
    await page.goto("/board/create");
    await page.waitForLoadState("networkidle");

    // おすすめテーマの1つをクリック
    const theme = page.getByRole("button", { name: /新宿でランチ行きませんか/ });
    if (await theme.isVisible()) {
      await theme.click();

      // タイトルに反映されていること
      const titleInput = page.getByLabel("タイトル");
      await expect(titleInput).toHaveValue("新宿でランチ行きませんか？");
    }
  });

  test("エリアのクイック選択ボタンが動作する", async ({ page }) => {
    await page.goto("/board/create");
    await page.waitForLoadState("networkidle");

    // 「オンライン」バッジをクリック
    const onlineBadge = page.locator("text=オンライン").first();
    if (await onlineBadge.isVisible()) {
      await onlineBadge.click();
      const areaInput = page.getByLabel("エリア");
      await expect(areaInput).toHaveValue("オンライン");
    }
  });
});

test.describe("ボトムナビゲーション", () => {
  test("各ページに正常に遷移できる", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // 掲示板タブをクリック
    await page.getByRole("link", { name: "掲示板" }).click();
    await expect(page).toHaveURL(/\/board/);
    await expect(page.getByText("グループ募集")).toBeVisible();

    // メンバータブをクリック
    await page.getByRole("link", { name: "メンバー" }).click();
    await expect(page).toHaveURL(/\/members/);
    await expect(page.getByText("メンバー")).toBeVisible();

    // マイページタブをクリック
    await page.getByRole("link", { name: "マイページ" }).click();
    await expect(page).toHaveURL(/\/mypage/);

    // ホームタブをクリック
    await page.getByRole("link", { name: "ホーム" }).click();
    await expect(page).toHaveURL("/");
  });
});

test.describe("ホームページ", () => {
  test("ホームページが正常に表示される", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // ユーザー名が表示されていること（「さん」で終わるヘッダー）
    await expect(page.getByText(/さん$/)).toBeVisible();

    // おはようメッセージ
    await expect(page.getByText(/おはようございます/)).toBeVisible();

    // 「すべて見る」リンクが掲示板に繋がること
    const seeAllLink = page.getByRole("link", { name: /すべて見る/ });
    if (await seeAllLink.isVisible()) {
      await seeAllLink.click();
      await expect(page).toHaveURL(/\/board/);
    }
  });
});

test.describe("コンソールエラー検出", () => {
  test("主要ページでJSエラーが発生しないこと", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        const text = msg.text();
        // 既知の無害なエラーを除外
        if (
          text.includes("404 Error: User attempted") ||
          text.includes("Download the React DevTools")
        ) {
          return;
        }
        errors.push(text);
      }
    });

    // ホームページ
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    // 掲示板ページ
    await page.goto("/board");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    // メンバーページ
    await page.goto("/members");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    // マイページ
    await page.goto("/mypage");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    // 致命的なJSエラーが0件であること
    expect(errors, `Unexpected console errors: ${errors.join("\n")}`).toHaveLength(0);
  });
});
