import { describe, it, expect } from "vitest";
import {
  getCategoryLabel,
  getCategoryEmoji,
  popularAreas,
} from "./constants";

describe("getCategoryLabel", () => {
  it("food のラベルを返す", () => {
    expect(getCategoryLabel("food")).toBe("ごはん・飲み");
  });

  it("study のラベルを返す", () => {
    expect(getCategoryLabel("study")).toBe("勉強会・技術相談");
  });

  it("event のラベルを返す", () => {
    expect(getCategoryLabel("event")).toBe("イベント");
  });
});

describe("getCategoryEmoji", () => {
  it("food の絵文字を返す", () => {
    expect(getCategoryEmoji("food")).toBe("🍽️");
  });

  it("study の絵文字を返す", () => {
    expect(getCategoryEmoji("study")).toBe("📚");
  });

  it("event の絵文字を返す", () => {
    expect(getCategoryEmoji("event")).toBe("🎉");
  });
});

describe("popularAreas", () => {
  it("人気エリアの配列を含む", () => {
    expect(popularAreas).toContain("東京");
    expect(popularAreas).toContain("渋谷");
    expect(popularAreas).toContain("オンライン");
  });

  it("人気エリアが少なくとも1つ以上ある", () => {
    expect(popularAreas.length).toBeGreaterThan(0);
  });
});
