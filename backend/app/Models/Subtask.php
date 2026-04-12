<?php
namespace App\Models;

use Core\DB;

class Subtask
{
    private DB $db;

    public function __construct()
    {
        $this->db = DB::getInstance();
    }

    public function getByTask(int $taskId): array
    {
        return $this->db->query(
            "SELECT * FROM subtasks WHERE task_id = ? ORDER BY position, id",
            [$taskId]
        );
    }

    public function create(int $taskId, string $title, int $position = 0): int
    {
        return (int)$this->db->insert('subtasks', [
            'task_id'  => $taskId,
            'title'    => $title,
            'position' => $position,
        ]);
    }

    public function update(int $id, array $data): void
    {
        if (empty($data)) return;
        $sets   = implode(', ', array_map(fn($k) => "{$k} = ?", array_keys($data)));
        $params = array_values($data);
        $params[] = $id;
        $this->db->query("UPDATE subtasks SET {$sets} WHERE id = ?", $params);
    }

    public function delete(int $id): void
    {
        $this->db->query("DELETE FROM subtasks WHERE id = ?", [$id]);
    }

    public function reorder(int $taskId, array $ids): void
    {
        foreach ($ids as $pos => $id) {
            $this->db->query(
                "UPDATE subtasks SET position = ? WHERE id = ? AND task_id = ?",
                [$pos, $id, $taskId]
            );
        }
    }
}
