/**
 * Collabo Connect スタイルのマジックリンクメール用 HTML を生成します。
 * メールクライアント互換のためインラインスタイル・テーブルレイアウト・hex 色を使用しています。
 */

function escapeHtmlAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeHtmlText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function getMagicLinkEmailHtml(loginUrl: string): string {
  const safeUrl = escapeHtmlAttr(loginUrl);
  const safeUrlText = escapeHtmlText(loginUrl);

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Collabo Connect ログインリンク</title>
</head>
<body style="margin: 0; padding: 0; background-color: #fafafa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fafafa;">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width: 560px; background-color: #ffffff; border-radius: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td align="center" style="padding: 32px 32px 24px; background-color: #ffffff; border-radius: 10px 10px 0 0;">
              <div style="width: 64px; height: 64px; margin: 0 auto 16px; background-color: #d97706; border-radius: 12px; line-height: 64px; font-size: 32px; text-align: center;">🤝</div>
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #2d2a26; letter-spacing: -0.02em;">Collabo Connect</h1>
              <p style="margin: 8px 0 0; font-size: 13px; color: #6b5d52; line-height: 1.5;">AIインタビュー × グループ募集で<br />社内コミュニケーションを活性化</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 0 32px 32px;">
              <p style="margin: 0 0 24px; font-size: 15px; color: #2d2a26; line-height: 1.6;">ログインするには、下のボタンをクリックしてください。</p>
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding: 8px 0 24px;">
                    <a href="${safeUrl}" style="display: inline-block; padding: 14px 28px; background-color: #d97706; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 10px;">ログインする</a>
                  </td>
                </tr>
              </table>
              <p style="margin: 0; font-size: 13px; color: #6b5d52; line-height: 1.5;">ボタンが押せない場合は、以下のリンクをコピーしてブラウザのアドレスバーに貼り付けてください。</p>
              <p style="margin: 8px 0 0; font-size: 12px; word-break: break-all;"><a href="${safeUrl}" style="color: #d97706; text-decoration: underline;">${safeUrlText}</a></p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px 32px; border-top: 1px solid #e8e2db; border-radius: 0 0 10px 10px;">
              <p style="margin: 0; font-size: 12px; color: #6b5d52; line-height: 1.5;">このメールに心当たりがない場合は、そのまま破棄してください。</p>
              <p style="margin: 8px 0 0; font-size: 12px; color: #6b5d52;">Collabo Connect</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
