<?php
/**
 * Invite email template.
 * Variables available: $appName, $appUrl, $recipientName, $email, $password
 */
?><!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>You're invited to <?= htmlspecialchars($appName) ?></title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%);border-radius:16px 16px 0 0;padding:36px 40px;text-align:center;">
              <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">
                <?= htmlspecialchars($appName) ?>
              </h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">
                Project &amp; Task Tracker
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#fff;padding:40px;">
              <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a;">
                Welcome, <?= htmlspecialchars($recipientName) ?>! 👋
              </p>
              <p style="margin:0 0 28px;font-size:15px;color:#475569;line-height:1.6;">
                You've been invited to join <strong><?= htmlspecialchars($appName) ?></strong>.
                Your account is ready — use the credentials below to sign in.
              </p>

              <!-- Credentials box -->
              <table width="100%" cellpadding="0" cellspacing="0"
                style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:24px;margin-bottom:28px;">
                <tr>
                  <td>
                    <p style="margin:0 0 14px;font-size:13px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">
                      Your login credentials
                    </p>
                    <table cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="padding:6px 0;width:90px;font-size:13px;color:#94a3b8;font-weight:600;">Email</td>
                        <td style="padding:6px 0;font-size:14px;color:#0f172a;font-weight:600;"><?= htmlspecialchars($email) ?></td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;font-size:13px;color:#94a3b8;font-weight:600;">Password</td>
                        <td style="padding:6px 0;">
                          <code style="font-size:15px;font-family:monospace;color:#6366f1;background:#ede9fe;padding:3px 10px;border-radius:6px;letter-spacing:0.05em;"><?= htmlspecialchars($password) ?></code>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td align="center">
                    <a href="<?= htmlspecialchars($appUrl) ?>"
                      style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:10px;letter-spacing:0.02em;">
                      Sign in to <?= htmlspecialchars($appName) ?> &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px;font-size:13px;color:#94a3b8;line-height:1.6;">
                Or copy and paste this link into your browser:
              </p>
              <p style="margin:0;font-size:13px;color:#6366f1;word-break:break-all;">
                <a href="<?= htmlspecialchars($appUrl) ?>" style="color:#6366f1;"><?= htmlspecialchars($appUrl) ?></a>
              </p>

              <hr style="border:none;border-top:1px solid #e2e8f0;margin:28px 0;" />

              <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.6;">
                🔒 For security, please change your password after your first login.<br />
                If you didn't expect this invitation, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;border-radius:0 0 16px 16px;border-top:1px solid #e2e8f0;padding:20px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#94a3b8;">
                &copy; <?= date('Y') ?> <?= htmlspecialchars($appName) ?> &middot; This is an automated message, please do not reply.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
