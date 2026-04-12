<?php
namespace App\Controllers;

use App\Models\User;
use Core\Controller;
use Core\JWT;

class AuthController extends Controller
{
    private User $users;

    public function __construct()
    {
        $this->users = new User();
    }

    public function login(array $params = []): never
    {
        $data     = $this->input();
        $email    = trim($data['email'] ?? '');
        $password = $data['password'] ?? '';

        if (!$email || !$password)                    $this->error('Email and password are required');
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) $this->error('Invalid email format');

        $user = $this->users->findByEmail($email);

        if (!$user || !password_verify($password, $user['password'])) $this->error('Invalid credentials', 401);
        if ($user['status'] !== 'active')                              $this->error('Account is inactive', 403);

        $payload = ['id' => $user['id'], 'name' => $user['name'], 'email' => $user['email'], 'role' => $user['role'], 'avatar' => $user['avatar']];

        $this->success([
            'token' => JWT::encode($payload),
            'user'  => $payload,
        ], 'Login successful');
    }

    public function me(array $params = []): never
    {
        $auth = $this->authUser();
        $user = $this->users->findById((int)$auth['id']);
        if (!$user) $this->error('User not found', 404);

        $this->success(['id' => $user['id'], 'name' => $user['name'], 'email' => $user['email'], 'role' => $user['role'], 'avatar' => $user['avatar']]);
    }
}
