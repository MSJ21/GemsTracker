<?php
namespace App\Models;

use Core\DB;

class TaskComment
{
    private DB $db;

    public function __construct()
    {
        $this->db = DB::getInstance();
    }

    public function getByTask(int $taskId): array
    {
        return $this->db->query("
            SELECT c.*, u.name AS user_name, u.avatar AS user_avatar
            FROM task_comments c
            JOIN users u ON u.id = c.user_id
            WHERE c.task_id = ?
            ORDER BY c.created_at ASC
        ", [$taskId]);
    }

    public function create(int $taskId, int $userId, string $body): int
    {
        return (int)$this->db->insert('task_comments', [
            'task_id' => $taskId,
            'user_id' => $userId,
            'body'    => $body,
        ]);
    }

    public function update(int $id, string $body): void
    {
        $this->db->query(
            "UPDATE task_comments SET body = ?, updated_at = NOW() WHERE id = ?",
            [$body, $id]
        );
    }

    public function delete(int $id): void
    {
        $this->db->query("DELETE FROM task_comments WHERE id = ?", [$id]);
    }

    public function findById(int $id): array|false
    {
        return $this->db->fetchOne("SELECT * FROM task_comments WHERE id = ?", [$id]);
    }
}
