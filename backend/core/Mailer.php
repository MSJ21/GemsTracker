<?php
namespace Core;

/**
 * Minimal SMTP mailer — no Composer dependency.
 * Supports STARTTLS (port 587) as used by Outlook / Office 365.
 */
class Mailer
{
    private string $host;
    private int    $port;
    private string $user;
    private string $pass;
    private string $from;
    private string $fromName;

    public function __construct()
    {
        $this->host     = $_ENV['MAIL_HOST']      ?? 'smtp.office365.com';
        $this->port     = (int)($_ENV['MAIL_PORT'] ?? 587);
        $this->user     = $_ENV['MAIL_USER']      ?? '';
        $this->pass     = $_ENV['MAIL_PASS']      ?? '';
        $this->from     = $_ENV['MAIL_FROM']      ?? $_ENV['MAIL_USER'] ?? '';
        $this->fromName = $_ENV['MAIL_FROM_NAME'] ?? (defined('APP_NAME') ? APP_NAME : 'Tracker');
    }

    /** Send an HTML email. Returns true on success, throws on failure. */
    public function send(string $toEmail, string $toName, string $subject, string $htmlBody): bool
    {
        if (empty($this->user) || empty($this->pass)) {
            throw new \RuntimeException('Mail credentials not configured in .env');
        }

        $boundary = md5(uniqid((string)mt_rand(), true));
        $headers  = implode("\r\n", [
            "MIME-Version: 1.0",
            "Content-Type: multipart/alternative; boundary=\"{$boundary}\"",
            "From: =?UTF-8?B?" . base64_encode($this->fromName) . "?= <{$this->from}>",
            "To: =?UTF-8?B?" . base64_encode($toName) . "?= <{$toEmail}>",
            "Subject: =?UTF-8?B?" . base64_encode($subject) . "?=",
            "X-Mailer: PHP/" . PHP_VERSION,
        ]);

        $plainText = strip_tags(str_replace(['<br>', '<br/>', '<br />', '</p>', '</div>'], "\n", $htmlBody));

        $body = "--{$boundary}\r\n"
              . "Content-Type: text/plain; charset=UTF-8\r\n"
              . "Content-Transfer-Encoding: base64\r\n\r\n"
              . chunk_split(base64_encode($plainText)) . "\r\n"
              . "--{$boundary}\r\n"
              . "Content-Type: text/html; charset=UTF-8\r\n"
              . "Content-Transfer-Encoding: base64\r\n\r\n"
              . chunk_split(base64_encode($htmlBody)) . "\r\n"
              . "--{$boundary}--";

        $this->smtpSend($toEmail, $subject, $headers, $body);
        return true;
    }

    private function smtpSend(string $to, string $subject, string $headers, string $body): void
    {
        $sock = fsockopen($this->host, $this->port, $errno, $errstr, 15);
        if (!$sock) {
            throw new \RuntimeException("SMTP connect failed ({$this->host}:{$this->port}): {$errstr}");
        }

        stream_set_timeout($sock, 15);

        $this->expect($sock, 220, 'CONNECT');
        $this->cmd($sock, "EHLO " . gethostname(), 250);
        $this->cmd($sock, "STARTTLS", 220);

        // Upgrade to TLS
        if (!stream_socket_enable_crypto($sock, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
            fclose($sock);
            throw new \RuntimeException('STARTTLS negotiation failed');
        }

        $this->cmd($sock, "EHLO " . gethostname(), 250);
        $this->cmd($sock, "AUTH LOGIN", 334);
        $this->cmd($sock, base64_encode($this->user), 334);
        $this->cmd($sock, base64_encode($this->pass), 235);
        $this->cmd($sock, "MAIL FROM:<{$this->from}>", 250);
        $this->cmd($sock, "RCPT TO:<{$to}>", 250);
        $this->cmd($sock, "DATA", 354);

        fwrite($sock, $headers . "\r\n\r\n" . $body . "\r\n.\r\n");
        $this->expect($sock, 250, 'DATA end');

        $this->cmd($sock, "QUIT", 221);
        fclose($sock);
    }

    private function cmd($sock, string $cmd, int $expectCode): string
    {
        fwrite($sock, $cmd . "\r\n");
        return $this->expect($sock, $expectCode, $cmd);
    }

    private function expect($sock, int $code, string $ctx): string
    {
        $response = '';
        while ($line = fgets($sock, 512)) {
            $response .= $line;
            // Multi-line responses have a dash after the code; final line has a space
            if (isset($line[3]) && $line[3] === ' ') break;
        }
        $actual = (int)substr($response, 0, 3);
        if ($actual !== $code) {
            throw new \RuntimeException("SMTP [{$ctx}] expected {$code}, got {$actual}: " . trim($response));
        }
        return $response;
    }

    /** Check whether mail is configured */
    public static function isConfigured(): bool
    {
        return !empty($_ENV['MAIL_USER']) && !empty($_ENV['MAIL_PASS']);
    }
}
