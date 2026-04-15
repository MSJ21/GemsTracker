<?php
namespace App\Models;

use Core\Model;

class Label extends Model
{
    protected string $table = 'labels';

    public function all(): array
    {
        return $this->db->query(
            "SELECT * FROM labels WHERE is_deleted = 0 ORDER BY name"
        );
    }

    public function forTask(int $taskId): array
    {
        return $this->db->query(
            "SELECT l.* FROM task_labels tl JOIN labels l ON l.id = tl.label_id
             WHERE tl.task_id = ? AND l.is_deleted = 0",
            [$taskId]
        );
    }

    public function syncForTask(int $taskId, array $labelIds): void
    {
        $this->db->execute("DELETE FROM task_labels WHERE task_id = ?", [$taskId]);
        foreach ($labelIds as $lid) {
            $this->db->execute(
                "INSERT INTO task_labels (task_id, label_id) VALUES (?, ?) ON CONFLICT DO NOTHING",
                [$taskId, (int)$lid]
            );
        }
    }
}
