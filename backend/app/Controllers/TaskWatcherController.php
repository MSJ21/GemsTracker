<?php
namespace App\Controllers;

use Core\Controller;
use Core\DB;

class TaskWatcherController extends Controller
{
    /** GET /api/tasks/{task_id}/watchers */
    public function index(array $params = []): never
    {
        $db = DB::getInstance();
        $watchers = $db->query(
            "SELECT u.id, u.name, u.avatar
             FROM task_watchers tw
             JOIN users u ON u.id = tw.user_id
             WHERE tw.task_id = ?",
            [(int)$params['task_id']]
        );
        $this->success($watchers);
    }

    /** POST /api/tasks/{task_id}/watch */
    public function watch(array $params = []): never
    {
        $db     = DB::getInstance();
        $auth   = $this->authUser();
        $userId = (int)$auth['id'];
        $taskId = (int)$params['task_id'];

        $exists = $db->fetchOne(
            "SELECT 1 FROM task_watchers WHERE task_id = ? AND user_id = ?",
            [$taskId, $userId]
        );
        if ($exists) {
            $db->execute("DELETE FROM task_watchers WHERE task_id = ? AND user_id = ?", [$taskId, $userId]);
            $this->success(['watching' => false]);
        } else {
            $db->execute(
                "INSERT INTO task_watchers (task_id, user_id) VALUES (?, ?) ON CONFLICT DO NOTHING",
                [$taskId, $userId]
            );
            $this->success(['watching' => true]);
        }
    }

    /** GET /api/tasks/{task_id}/watching */
    public function isWatching(array $params = []): never
    {
        $db     = DB::getInstance();
        $auth   = $this->authUser();
        $exists = $db->fetchOne(
            "SELECT 1 FROM task_watchers WHERE task_id = ? AND user_id = ?",
            [(int)$params['task_id'], (int)$auth['id']]
        );
        $this->success(['watching' => (bool)$exists]);
    }
}
