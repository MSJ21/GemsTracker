<?php
namespace App\Middleware;

class AdminMiddleware
{
    public static function handle(): void
    {
        $user = AuthMiddleware::handle();
        if (($user['role'] ?? '') !== 'admin') {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Forbidden']);
            exit;
        }
    }
}
