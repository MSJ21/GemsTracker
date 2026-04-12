<?php
namespace App\Controllers;

use App\Models\Entity;
use Core\Controller;

class EntityController extends Controller
{
    private Entity $model;

    public function __construct()
    {
        $this->model = new Entity();
    }

    public function index(array $params = []): never
    {
        $this->success([
            'entities' => $this->model->getWithProjectCount(),
            'deleted'  => $this->model->findDeleted(),
        ]);
    }

    public function store(array $params = []): never
    {
        $data = $this->input();
        $name = trim($data['name'] ?? '');

        if (!$name) {
            $this->error('Name is required');
        }

        $logo = $this->uploadFile('logo');
        $id   = $this->model->create([
            'name'        => $name,
            'description' => trim($data['description'] ?? ''),
            'status'      => $data['status'] ?? 'active',
            'logo'        => $logo,
        ]);

        $this->success(['id' => $id], 'Entity created');
    }

    public function update(array $params): never
    {
        $id = (int)$params['id'];

        if (!$this->model->findById($id)) {
            $this->error('Not found', 404);
        }

        $data   = $this->input();
        $update = [];

        $name = trim($data['name'] ?? '');
        if ($name !== '') {
            $update['name'] = $name;
        }

        if (isset($data['description'])) {
            $update['description'] = $data['description'];
        }

        if (!empty($data['status'])) {
            $update['status'] = $data['status'];
        }

        $logo = $this->uploadFile('logo');
        if ($logo) {
            $update['logo'] = $logo;
        }

        if (!empty($update)) {
            $this->model->update($id, $update);
        }

        $this->success(null, 'Entity updated');
    }

    public function destroy(array $params): never
    {
        $id = (int)$params['id'];

        if (!$this->model->findById($id)) {
            $this->error('Not found', 404);
        }

        $this->model->softDelete($id);
        $this->success(null, 'Entity deleted');
    }

    public function restore(array $params): never
    {
        $this->model->restore((int)$params['id']);
        $this->success(null, 'Entity restored');
    }
}
