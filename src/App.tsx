import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfiles";
import AppLayout from "./components/AppLayout";
import LoginPage from "./pages/LoginPage";
import SignupSuccessPage from "./pages/SignupSuccessPage";
import HomePage from "./pages/HomePage";
import InterviewPage from "./pages/InterviewPage";
import BoardPage from "./pages/BoardPage";
import BoardDetailPage from "./pages/BoardDetailPage";
import BoardCreatePage from "./pages/BoardCreatePage";
import MembersPage from "./pages/MembersPage";
import MemberDetailPage from "./pages/MemberDetailPage";
import MyPage from "./pages/MyPage";
import NotFound from "./pages/NotFound";
import InitialSetupPage from "./pages/InitialSetupPage";

const queryClient = new QueryClient();

/** 認証済みユーザーのみアクセス可能なルートガード */
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile(user?.id);
  const location = useLocation();

  if (loading || (user && profileLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;

  // プロフィールが取得できている場合、初期設定の判定を行う
  // スキップ不可のため、初期設定で必須となる情報（例：アバターURL）が空の場合はセットアップ画面に誘導する
  const isInitialSetup = profile && (!profile.avatar_url);
  
  if (isInitialSetup && location.pathname !== "/setup") {
    return <Navigate to="/setup" replace />;
  }

  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup-success" element={<SignupSuccessPage />} />
            <Route path="/setup" element={
              <RequireAuth>
                <InitialSetupPage />
              </RequireAuth>
            } />
            <Route
              element={
                <RequireAuth>
                  <AppLayout />
                </RequireAuth>
              }
            >
              <Route path="/" element={<HomePage />} />
              <Route path="/interview" element={<InterviewPage />} />
              <Route path="/board" element={<BoardPage />} />
              <Route path="/board/create" element={<BoardCreatePage />} />
              <Route path="/board/:id" element={<BoardDetailPage />} />
              <Route path="/members" element={<MembersPage />} />
              <Route path="/members/:id" element={<MemberDetailPage />} />
              <Route path="/mypage" element={<MyPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
