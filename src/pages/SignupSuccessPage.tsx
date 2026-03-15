import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export default function SignupSuccessPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm space-y-10 text-center">
        <div className="space-y-3">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-primary text-2xl text-primary-foreground shadow-sm">
            ✉️
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            アカウント作成完了
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            確認メールを送信しました。
            <br />
            メールボックスを確認して、ご登録のメールアドレスの認証を完了してください。
          </p>
        </div>

        <Button
          className="w-full"
          onClick={() => navigate({ to: "/login" })}
        >
          ログイン画面に戻る
        </Button>
      </div>
    </div>
  );
}
