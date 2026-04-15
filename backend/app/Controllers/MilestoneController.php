<?php
namespace App\Controllers;

use App\Models\Milestone;
use Core\Controller;

class MilestoneController extends Controller
{
    private Milestone $model;

    public function __construct()
    {
        $this->model = new Milestone();
    }

    public function index(array $params = []): never
    {
        $projectId = (int)($params['project_id'] ?? 0);
        $this->success($this->model->forProject($projectId));
    }

    public function store(array $params = []): never
    {
        $projectId = (int)($params['project_id'] ?? 0);
        $data      = $this->input();
        $name      = trim($data['name'] ?? '');
        if ($name === '') $this->error('Milestone name is required');

        $id = $this->model->create([
            'project_id'  => $projectId,
            'name'        => $name,
            'due_date'    => ($data['due_date'] ?? '') ?: null,
            'description' => $data['description'] ?? '',
            'status'      => $data['status'] ?? 'open',
        ]);
        $this->success(['id' => $id], 'Milestone created');
    }

    public function update(array $params = []): never
    {
        $id   = (int)($params['id'] ?? 0);
        $data = $this->input();
        $name = trim($data['name'] ?? '');
        if ($name === '') $this->error('Milestone name is required');

        $this->model->update($id, [
            'name'        => $name,
            'due_date'    => ($data['due_date'] ?? '') ?: null,
            'description' => $data['description'] ?? '',
            'status'      => $data['status'] ?? 'open',
        ]);
        $this->success(null, 'Milestone updated');
    }

    public function destroy(array $params = []): never
    {
        $id = (int)($params['id'] ?? 0);
        $this->model->softDelete($id);
        $this->success(null, 'Milestone deleted');
    }
}
