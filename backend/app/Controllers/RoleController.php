<?php
namespace App\Controllers;

use App\Models\Role;
use App\Models\Permission;
use Core\Controller;

class RoleController extends Controller
{
    private Role $model;

    public function __construct()
    {
        $this->model = new Role();
        $this->permModel = new Permission();
    }

    public function index(array $params = []): never
    {
        $this->success($this->model->all());
    }

    public function permissions(array $params = []): never
    {
        $this->success($this->permModel->grouped());
    }

    public function show(array $params = []): never
    {
        $id   = (int)($params['id'] ?? 0);
        $role = $this->model->withPermissions($id);
        if (!$role) $this->error('Role not found', 404);
        $this->success($role);
    }

    public function store(array $params = []): never
    {
        $data = $this->input();
        $name = trim($data['name'] ?? '');
        if ($name === '') $this->error('Role name is required');

        $id = $this->model->create([
            'name'        => $name,
            'description' => $data['description'] ?? '',
        ]);

        if (!empty($data['permission_ids']) && is_array($data['permission_ids'])) {
            $this->model->syncPermissions((int)$id, $data['permission_ids']);
        }

        $this->success($this->model->withPermissions((int)$id), 'Role created');
    }

    public function update(array $params = []): never
    {
        $id   = (int)($params['id'] ?? 0);
        $data = $this->input();
        $name = trim($data['name'] ?? '');
        if ($name === '') $this->error('Role name is required');

        $this->model->update($id, [
            'name'        => $name,
            'description' => $data['description'] ?? '',
        ]);

        if (isset($data['permission_ids']) && is_array($data['permission_ids'])) {
            $this->model->syncPermissions($id, $data['permission_ids']);
        }

        $this->success($this->model->withPermissions($id), 'Role updated');
    }

    public function destroy(array $params = []): never
    {
        $id = (int)($params['id'] ?? 0);
        $this->model->update($id, ['is_deleted' => 1]);
        $this->success(null, 'Role deleted');
    }

    public function assignRole(array $params = []): never
    {
        $userId = (int)($params['user_id'] ?? 0);
        $data   = $this->input();
        $roleId = (int)($data['role_id'] ?? 0);
        if (!$roleId) $this->error('role_id required');
        $this->model->assignToUser($userId, $roleId);
        $this->success(null, 'Role assigned');
    }

    public function removeRole(array $params = []): never
    {
        $userId = (int)($params['user_id'] ?? 0);
        $roleId = (int)($params['role_id'] ?? 0);
        $this->model->removeFromUser($userId, $roleId);
        $this->success(null, 'Role removed');
    }

    public function userRoles(array $params = []): never
    {
        $userId = (int)($params['user_id'] ?? 0);
        $this->success($this->model->getUserRoles($userId));
    }
}
