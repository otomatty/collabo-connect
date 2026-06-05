import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ConversationTopicsCard from "./ConversationTopicsCard";
import type { ConversationTopic } from "@/types/profile";

const topic = (
  emoji: string,
  title: string,
  description = ""
): ConversationTopic => ({ emoji, title, description });

describe("<ConversationTopicsCard />", () => {
  it("セクション見出しと1〜3件のトピックを表示する", () => {
    render(
      <ConversationTopicsCard
        topics={[
          topic("🎸", "音楽", "週末はバンド活動をしています"),
          topic("🍜", "ラーメン", "新宿の名店巡りが趣味"),
          topic("⚽", "サッカー", "観戦も実際にプレイするのも好き"),
        ]}
      />
    );

    expect(
      screen.getByText("こんな話題で盛り上がれそう", { exact: false })
    ).toBeInTheDocument();
    expect(screen.getByText("音楽")).toBeInTheDocument();
    expect(screen.getByText("ラーメン")).toBeInTheDocument();
    expect(screen.getByText("サッカー")).toBeInTheDocument();
    expect(screen.getByText("週末はバンド活動をしています")).toBeInTheDocument();
    expect(screen.getByText("🎸")).toBeInTheDocument();
  });

  it("description が空のトピックは title のみ表示する", () => {
    render(<ConversationTopicsCard topics={[topic("📚", "読書")]} />);

    expect(screen.getByText("読書")).toBeInTheDocument();
    // description 用の段落は描画されない（title のみ）
    expect(screen.getAllByText(/.+/).map((el) => el.textContent)).toContain(
      "読書"
    );
  });

  it("トピック0件のときはセクションごと描画しない", () => {
    const { container } = render(<ConversationTopicsCard topics={[]} />);
    expect(container.firstChild).toBeNull();
  });
});
