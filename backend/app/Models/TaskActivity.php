<?php
namespace App\Models;

use Core\Model;

class TaskActivity extends Model
{
    protected string $table = 'task_activities';

    public function forTask(int $taskId): array
    {
        return $this->db->query(
            "SELECT ta.*, u.name AS user_name, u.avatar AS user_avatar
             FROM task_activities ta
             LEFT JOIN users u ON u.id = ta.user_id
             WHERE ta.task_id = ?
             ORDER BY ta.created_at ASC",
            [$taskId]
        );
    }

    public static function record(int $taskId, ?int $userId, string $action, ?string $oldVal = null, ?string $newVal = null): void
    {
        $db = \Core\DB::getInstance();
        $db->execute(
            "INSERT INTO task_activities (task_id, user_id, action, old_value, new_value) VALUES (?, ?, ?, ?, ?)",
            [$taskId, $userId, $action, $oldVal, $newVal]
        );
    }
}
