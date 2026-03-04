import { useState, useEffect, useCallback } from "react";
import type { GuideKey } from "@/lib/guideConfig";

const STORAGE_PREFIX = "collabo-connect-guide";
const GLOBAL_KEY = `${STORAGE_PREFIX}-global`;

/** 特定のガイドが表示済みかどうかをlocalStorageから取得 */
function hasSeenGuide(key: string): boolean {
  if (typeof window === "undefined") return true;
  try {
    const global = localStorage.getItem(GLOBAL_KEY);
    if (global === "true") return true; // すべてのガイドを非表示にしている
    const value = localStorage.getItem(`${STORAGE_PREFIX}-${key}`);
    return value === "true";
  } catch {
    // localStorage が使用できない環境では、ガイドが何度も表示されないよう「表示済み」と扱う
    return true;
  }
}

/** ガイドを表示済みとして記録 */
function markGuideAsSeen(key: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${STORAGE_PREFIX}-${key}`, "true");
  } catch {
    // ignore
  }
}

/** すべてのガイドを非表示にする */
function setGlobalDismiss(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(GLOBAL_KEY, "true");
  } catch {
    // ignore
  }
}

/**
 * 初回ユーザー向けガイドの表示制御フック
 * @param guideKey 画面識別用のキー
 * @returns ガイドを表示するか、閉じる処理、今後表示しない設定
 */
export function useGuide(guideKey: GuideKey) {
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    setShouldShow(!hasSeenGuide(guideKey));
  }, [guideKey]);

  const dismiss = useCallback(
    (hideAllGuides = false) => {
      if (hideAllGuides) {
        setGlobalDismiss();
      } else {
        markGuideAsSeen(guideKey);
      }
      setShouldShow(false);
    },
    [guideKey]
  );

  return { shouldShow, dismiss };
}
