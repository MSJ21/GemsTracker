<?php
namespace App\Controllers;

use App\Models\ProjectMember;
use App\Models\User;
use Core\Controller;

class ProjectMemberController extends Controller
{
    private ProjectMember $model;

    public function __construct()
    {
        $this->model = new ProjectMember();
    }

    /** GET /api/admin/projects/{project_id}/members */
    public function index(array $params = []): never
    {
        $members = $this->model->forProject((int)$params['project_id']);
        $this->success($members);
    }

    /** POST /api/admin/projects/{project_id}/members  { user_id, role } */
    public function store(array $params = []): never
    {
        $data   = $this->input();
        $userId = (int)($data['user_id'] ?? 0);
        $role   = in_array($data['role'] ?? '', ['manager', 'member'], true) ? $data['role'] : 'member';

        if (!$userId) { $this->error('user_id required'); }

        $this->model->upsert((int)$params['project_id'], $userId, $role);
        $this->success(null, 'Member saved');
    }

    /** DELETE /api/admin/projects/{project_id}/members/{user_id} */
    public function destroy(array $params = []): never
    {
        $this->model->remove((int)$params['project_id'], (int)$params['user_id']);
        $this->success(null, 'Member removed');
    }

    /** GET /api/projects/{project_id}/members  (user-facing, to populate assignee dropdown) */
    public function userIndex(array $params = []): never
    {
        $members = $this->model->forProject((int)$params['project_id']);
        $this->success($members);
    }
}
