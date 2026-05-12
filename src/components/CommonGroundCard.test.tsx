import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import CommonGroundCard, { computeCommonGround } from "./CommonGroundCard";
import type { ProfilePublicTag } from "@/types/tags";

const tag = (
  name: string,
  category: ProfilePublicTag["category"] = "skill",
  tag_id = name
): ProfilePublicTag => ({ tag_id, name, category });

describe("computeCommonGround", () => {
  it("共通するタグとエリアを抽出する", () => {
    const result = computeCommonGround(
      ["React", "TypeScript"],
      ["新宿"],
      [tag("React"), tag("Go")],
      ["新宿", "渋谷"]
    );
    expect(result.commonAreas).toEqual(["新宿"]);
    expect(result.commonTags.map((t) => t.name)).toEqual(["React"]);
    expect(result.fallback).toBeNull();
  });

  it("大文字小文字の違いを無視してマッチする", () => {
    const result = computeCommonGround(
      ["react"],
      [],
      [tag("React")],
      []
    );
    expect(result.commonTags.map((t) => t.name)).toEqual(["React"]);
  });

  it("共通0件の場合、最多カテゴリから1件をフォールバックに選ぶ", () => {
    const result = computeCommonGround(
      ["Vue"],
      [],
      [
        tag("React", "skill", "t1"),
        tag("Go", "skill", "t2"),
        tag("ラーメン", "hobby", "t3"),
      ],
      []
    );
    expect(result.commonTags).toEqual([]);
    expect(result.fallback?.category).toBe("skill");
    expect(["React", "Go"]).toContain(result.fallback?.name);
  });

  it("共通0件 & member タグ無しの場合は fallback も null", () => {
    const result = computeCommonGround(["Vue"], ["梅田"], [], []);
    expect(result.fallback).toBeNull();
  });
});

describe("<CommonGroundCard />", () => {
  it("共通あり: ハイライト見出しと共通バッジを表示する", () => {
    render(
      <CommonGroundCard
        viewerTags={["React"]}
        viewerAreas={["新宿"]}
        memberTags={[tag("React"), tag("Go")]}
        memberAreas={["新宿", "渋谷"]}
      />
    );
    expect(screen.getByText("🤝 あなたと共通")).toBeInTheDocument();
    expect(screen.getByText("#新宿")).toBeInTheDocument();
    expect(screen.getByText("#React")).toBeInTheDocument();
    expect(screen.queryByText("#Go")).not.toBeInTheDocument();
  });

  it("共通0件 + suggestion あり: 話題にできそうを表示する", () => {
    render(
      <CommonGroundCard
        viewerTags={["Vue"]}
        viewerAreas={[]}
        memberTags={[tag("React", "skill"), tag("Go", "skill")]}
        memberAreas={[]}
      />
    );
    expect(screen.getByText("💡 話題にできそう")).toBeInTheDocument();
    expect(screen.queryByText("🤝 あなたと共通")).not.toBeInTheDocument();
  });

  it("共通も suggestion も無ければ何もレンダリングしない", () => {
    const { container } = render(
      <CommonGroundCard
        viewerTags={["Vue"]}
        viewerAreas={["梅田"]}
        memberTags={[]}
        memberAreas={[]}
      />
    );
    expect(container.firstChild).toBeNull();
  });
});
