<?php
namespace App\Controllers;

use App\Models\{User, Assignment};
use App\Services\InviteMailer;
use Core\Controller;

class UserManagementController extends Controller
{
    private User $model;
    private Assignment $assignments;

    public function __construct()
    {
        $this->model       = new User();
        $this->assignments = new Assignment();
    }

    public function index(array $params = []): never
    {
        $this->success([
            'users'   => $this->model->getAllWithStats(),
            'deleted' => $this->model->findDeleted(),
        ]);
    }

    public function store(array $params = []): never
    {
        $data = $this->input();

        if (empty($data['name']) || empty($data['email']) || empty($data['password'])) {
            $this->error('Name, email and password required');
        }

        if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            $this->error('Invalid email');
        }

        if ($this->model->findByEmail($data['email'])) {
            $this->error('Email already in use');
        }

        $plainPassword = $data['password'];
        $avatar        = $this->uploadFile('avatar');
        $id            = $this->model->create([
            'name'     => trim($data['name']),
            'email'    => strtolower(trim($data['email'])),
            'password' => password_hash($plainPassword, PASSWORD_BCRYPT, ['cost' => 12]),
            'role'     => $data['role'] ?? 'user',
            'status'   => 'active',
            'avatar'   => $avatar,
        ]);

        // Send invite email (non-blocking — failure doesn't abort the request)
        $mailSent = false;
        try {
            $mailSent = InviteMailer::send(
                strtolower(trim($data['email'])),
                trim($data['name']),
                $plainPassword,
            );
        } catch (\Throwable $e) {
            // Log but don't fail the request
            error_log('[InviteMailer] ' . $e->getMessage());
        }

        $this->success(['id' => $id, 'invite_sent' => $mailSent], 'User created');
    }

    public function update(array $params): never
    {
        $id   = (int)$params['id'];
        $user = $this->model->findById($id);

        if (!$user) {
            $this->error('Not found', 404);
        }

        $data   = $this->input();
        $update = [];

        if (!empty($data['name'])) {
            $update['name'] = trim($data['name']);
        }

        if (!empty($data['email'])) {
            if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
                $this->error('Invalid email');
            }
            $existing = $this->model->findByEmail($data['email']);
            if ($existing && (int)$existing['id'] !== $id) {
                $this->error('Email already in use');
            }
            $update['email'] = strtolower(trim($data['email']));
        }

        if (!empty($data['password'])) {
            $update['password'] = password_hash($data['password'], PASSWORD_BCRYPT, ['cost' => 12]);
        }

        if (!empty($data['role'])) {
            $update['role'] = $data['role'];
        }

        if (!empty($data['status'])) {
            $update['status'] = $data['status'];
        }

        $avatar = $this->uploadFile('avatar');
        if ($avatar) {
            $update['avatar'] = $avatar;
        }

        if (!empty($update)) {
            $this->model->update($id, $update);
        }

        $this->success(null, 'User updated');
    }

    public function destroy(array $params): never
    {
        $id   = (int)$params['id'];
        $auth = $this->authUser();

        if ($id === (int)$auth['id']) {
            $this->error('Cannot delete your own account');
        }

        if (!$this->model->findById($id)) {
            $this->error('Not found', 404);
        }

        $this->model->softDelete($id);
        $this->success(null, 'User deleted');
    }

    public function restore(array $params): never
    {
        $this->model->restore((int)$params['id']);
        $this->success(null, 'User restored');
    }

    public function getAssignments(array $params): never
    {
        $this->success($this->assignments->getProjectIds((int)$params['id']));
    }

    public function assign(array $params): never
    {
        $data = $this->input();
        $this->assignments->syncUserProjects((int)$params['id'], $data['project_ids'] ?? []);
        $this->success(null, 'Assignments updated');
    }
}
