<?php
namespace App\Controllers;

use App\Models\TaskActivity;
use Core\Controller;

class TaskActivityController extends Controller
{
    private TaskActivity $model;

    public function __construct()
    {
        $this->model = new TaskActivity();
    }

    public function index(array $params = []): never
    {
        $taskId = (int)($params['task_id'] ?? 0);
        $this->success($this->model->forTask($taskId));
    }
}
