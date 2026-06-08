import { describe, it, expect } from "vitest";
import { cn, formatJapaneseDate, formatJoinedDate, formatJstDate } from "./utils";

describe("cn", () => {
  it("単一のクラス名をマージする", () => {
    expect(cn("foo")).toBe("foo");
  });

  it("複数のクラス名をマージする", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("条件付きクラスを正しく適用する", () => {
    const isActive = true;
    const isInactive = false;
    expect(cn("base", isActive && "active")).toBe("base active");
    expect(cn("base", isInactive && "active")).toBe("base");
  });

  it("Tailwindの競合クラスを上書きする", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
  });

  it("undefinedやnullを無視する", () => {
    expect(cn("foo", undefined, null, "bar")).toBe("foo bar");
  });
});

describe("formatJoinedDate", () => {
  it("ISO文字列を年月表示に変換する", () => {
    expect(formatJoinedDate("2024-06-01T00:00:00.000Z")).toBe("2024年6月");
  });

  it("date型相当の文字列を年月表示に変換する", () => {
    expect(formatJoinedDate("2024-06-01")).toBe("2024年6月");
  });

  it("年月文字列をそのまま年月表示に変換する", () => {
    expect(formatJoinedDate("2024-06")).toBe("2024年6月");
  });

  it("値がない場合は空文字を返す", () => {
    expect(formatJoinedDate(null)).toBe("");
    expect(formatJoinedDate(undefined)).toBe("");
  });
});

describe("formatJapaneseDate", () => {
  it("ISO文字列を年月日表示に変換する", () => {
    expect(formatJapaneseDate("2026-03-15T00:00:00.000Z")).toBe("2026年3月15日");
  });

  it("date型相当の文字列を年月日表示に変換する", () => {
    expect(formatJapaneseDate("2026-03-15")).toBe("2026年3月15日");
  });

  it("値がない場合は空文字を返す", () => {
    expect(formatJapaneseDate(null)).toBe("");
    expect(formatJapaneseDate(undefined)).toBe("");
  });
});

describe("formatJstDate", () => {
  it("UTC午前0時台のタイムスタンプをJSTの日付に変換する", () => {
    // 2026-06-07T15:30:00Z = 2026-06-08 00:30 JST → 8日として表示する
    expect(formatJstDate("2026-06-07T15:30:00.000Z")).toBe("2026年6月8日");
  });

  it("通常時間帯のタイムスタンプを年月日表示に変換する", () => {
    expect(formatJstDate("2026-06-08T03:00:00.000Z")).toBe("2026年6月8日");
  });

  it("年跨ぎの境界（年末UTC→翌年JST）を正しく変換する", () => {
    // 2026-12-31T15:30:00Z = 2027-01-01 00:30 JST → 翌年として表示する
    expect(formatJstDate("2026-12-31T15:30:00.000Z")).toBe("2027年1月1日");
  });

  it("値がない・不正な場合は空文字を返す", () => {
    expect(formatJstDate(null)).toBe("");
    expect(formatJstDate(undefined)).toBe("");
    expect(formatJstDate("")).toBe("");
    expect(formatJstDate("not-a-date")).toBe("");
  });
});
