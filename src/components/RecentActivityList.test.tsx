import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  createMemoryHistory,
} from "@tanstack/react-router";
import RecentActivityList from "./RecentActivityList";
import type { Activity } from "@/hooks/useProfiles";

type PostingRow = Extract<Activity, { type: "posting_created" }>["posting"];

const posting = (id: string, title: string, category = "food"): PostingRow => ({
  id,
  title,
  category,
  area: "新宿",
  creator_id: "creator",
  date: null,
  date_undecided: null,
  description: null,
  is_online: null,
  created_at: null,
  updated_at: null,
});

/**
 * RecentActivityList renders TanStack Router `<Link>`s, which require a router
 * context. Wrap the component in a minimal in-memory router that knows the
 * `/board/$id` route so links resolve during the test.
 */
function renderWithRouter(ui: React.ReactElement) {
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: () => ui,
  });
  const boardRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/board/$id",
    component: () => null,
  });
  // strictNullChecks not enabled — mirrors the directive in src/router.tsx
  // @ts-expect-error - strictNullChecks not enabled
  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute, boardRoute]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  return render(<RouterProvider router={router} />);
}

describe("<RecentActivityList />", () => {
  it("0件のときは空状態メッセージを表示する", async () => {
    renderWithRouter(<RecentActivityList activities={[]} />);
    expect(await screen.findByText("まだ活動がありません")).toBeInTheDocument();
  });

  it("各エントリ種別を時系列順に表示する", async () => {
    const activities: Activity[] = [
      {
        type: "posting_created",
        posting: posting("p1", "もくもく会を開催します"),
        at: "2026-05-01T10:00:00.000Z",
      },
      {
        type: "posting_participated",
        posting: posting("p2", "ランチ会"),
        action: "join",
        at: "2026-04-20T10:00:00.000Z",
      },
      {
        type: "question_answered",
        question: "好きな開発環境は？",
        answer: "VS Code を愛用しています",
        at: "2026-04-10T10:00:00.000Z",
      },
    ];

    renderWithRouter(<RecentActivityList activities={activities} />);

    expect(
      await screen.findByText("もくもく会を開催します")
    ).toBeInTheDocument();
    expect(screen.getByText("ランチ会")).toBeInTheDocument();
    expect(screen.getByText("好きな開発環境は？")).toBeInTheDocument();
    expect(screen.getByText("VS Code を愛用しています")).toBeInTheDocument();
    // 募集の作成/参加の種別ラベルが出る
    expect(screen.getByText(/募集を作成/)).toBeInTheDocument();
    expect(screen.getByText(/参加/)).toBeInTheDocument();
  });

  it("募集エントリは /board/:id へのリンクになる", async () => {
    renderWithRouter(
      <RecentActivityList
        activities={[
          {
            type: "posting_created",
            posting: posting("abc123", "勉強会"),
            at: "2026-05-01T10:00:00.000Z",
          },
        ]}
      />
    );

    const link = await screen.findByRole("link", { name: /勉強会/ });
    expect(link).toHaveAttribute("href", "/board/abc123");
  });

  it("質問回答エントリはリンクにしない", async () => {
    renderWithRouter(
      <RecentActivityList
        activities={[
          {
            type: "question_answered",
            question: "好きな言語は？",
            answer: "TypeScript",
            at: "2026-04-10T10:00:00.000Z",
          },
        ]}
      />
    );

    expect(await screen.findByText("好きな言語は？")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
