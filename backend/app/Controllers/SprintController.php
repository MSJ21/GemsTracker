<?php
namespace App\Controllers;

use App\Models\Sprint;
use App\Models\Task;
use App\Models\ProjectMember;
use App\Models\Notification;
use Core\Controller;

class SprintController extends Controller
{
    private Sprint $sprint;
    private ProjectMember $members;

    public function __construct()
    {
        $this->sprint  = new Sprint();
        $this->members = new ProjectMember();
    }

    private function requireManager(int $projectId): void
    {
        $auth = $this->authUser();
        if ($auth['role'] === 'admin') { return; }
        if (!$this->members->isManager($projectId, (int)$auth['id'])) {
            $this->error('Only project managers can perform this action', 403);
        }
    }

    /** GET /api/projects/{project_id}/sprints */
    public function index(array $params = []): never
    {
        $sprints = $this->sprint->forProject((int)$params['project_id']);
        $this->success($sprints);
    }

    /** GET /api/sprints/{id} */
    public function show(array $params = []): never
    {
        $sprint = $this->sprint->withTasks((int)$params['id']);
        if (!$sprint) { $this->error('Not found', 404); }
        $this->success($sprint);
    }

    /** GET /api/projects/{project_id}/backlog */
    public function backlog(array $params = []): never
    {
        $tasks = $this->sprint->backlog((int)$params['project_id']);
        $this->success($tasks);
    }

    /** POST /api/projects/{project_id}/sprints  — manager only */
    public function store(array $params = []): never
    {
        $projectId = (int)$params['project_id'];
        $this->requireManager($projectId);

        $data = $this->input();
        $name = trim($data['name'] ?? '');
        if (!$name) { $this->error('Name required'); }

        $id = $this->sprint->create([
            'project_id' => $projectId,
            'name'       => $name,
            'goal'       => $data['goal'] ?? null,
            'start_date' => ($data['start_date'] ?? '') ?: null,
            'end_date'   => ($data['end_date'] ?? '') ?: null,
            'status'     => 'planning',
        ]);
        // Notify all project members about the new sprint
        $db      = \Core\DB::getInstance();
        $auth    = $this->authUser();
        $members = $db->query(
            "SELECT user_id FROM project_members WHERE project_id = ? AND user_id != ?",
            [$projectId, (int)$auth['id']]
        );
        foreach ($members as $m) {
            Notification::push(
                (int)$m['user_id'],
                'new_sprint',
                'New sprint created',
                $name,
                '/sprints'
            );
        }

        $this->success(['id' => $id], 'Sprint created');
    }

    /** PUT /api/sprints/{id}  — manager only */
    public function update(array $params = []): never
    {
        $sprint = $this->sprint->fetchOne((int)$params['id']);
        if ($sprint) { $this->requireManager((int)$sprint['project_id']); }

        $data   = $this->input();
        $fields = [];
        if (isset($data['name'])) { $fields['name'] = trim($data['name']); }
        if (isset($data['goal'])) { $fields['goal'] = $data['goal']; }
        if (array_key_exists('start_date', $data)) { $fields['start_date'] = ($data['start_date'] ?: null); }
        if (array_key_exists('end_date',   $data)) { $fields['end_date']   = ($data['end_date'] ?: null); }
        if (isset($data['status'])) { $fields['status'] = $data['status']; }

        if ($fields) { $this->sprint->update((int)$params['id'], $fields); }
        $this->success(null, 'Sprint updated');
    }

    /** DELETE /api/sprints/{id}  — manager only */
    public function destroy(array $params = []): never
    {
        $sprint = $this->sprint->fetchOne((int)$params['id']);
        if ($sprint) { $this->requireManager((int)$sprint['project_id']); }
        $this->sprint->delete((int)$params['id']);
        $this->success(null, 'Sprint deleted');
    }

    /** POST /api/sprints/{id}/tasks  — manager assigns task to sprint */
    public function assignTask(array $params = []): never
    {
        $data   = $this->input();
        $taskId = (int)($data['task_id'] ?? 0);
        if (!$taskId) { $this->error('task_id required'); }

        $sprint = $this->sprint->fetchOne((int)$params['id']);
        if ($sprint) { $this->requireManager((int)$sprint['project_id']); }

        $fields = ['sprint_id' => (int)$params['id']];
        if (isset($data['assignee_id'])) {
            $fields['assignee_id'] = $data['assignee_id'] ? (int)$data['assignee_id'] : null;
        }

        $task = new Task();
        $task->update($taskId, $fields);
        $this->success(null, 'Task assigned to sprint');
    }

    /** DELETE /api/sprints/{sprint_id}/tasks/{task_id} */
    public function removeTask(array $params = []): never
    {
        $task = new Task();
        $task->update((int)$params['task_id'], ['sprint_id' => null]);
        $this->success(null, 'Task removed from sprint');
    }

    /** PATCH /api/tasks/{task_id}/assignee  — manager assigns task to member */
    public function assignTaskMember(array $params = []): never
    {
        $data       = $this->input();
        $taskId     = (int)$params['task_id'];
        $assigneeId = isset($data['assignee_id']) && $data['assignee_id'] !== ''
            ? (int)$data['assignee_id'] : null;

        $task = new Task();
        $task->update($taskId, ['assignee_id' => $assigneeId]);
        $this->success(null, 'Assignee updated');
    }
}
