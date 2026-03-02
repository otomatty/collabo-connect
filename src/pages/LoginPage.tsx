import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
  const navigate = useNavigate();
  const { user, loading, signInWithEmail, signUpWithEmail } = useAuth();
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // 既にログイン済みならホームへ
  useEffect(() => {
    if (!loading && user) {
      navigate("/", { replace: true });
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setErrorMsg("");

    try {
      if (isSignUp) {
        await signUpWithEmail(email, password);
        navigate("/signup-success");
      } else {
        await signInWithEmail(email, password);
      }
    } catch (error) {
      if (error instanceof Error) {
        setErrorMsg(error.message);
      } else {
        setErrorMsg("認証エラーが発生しました");
      }
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm space-y-10">
        {/* Logo area */}
        <div className="space-y-3 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-primary text-2xl text-primary-foreground shadow-sm">
            🤝
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Collabo-Link</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            共通点とリスペクトで<br />自然に集まれる社内ハブ
          </p>
        </div>

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">メールアドレス</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">パスワード</Label>
            <Input
              id="password"
              type="password"
              placeholder="パスワードを入力"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {errorMsg && <p className="text-sm text-destructive">{errorMsg}</p>}

          <Button
            type="submit"
            className="w-full"
            disabled={authLoading}
          >
            {authLoading ? "処理中..." : isSignUp ? "アカウント作成" : "ログイン"}
          </Button>
        </form>

        <div className="text-center text-sm">
          <button
            type="button"
            className="text-primary hover:underline font-medium"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setErrorMsg("");
            }}
          >
            {isSignUp ? "すでにアカウントをお持ちの方はこちらからログイン" : "アカウントを作成する"}
          </button>
        </div>
      </div>
    </div>
  );
}
