import { describe, it, expect } from "vitest";
import { cn, formatJoinedDate } from "./utils";

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
