<?php
define('APP_ROOT', dirname(__DIR__));

$envFile = APP_ROOT . '/.env';
if (file_exists($envFile)) {
    foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        if (str_starts_with(trim($line), '#') || !str_contains($line, '=')) { continue; }
        [$key, $value] = array_map('trim', explode('=', $line, 2));
        if ($key && !isset($_ENV[$key])) {
            $_ENV[$key] = $value;
            putenv("{$key}={$value}");
        }
    }
}

define('APP_NAME',      'Gems Tracker');
define('APP_VERSION',   '2.0.0');
define('JWT_SECRET',    $_ENV['JWT_SECRET']    ?? 'pracker-super-secret-jwt-key-change-in-production');
define('JWT_EXPIRY',    86400);
define('UPLOAD_PATH',   APP_ROOT . '/public/uploads/');
define('UPLOAD_URL',    '/uploads/');
define('MAX_FILE_SIZE', 2097152);
define('ALLOWED_MIME',  ['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
define('ALLOWED_ORIGINS', array_filter(array_map('trim', explode(',', $_ENV['ALLOWED_ORIGINS'] ?? 'http://192.168.1.53:3000'))));
