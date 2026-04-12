<?php
namespace App\Controllers;

use App\Models\{Subtask, Task};
use Core\Controller;

class SubtaskController extends Controller
{
    private Subtask $model;
    private Task    $tasks;

    public function __construct()
    {
        $this->model = new Subtask();
        $this->tasks = new Task();
    }

    public function index(array $params): never
    {
        $this->success($this->model->getByTask((int)$params['task_id']));
    }

    public function store(array $params): never
    {
        $data  = $this->input();
        $title = trim($data['title'] ?? '');
        if (!$title) $this->error('Title is required');

        $id = $this->model->create((int)$params['task_id'], $title);
        $this->success(['id' => $id], 'Subtask created');
    }

    public function update(array $params): never
    {
        $data   = $this->input();
        $update = [];
        if (isset($data['title']))   $update['title']   = trim($data['title']);
        if (isset($data['is_done'])) $update['is_done']  = $data['is_done'] ? 1 : 0;
        if (isset($data['position'])) $update['position'] = (int)$data['position'];

        $this->model->update((int)$params['id'], $update);
        $this->success(null, 'Subtask updated');
    }

    public function destroy(array $params): never
    {
        $this->model->delete((int)$params['id']);
        $this->success(null, 'Subtask deleted');
    }

    public function reorder(array $params): never
    {
        $data = $this->input();
        $this->model->reorder((int)$params['task_id'], $data['ids'] ?? []);
        $this->success(null, 'Reordered');
    }
}
