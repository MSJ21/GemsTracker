<?php
namespace App\Middleware;

use Core\JWT;

class AuthMiddleware
{
    public static function handle(): array
    {
        $headers = getallheaders();
        $auth    = $headers['Authorization'] ?? $headers['authorization'] ?? '';

        if (!str_starts_with($auth, 'Bearer ')) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Unauthorized']);
            exit;
        }

        try {
            $payload = JWT::decode(substr($auth, 7));
            $_REQUEST['_auth_user'] = $payload;
            return $payload;
        } catch (\InvalidArgumentException $e) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
            exit;
        }
    }
}
