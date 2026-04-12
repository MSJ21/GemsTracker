<?php
namespace App\Controllers;

use App\Models\TimeEntry;
use Core\Controller;

class TimeEntryController extends Controller
{
    private TimeEntry $model;

    public function __construct()
    {
        $this->model = new TimeEntry();
    }

    public function active(array $params = []): never
    {
        $auth   = $this->authUser();
        $entry  = $this->model->getActive((int)$auth['id']);
        $this->success($entry ?: null);
    }

    public function start(array $params): never
    {
        $auth = $this->authUser();
        $id   = $this->model->start((int)$params['task_id'], (int)$auth['id']);
        $this->success(['id' => $id, 'started_at' => date('Y-m-d H:i:sP')], 'Timer started');
    }

    public function stop(array $params = []): never
    {
        $auth  = $this->authUser();
        $entry = $this->model->stop((int)$auth['id']);
        if (!$entry) $this->error('No active timer');
        $this->success($entry, 'Timer stopped');
    }

    public function entries(array $params): never
    {
        $this->success($this->model->getByTask((int)$params['task_id']));
    }
}
