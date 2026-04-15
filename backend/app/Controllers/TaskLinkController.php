<?php
namespace App\Controllers;

use Core\Controller;
use Core\DB;

class TaskLinkController extends Controller
{
    /** GET /api/tasks/{task_id}/links */
    public function index(array $params = []): never
    {
        $db    = DB::getInstance();
        $links = $db->query(
            "SELECT tl.id, tl.link_type,
                    t.id AS linked_id, t.title AS linked_title,
                    t.status AS linked_status, t.priority AS linked_priority
             FROM task_links tl
             JOIN tasks t ON t.id = tl.linked_task_id
             WHERE tl.task_id = ? AND t.is_deleted = 0
             ORDER BY tl.created_at",
            [(int)$params['task_id']]
        );
        $this->success($links);
    }

    /** POST /api/tasks/{task_id}/links */
    public function store(array $params = []): never
    {
        $db           = DB::getInstance();
        $data         = $this->input();
        $linkedTaskId = (int)($data['linked_task_id'] ?? 0);
        $linkType     = $data['link_type'] ?? 'relates_to';

        if (!$linkedTaskId) { $this->error('linked_task_id required'); }
        if ((int)$params['task_id'] === $linkedTaskId) { $this->error('Cannot link a task to itself'); }

        $db->execute(
            "INSERT INTO task_links (task_id, linked_task_id, link_type) VALUES (?, ?, ?)
             ON CONFLICT (task_id, linked_task_id) DO UPDATE SET link_type = EXCLUDED.link_type",
            [(int)$params['task_id'], $linkedTaskId, $linkType]
        );
        $this->success(null, 'Link created');
    }

    /** DELETE /api/task-links/{id} */
    public function destroy(array $params = []): never
    {
        $db = DB::getInstance();
        $db->execute("DELETE FROM task_links WHERE id = ?", [(int)$params['id']]);
        $this->success(null, 'Link removed');
    }
}
