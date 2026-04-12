<?php
namespace App\Controllers;

use App\Models\Setting;
use Core\Controller;

class SettingsController extends Controller
{
    private Setting $model;

    public function __construct()
    {
        $this->model = new Setting();
    }

    public function index(array $params = []): never
    {
        $this->success($this->model->all());
    }

    public function update(array $params = []): never
    {
        $data = $this->input();

        if (isset($data['site_name'])) {
            $name = trim($data['site_name']);
            if ($name === '') {
                $this->error('Site name cannot be empty');
            }
            $this->model->set('site_name', $name);
        }

        if (isset($data['task_statuses'])) {
            $this->model->set('task_statuses', $data['task_statuses']);
        }

        $logo = $this->uploadFile('site_logo');
        if ($logo) {
            $this->model->set('site_logo', $logo);
        } elseif (!empty($data['remove_logo'])) {
            $this->model->set('site_logo', '');
        }

        $this->success($this->model->all(), 'Settings saved');
    }

    /** GET /api/admin/mail-settings — read current SMTP config (password masked) */
    public function mailIndex(array $params = []): never
    {
        $this->success([
            'mail_host'      => $_ENV['MAIL_HOST']      ?? 'smtp.office365.com',
            'mail_port'      => $_ENV['MAIL_PORT']      ?? '587',
            'mail_user'      => $_ENV['MAIL_USER']      ?? '',
            'mail_from'      => $_ENV['MAIL_FROM']      ?? '',
            'mail_from_name' => $_ENV['MAIL_FROM_NAME'] ?? '',
            'app_url'        => $_ENV['APP_URL']        ?? '',
            'mail_configured'=> \Core\Mailer::isConfigured(),
        ]);
    }

    /** POST /api/admin/mail-settings — persist SMTP config to .env */
    public function mailUpdate(array $params = []): never
    {
        $data = $this->input();
        $envFile = APP_ROOT . '/.env';

        $allowed = [
            'MAIL_HOST'      => $data['mail_host']      ?? null,
            'MAIL_PORT'      => $data['mail_port']      ?? null,
            'MAIL_USER'      => $data['mail_user']      ?? null,
            'MAIL_FROM'      => $data['mail_from']      ?? null,
            'MAIL_FROM_NAME' => $data['mail_from_name'] ?? null,
            'APP_URL'        => $data['app_url']        ?? null,
        ];

        // Only include password if explicitly provided (non-empty)
        if (!empty($data['mail_pass'])) {
            $allowed['MAIL_PASS'] = $data['mail_pass'];
        }

        $lines   = file_exists($envFile) ? file($envFile, FILE_IGNORE_NEW_LINES) : [];
        $updated = [];

        foreach ($lines as $line) {
            if (str_starts_with(trim($line), '#') || !str_contains($line, '=')) {
                $updated[] = $line;
                continue;
            }
            [$key] = explode('=', $line, 2);
            $key = trim($key);
            if (array_key_exists($key, $allowed) && $allowed[$key] !== null) {
                $updated[] = "{$key}={$allowed[$key]}";
                unset($allowed[$key]);
            } else {
                $updated[] = $line;
            }
        }

        // Append any new keys not yet in .env
        foreach ($allowed as $key => $val) {
            if ($val !== null) $updated[] = "{$key}={$val}";
        }

        file_put_contents($envFile, implode("\n", $updated) . "\n");

        // Also update runtime environment
        foreach ($allowed as $key => $val) {
            if ($val !== null) {
                $_ENV[$key] = $val;
                putenv("{$key}={$val}");
            }
        }
        if (!empty($data['mail_pass'])) {
            $_ENV['MAIL_PASS'] = $data['mail_pass'];
            putenv("MAIL_PASS={$data['mail_pass']}");
        }

        $this->success(['mail_configured' => \Core\Mailer::isConfigured()], 'Mail settings saved');
    }

    /** POST /api/admin/mail-settings/test — send a test email to the logged-in admin */
    public function mailTest(array $params = []): never
    {
        if (!\Core\Mailer::isConfigured()) {
            $this->error('Mail is not configured yet');
        }
        $auth = $this->authUser();
        try {
            \App\Services\InviteMailer::send(
                $auth['email'],
                $auth['name'],
                'test-password-123',
            );
            $this->success(null, 'Test email sent to ' . $auth['email']);
        } catch (\Throwable $e) {
            $this->error('Send failed: ' . $e->getMessage());
        }
    }
}
