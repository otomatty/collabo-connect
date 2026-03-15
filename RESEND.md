# Resend メール配信セットアップガイド

本プロジェクトでは **Resend** を使ってメールを送信します。主に Better Auth の**マジックリンク**（パスワードなしログイン用のメール）送信に利用しています。

## 1. Resend アカウントと API キー

### 1.1 アカウント作成

1. [Resend](https://resend.com) にアクセスし、サインアップ（無料プランで利用可能）。
2. メールアドレスでアカウントを作成し、メール認証を完了する。

### 1.2 API キーの作成

1. ダッシュボードで **[API Keys](https://resend.com/api-keys)** を開く。
2. **Create API Key** をクリック。
3. 以下を設定する：
   - **Name**: 任意（例: `collabo-connect-production`）。最大 50 文字。
   - **Permission**: **Sending access** で十分（マジックリンク送信のみ）。必要に応じてドメインを制限可能。**Full access** はリソース管理用。
4. **Create API Key** をクリック。
5. 表示された API キー（`re_` で始まる）を**必ずコピーして安全な場所に保存**する。再表示はできない。

## 2. 送信元アドレス（From）

### 2.1 サンドボックス（開発・検証用）

- API キーだけ設定すると、Resend のサンドボックスアドレス **`onboarding@resend.dev`** から送信される。
- **制限**: 送信先は Resend に登録した自分のメールアドレスのみ。他ドメインには送れない。
- 開発時や「自分だけマジックリンクを受け取る」検証にはこれで十分。

### 2.2 独自ドメイン（本番推奨）

本番で任意のユーザーにメールを送る場合は、**ドメイン認証**が必要。

1. ダッシュボードの **[Domains](https://resend.com/domains)** を開く。
2. **Add Domain** で送信に使うドメインを追加（例: `yourcompany.com`）。
3. Resend が表示する **DNS レコード**を、ドメインの DNS 管理画面で追加する：
   - **TXT**（`_resend.yourcompany.com`）: ドメイン所有確認
   - **MX**（`bounce.yourcompany.com`）: バウンス用
   - **TXT**（`bounce.yourcompany.com`）: SPF
   - **CNAME**（`resend._domainkey.yourcompany.com`）: DKIM
4. 反映後（数分〜最大 48 時間）、Resend で **Verify** を実行。
5. 認証後、送信元として `noreply@yourcompany.com` などのアドレスを利用できる。

## 3. 本プロジェクトでの環境変数

| 変数名 | 必須 | 説明 |
|--------|------|------|
| `RESEND_API_KEY` | 本番でメール送信する場合 | Resend の API キー（`re_` で始まる）。 |
| `RESEND_FROM` | 任意 | 送信元アドレス。未設定時は `onboarding@resend.dev`。独自ドメイン認証後は `noreply@yourdomain.com` などを指定。 |

### 3.1 ローカル（api）

`api/.env` に追加する例：

```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxx
# 独自ドメインを使う場合のみ
# RESEND_FROM=noreply@yourdomain.com
```

- `RESEND_API_KEY` を設定すると、マジックリンクが Resend 経由で送信される（サンドボックス時は登録メールのみ）。
- 設定しない場合、開発時は **マジックリンクの URL が API のコンソールログに出力**され、メールは送られない（`[Dev] Magic link for ... : <url>`）。

### 3.2 Railway（本番 API）

1. Railway ダッシュボードで **api** サービスを開く。
2. **Variables** で以下を追加：
   - `RESEND_API_KEY` = 作成した API キー
   - （任意）`RESEND_FROM` = 認証済みドメインの送信元アドレス

本番（`NODE_ENV=production`）で `RESEND_API_KEY` が未設定の場合、マジックリンク要求時にエラーになり、ユーザーには「Email sending is not configured」が返ります。

## 4. 実装上の挙動

- **送信処理**: `api/src/auth.ts` の Better Auth `magicLink` プラグイン内で、`sendMagicLink` が Resend API（`POST https://api.resend.com/emails`）を呼び出す。
- **メール内容**: 件名「Collabo Connect ログインリンク」、本文にログイン用 URL を記載。
- カスタムしたい場合は `api/src/auth.ts` の `html` や `subject` を編集する。

## 5. チェックリスト

- [ ] Resend アカウント作成
- [ ] API キー作成（Sending access）し、値を安全に保管
- [ ] 本番用: 送信ドメインを追加し、DNS 設定・Verify 完了
- [ ] ローカル: `api/.env` に `RESEND_API_KEY`（と必要なら `RESEND_FROM`）を設定
- [ ] Railway: api サービスの Variables に `RESEND_API_KEY`（と必要なら `RESEND_FROM`）を設定

## 6. トラブルシューティング

| 現象 | 確認すること |
|------|----------------|
| 本番で「Email sending is not configured」 | api の `RESEND_API_KEY` が設定されているか。Railway の Variables を確認。 |
| メールが届かない | サンドボックス時は送信先が Resend に登録したメールか。迷惑メールフォルダも確認。 |
| Resend API エラー（4xx/5xx） | ダッシュボードの [Logs](https://resend.com/emails) で該当送信のエラー内容を確認。`RESEND_FROM` が未認証ドメインになっていないか。 |
| 開発でメールを送りたくない | `RESEND_API_KEY` を設定しなければ、ログに URL が出力されるだけ。 |

## 参考リンク

- [Resend Dashboard](https://resend.com)
- [API Keys - Resend Docs](https://resend.com/docs/dashboard/api-keys/introduction)
- [Send Email API](https://resend.com/docs/api-reference/emails/send-email)
- [Domains（ドメイン認証）](https://resend.com/domains)
