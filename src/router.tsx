import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  useNavigate,
} from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import LoginPage from "@/pages/LoginPage";
import SignupSuccessPage from "@/pages/SignupSuccessPage";
import HomePage from "@/pages/HomePage";
import InterviewPage from "@/pages/InterviewPage";
import BoardPage from "@/pages/BoardPage";
import BoardDetailPage from "@/pages/BoardDetailPage";
import BoardCreatePage from "@/pages/BoardCreatePage";
import MembersPage from "@/pages/MembersPage";
import MemberDetailPage from "@/pages/MemberDetailPage";
import MyPage from "@/pages/MyPage";
import NotFound from "@/pages/NotFound";
import InitialSetupPage from "@/pages/InitialSetupPage";

/** 認証済みユーザーのみアクセス可能なルートガード */
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }
  if (!user) {
    navigate({ to: "/login", replace: true });
    return null;
  }

  const isInitialSetup = profile && !profile.avatar_url;
  if (isInitialSetup) {
    navigate({ to: "/setup", replace: true });
    return null;
  }

  return <>{children}</>;
}

const rootRoute = createRootRoute({
  component: () => <Outlet />,
  notFoundComponent: NotFound,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});

const signupSuccessRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/signup-success",
  component: SignupSuccessPage,
});

const setupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/setup",
  component: () => (
    <RequireAuth>
      <InitialSetupPage />
    </RequireAuth>
  ),
});

const authenticatedLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "_authenticated",
  component: () => (
    <RequireAuth>
      <AppLayout />
    </RequireAuth>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => authenticatedLayoutRoute,
  path: "/",
  component: HomePage,
});

const interviewRoute = createRoute({
  getParentRoute: () => authenticatedLayoutRoute,
  path: "/interview",
  component: InterviewPage,
});

const boardRoute = createRoute({
  getParentRoute: () => authenticatedLayoutRoute,
  path: "/board",
  component: BoardPage,
});

const boardCreateRoute = createRoute({
  getParentRoute: () => authenticatedLayoutRoute,
  path: "/board/create",
  component: BoardCreatePage,
});

const boardIdRoute = createRoute({
  getParentRoute: () => authenticatedLayoutRoute,
  path: "/board/$id",
  component: BoardDetailPage,
});

const membersRoute = createRoute({
  getParentRoute: () => authenticatedLayoutRoute,
  path: "/members",
  component: MembersPage,
});

const memberIdRoute = createRoute({
  getParentRoute: () => authenticatedLayoutRoute,
  path: "/members/$id",
  component: MemberDetailPage,
});

const mypageRoute = createRoute({
  getParentRoute: () => authenticatedLayoutRoute,
  path: "/mypage",
  component: MyPage,
});

const routeTree = rootRoute.addChildren([
  loginRoute,
  signupSuccessRoute,
  setupRoute,
  authenticatedLayoutRoute.addChildren([
    indexRoute,
    interviewRoute,
    boardRoute,
    boardCreateRoute,
    boardIdRoute,
    membersRoute,
    memberIdRoute,
    mypageRoute,
  ]),
]);

// TanStack Router recommends strictNullChecks; we use ts-expect-error to allow without enabling project-wide
// @ts-expect-error - strictNullChecks not enabled
export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
