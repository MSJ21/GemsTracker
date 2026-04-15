<?php
namespace App\Controllers;

use App\Models\Label;
use Core\Controller;

class LabelController extends Controller
{
    private Label $model;

    public function __construct()
    {
        $this->model = new Label();
    }

    public function index(array $params = []): never
    {
        $this->success($this->model->all());
    }

    public function store(array $params = []): never
    {
        $data = $this->input();
        $name = trim($data['name'] ?? '');
        if ($name === '') $this->error('Label name is required');
        $auth = $this->authUser();

        $id = $this->model->create([
            'name'       => $name,
            'color'      => $data['color'] ?? '#6366f1',
            'created_by' => $auth['id'],
        ]);
        $this->success(['id' => $id, 'name' => $name, 'color' => $data['color'] ?? '#6366f1'], 'Label created');
    }

    public function update(array $params = []): never
    {
        $id   = (int)($params['id'] ?? 0);
        $data = $this->input();
        $name = trim($data['name'] ?? '');
        if ($name === '') $this->error('Label name is required');

        $this->model->update($id, [
            'name'  => $name,
            'color' => $data['color'] ?? '#6366f1',
        ]);
        $this->success(null, 'Label updated');
    }

    public function destroy(array $params = []): never
    {
        $id = (int)($params['id'] ?? 0);
        $this->model->softDelete($id);
        $this->success(null, 'Label deleted');
    }
}
