<?php
namespace App\Services;

use Core\Mailer;

class InviteMailer
{
    /**
     * Send a welcome/invite email with the user's login credentials.
     *
     * @param string $toEmail
     * @param string $toName
     * @param string $plainPassword  The raw (unhashed) password
     * @return bool  true = sent, false = skipped (mail not configured)
     * @throws \RuntimeException on SMTP failure
     */
    public static function send(string $toEmail, string $toName, string $plainPassword): bool
    {
        if (!Mailer::isConfigured()) {
            return false; // silent skip when SMTP not set up
        }

        $appName = defined('APP_NAME') ? APP_NAME : ($_ENV['MAIL_FROM_NAME'] ?? 'Tracker');
        $appUrl  = rtrim($_ENV['APP_URL'] ?? '', '/') ?: 'http://localhost';

        // Render template
        ob_start();
        $recipientName = $toName;
        $email         = $toEmail;
        $password      = $plainPassword;
        include APP_ROOT . '/app/Templates/invite_email.php';
        $html = ob_get_clean();

        $mailer = new Mailer();
        return $mailer->send(
            $toEmail,
            $toName,
            "You're invited to {$appName} — Your login credentials",
            $html,
        );
    }
}
