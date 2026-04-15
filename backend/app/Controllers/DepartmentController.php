<?php
namespace App\Controllers;

use App\Models\Department;
use Core\Controller;

class DepartmentController extends Controller
{
    private Department $model;

    public function __construct()
    {
        $this->model = new Department();
    }

    public function index(array $params = []): never
    {
        $this->success($this->model->withMemberCount());
    }

    public function store(array $params = []): never
    {
        $data = $this->input();
        $name = trim($data['name'] ?? '');
        if ($name === '') $this->error('Department name is required');

        $id = $this->model->create([
            'name'      => $name,
            'head_id'   => !empty($data['head_id']) ? (int)$data['head_id'] : null,
            'parent_id' => !empty($data['parent_id']) ? (int)$data['parent_id'] : null,
        ]);

        $this->success(['id' => $id], 'Department created');
    }

    public function update(array $params = []): never
    {
        $id   = (int)($params['id'] ?? 0);
        $data = $this->input();
        $name = trim($data['name'] ?? '');
        if ($name === '') $this->error('Department name is required');

        $this->model->update($id, [
            'name'      => $name,
            'head_id'   => !empty($data['head_id']) ? (int)$data['head_id'] : null,
            'parent_id' => !empty($data['parent_id']) ? (int)$data['parent_id'] : null,
        ]);

        $this->success(null, 'Department updated');
    }

    public function destroy(array $params = []): never
    {
        $id = (int)($params['id'] ?? 0);
        $this->model->softDelete($id);
        $this->success(null, 'Department deleted');
    }
}
