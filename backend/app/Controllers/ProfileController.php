<?php
namespace App\Controllers;

use App\Models\User;
use Core\Controller;
use Core\JWT;

class ProfileController extends Controller
{
    private User $model;

    public function __construct()
    {
        $this->model = new User();
    }

    public function update(array $params = []): never
    {
        $auth = $this->authUser();
        $id   = (int)$auth['id'];
        $user = $this->model->findById($id);
        if (!$user) $this->error('User not found', 404);

        $data   = $this->input();
        $update = [];

        if (!empty($data['name'])) $update['name'] = trim($data['name']);

        if (!empty($data['email'])) {
            if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) $this->error('Invalid email');
            $existing = $this->model->findByEmail($data['email']);
            if ($existing && (int)$existing['id'] !== $id) $this->error('Email already in use');
            $update['email'] = strtolower(trim($data['email']));
        }

        if (!empty($data['new_password'])) {
            if (empty($data['current_password']))                              $this->error('Current password required');
            if (!password_verify($data['current_password'], $user['password'])) $this->error('Current password incorrect');
            $update['password'] = password_hash($data['new_password'], PASSWORD_BCRYPT, ['cost' => 12]);
        }

        $avatar = $this->uploadFile('avatar');
        if ($avatar) $update['avatar'] = $avatar;

        if ($update) $this->model->update($id, $update);

        $fresh   = $this->model->findById($id);
        $payload = ['id' => $fresh['id'], 'name' => $fresh['name'], 'email' => $fresh['email'], 'role' => $fresh['role'], 'avatar' => $fresh['avatar']];

        $this->success([
            'token' => JWT::encode($payload),
            'user'  => $payload,
        ], 'Profile updated');
    }
}
