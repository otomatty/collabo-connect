import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { Mail, CheckCircle2 } from "lucide-react";

export default function LoginPage() {
  const navigate = useNavigate();
  const { user, loading, signInWithEmail } = useAuth();

  const [email, setEmail] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [magicLinkSent, setMagicLinkSent] = useState(false);

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
      // パスワードなしで呼び出すことでMagic Link (OTP) を送信
      await signInWithEmail(email);
      setMagicLinkSent(true);
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
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Collabo Connect</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            AIインタビュー × グループ募集で<br />社内コミュニケーションを活性化
          </p>
        </div>

        {magicLinkSent ? (
          /* Magic Link 送信完了画面 */
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-foreground">メールを送信しました</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                <span className="font-medium text-foreground">{email}</span> 宛に
                ログインリンクを送信しました。<br />
                メールのリンクをクリックしてログインしてください。
              </p>
            </div>
            <div className="pt-2 space-y-3">
              <p className="text-xs text-muted-foreground">
                メールが届かない場合は、迷惑メールフォルダをご確認ください。
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setMagicLinkSent(false);
                  setEmail("");
                }}
              >
                別のメールアドレスで試す
              </Button>
            </div>
          </div>
        ) : (
          /* メールアドレス入力フォーム */
          <>
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

              {errorMsg && <p className="text-sm text-destructive">{errorMsg}</p>}

              <Button
                type="submit"
                className="w-full"
                disabled={authLoading}
              >
                <Mail className="mr-2 h-4 w-4" />
                {authLoading ? "送信中..." : "ログインリンクを送信"}
              </Button>
            </form>

            <p className="text-center text-xs text-muted-foreground leading-relaxed">
              メールアドレスを入力すると、ログイン用のリンクが届きます。<br />
              パスワードは不要です。
            </p>
          </>
        )}
      </div>
    </div>
  );
}
