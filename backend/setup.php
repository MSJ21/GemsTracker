<?php
define('APP_ROOT', __DIR__);
$cfg = require __DIR__ . '/config/database.php';

try {
    $pdo = new PDO(
        "pgsql:host={$cfg['host']};port={$cfg['port']};dbname={$cfg['dbname']}",
        $cfg['user'],
        $cfg['password'],
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    $sql = file_get_contents(__DIR__ . '/migrations/001_initial_schema.sql');
    $pdo->exec($sql);

    if (!is_dir(__DIR__ . '/public/uploads')) {
        mkdir(__DIR__ . '/public/uploads', 0755, true);
    }

    echo json_encode(['success' => true, 'message' => 'Setup complete. Delete this file.']);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
