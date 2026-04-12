<?php
namespace App\Controllers;

use App\Models\Project;
use Core\Controller;

class ProjectController extends Controller
{
    private Project $model;

    public function __construct()
    {
        $this->model = new Project();
    }

    public function index(array $params = []): never
    {
        $this->success([
            'projects' => $this->model->getAllWithEntity(),
            'deleted'  => $this->model->findDeleted(),
        ]);
    }

    public function userProjects(array $params = []): never
    {
        $uid = (int)$this->authUser()['id'];
        $this->success($this->model->getByUserId($uid));
    }

    public function store(array $params = []): never
    {
        $data = $this->input();
        if (empty($data['name']) || empty($data['entity_id'])) $this->error('Name and entity are required');

        $id = $this->model->create([
            'entity_id'   => (int)$data['entity_id'],
            'name'        => trim($data['name']),
            'description' => trim($data['description'] ?? ''),
            'start_date'  => ($data['start_date'] ?? '') ?: null,
            'end_date'    => ($data['end_date'] ?? '') ?: null,
            'status'      => $data['status'] ?? 'active',
        ]);

        $this->success(['id' => $id], 'Project created');
    }

    public function update(array $params): never
    {
        $id = (int)$params['id'];
        if (!$this->model->findById($id)) $this->error('Not found', 404);

        $data   = $this->input();
        $update = [];

        if (!empty($data['entity_id']))   $update['entity_id']   = (int)$data['entity_id'];
        if (!empty($data['name']))        $update['name']        = trim($data['name']);
        if (isset($data['description']))  $update['description'] = trim($data['description']);
        if (!empty($data['start_date']))  $update['start_date']  = $data['start_date'];
        if (array_key_exists('end_date', $data)) $update['end_date'] = $data['end_date'] ?: null;
        if (!empty($data['status']))      $update['status']      = $data['status'];

        $this->model->update($id, $update);
        $this->success(null, 'Project updated');
    }

    public function destroy(array $params): never
    {
        $id = (int)$params['id'];
        if (!$this->model->findById($id)) $this->error('Not found', 404);
        $this->model->softDelete($id);
        $this->success(null, 'Project deleted');
    }

    public function restore(array $params): never
    {
        $this->model->restore((int)$params['id']);
        $this->success(null, 'Project restored');
    }
}
