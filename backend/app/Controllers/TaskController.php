<?php
namespace App\Controllers;

use App\Models\Task;
use App\Models\Notification;
use App\Models\AuditLog;
use Core\Controller;

class TaskController extends Controller
{
    private Task $model;
    private AuditLog $audit;

    public function __construct()
    {
        $this->model = new Task();
        $this->audit = new AuditLog();
    }

    public function index(array $params = []): never
    {
        $auth    = $this->authUser();
        $filters = array_diff_key($_GET, ['_auth_user' => true]);

        if ($auth['role'] === 'admin') {
            $this->success($this->model->getAdminFiltered($filters));
        }
        $this->success($this->model->getByUserId((int)$auth['id'], $filters));
    }

    public function store(array $params = []): never
    {
        $data = $this->input();
        $auth = $this->authUser();

        if (empty($data['title']) || empty($data['project_id'])) {
            $this->error('Title and project are required');
        }

        $hours = (float)($data['hours_spent'] ?? 0);
        if ($hours < 0 || $hours > 24) $this->error('Hours must be 0–24');

        $id = $this->model->create([
            'user_id'     => (int)($data['user_id'] ?? $auth['id']),
            'project_id'  => (int)$data['project_id'],
            'title'       => trim($data['title']),
            'description' => trim($data['description'] ?? ''),
            'hours_spent' => $hours,
            'status'      => $data['status'] ?? 'pending',
            'priority'    => $data['priority'] ?? 'medium',
            'task_date'   => $data['task_date'] ?? date('Y-m-d'),
            'due_date'    => !empty($data['due_date']) ? $data['due_date'] : null,
            'recur_type'  => !empty($data['recur_type']) ? $data['recur_type'] : null,
            'recur_end'   => !empty($data['recur_end']) ? $data['recur_end'] : null,
            'issue_type'  => in_array($data['issue_type'] ?? '', ['story','bug','task','epic']) ? $data['issue_type'] : 'task',
            'sprint_id'   => !empty($data['sprint_id']) ? (int)$data['sprint_id'] : null,
            'story_points'=> isset($data['story_points']) && $data['story_points'] !== '' ? (int)$data['story_points'] : null,
            'assignee_id' => !empty($data['assignee_id']) ? (int)$data['assignee_id'] : null,
        ]);

        // Notify assignee if different from creator
        $assigneeId = !empty($data['assignee_id']) ? (int)$data['assignee_id'] : null;
        if ($assigneeId && $assigneeId !== (int)$auth['id']) {
            Notification::push(
                $assigneeId,
                'task_assigned',
                'Task assigned to you',
                trim($data['title']),
                '/tasks'
            );
        }

        $this->audit->log((int)$auth['id'], 'create', 'task', $id, ['title' => trim($data['title'])]);
        $this->success(['id' => $id], 'Task created');
    }

    public function update(array $params): never
    {
        $id   = (int)$params['id'];
        $auth = $this->authUser();
        $task = $this->model->findById($id);

        if (!$task) $this->error('Not found', 404);
        if ($auth['role'] !== 'admin' && (int)$task['user_id'] !== (int)$auth['id']) {
            $this->error('Forbidden', 403);
        }

        $data   = $this->input();
        $update = [];

        if (!empty($data['title']))      $update['title']       = trim($data['title']);
        if (isset($data['description'])) $update['description'] = trim($data['description']);
        if (isset($data['hours_spent'])) {
            $hours = (float)$data['hours_spent'];
            if ($hours < 0 || $hours > 24) $this->error('Hours must be 0–24');
            $update['hours_spent'] = $hours;
        }
        if (!empty($data['status']))     $update['status']      = $data['status'];
        if (!empty($data['priority']))   $update['priority']    = $data['priority'];
        if (!empty($data['task_date']))  $update['task_date']   = $data['task_date'];
        if (!empty($data['project_id'])) $update['project_id']  = (int)$data['project_id'];
        if (array_key_exists('due_date', $data))    { $update['due_date']    = $data['due_date'] ?: null; }
        if (array_key_exists('recur_type', $data)) { $update['recur_type'] = $data['recur_type'] ?: null; }
        if (array_key_exists('recur_end', $data))  { $update['recur_end']  = $data['recur_end'] ?: null; }
        if (array_key_exists('sprint_id', $data))  { $update['sprint_id']  = $data['sprint_id'] ? (int)$data['sprint_id'] : null; }
        if (array_key_exists('story_points', $data)) { $update['story_points'] = $data['story_points'] !== '' ? (int)$data['story_points'] : null; }
        if (array_key_exists('assignee_id', $data))  { $update['assignee_id']  = $data['assignee_id'] ? (int)$data['assignee_id'] : null; }
        if (!empty($data['issue_type']) && in_array($data['issue_type'], ['story','bug','task','epic'])) {
            $update['issue_type'] = $data['issue_type'];
        }

        $this->model->update($id, $update);
        $this->audit->log((int)$auth['id'], 'update', 'task', $id, $update);
        $this->success(null, 'Task updated');
    }

    public function destroy(array $params): never
    {
        $id   = (int)$params['id'];
        $auth = $this->authUser();
        $task = $this->model->findById($id);

        if (!$task) $this->error('Not found', 404);
        if ($auth['role'] !== 'admin' && (int)$task['user_id'] !== (int)$auth['id']) {
            $this->error('Forbidden', 403);
        }

        $this->model->softDelete($id);
        $this->audit->log((int)$auth['id'], 'delete', 'task', $id, ['title' => $task['title']]);
        $this->success(null, 'Task deleted');
    }

    public function restore(array $params): never
    {
        $this->model->restore((int)$params['id']);
        $this->success(null, 'Task restored');
    }

    public function bulkStore(array $params = []): never
    {
        $data  = $this->input();
        $auth  = $this->authUser();
        $tasks = $data['tasks'] ?? [];

        if (!is_array($tasks) || empty($tasks)) $this->error('No tasks provided');

        $created = 0;
        foreach ($tasks as $row) {
            if (empty($row['title']) || empty($row['project_id'])) continue;
            $this->model->create([
                'user_id'     => (int)($row['user_id'] ?? $auth['id']),
                'project_id'  => (int)$row['project_id'],
                'title'       => trim($row['title']),
                'description' => trim($row['description'] ?? ''),
                'hours_spent' => (float)($row['hours_spent'] ?? 0),
                'status'      => $row['status'] ?? 'pending',
                'priority'    => $row['priority'] ?? 'medium',
                'task_date'   => $row['task_date'] ?? date('Y-m-d'),
                'due_date'    => !empty($row['due_date']) ? $row['due_date'] : null,
            ]);
            $created++;
        }

        $this->success(['created' => $created], "{$created} tasks imported");
    }

    public function spawnRecurring(array $params = []): never
    {
        $due     = $this->model->getRecurringDue();
        $spawned = 0;
        foreach ($due as $task) {
            $this->model->create([
                'user_id'     => $task['user_id'],
                'project_id'  => $task['project_id'],
                'title'       => $task['title'],
                'description' => $task['description'],
                'hours_spent' => 0,
                'status'      => 'pending',
                'priority'    => $task['priority'],
                'task_date'   => date('Y-m-d'),
                'due_date'    => $task['due_date'],
                'recur_type'  => null,
                'parent_id'   => $task['id'],
            ]);
            $spawned++;
        }
        $this->success(['spawned' => $spawned], "{$spawned} recurring tasks created");
    }
}
