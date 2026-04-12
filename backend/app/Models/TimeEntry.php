<?php
namespace App\Models;

use Core\DB;

class TimeEntry
{
    private DB $db;

    public function __construct()
    {
        $this->db = DB::getInstance();
    }

    public function getActive(int $userId): array|false
    {
        return $this->db->fetchOne(
            "SELECT * FROM time_entries WHERE user_id = ? AND stopped_at IS NULL ORDER BY started_at DESC LIMIT 1",
            [$userId]
        );
    }

    public function start(int $taskId, int $userId): int
    {
        // Stop any running timer for this user first
        $this->stopAll($userId);
        return (int)$this->db->insert('time_entries', [
            'task_id'    => $taskId,
            'user_id'    => $userId,
            'started_at' => date('Y-m-d H:i:sP'),
        ]);
    }

    public function stop(int $userId): array|false
    {
        $entry = $this->getActive($userId);
        if (!$entry) return false;

        $seconds = max(0, (int)(time() - strtotime($entry['started_at'])));
        $this->db->query(
            "UPDATE time_entries SET stopped_at = NOW(), seconds = ? WHERE id = ?",
            [$seconds, $entry['id']]
        );
        return array_merge($entry, ['seconds' => $seconds]);
    }

    public function stopAll(int $userId): void
    {
        $this->db->query(
            "UPDATE time_entries
             SET stopped_at = NOW(), seconds = EXTRACT(EPOCH FROM (NOW() - started_at))::int
             WHERE user_id = ? AND stopped_at IS NULL",
            [$userId]
        );
    }

    public function getTotalSeconds(int $taskId): int
    {
        $row = $this->db->fetchOne(
            "SELECT COALESCE(SUM(seconds), 0) AS total FROM time_entries WHERE task_id = ? AND stopped_at IS NOT NULL",
            [$taskId]
        );
        return (int)($row['total'] ?? 0);
    }

    public function getByTask(int $taskId): array
    {
        return $this->db->query(
            "SELECT te.*, u.name AS user_name FROM time_entries te JOIN users u ON u.id = te.user_id WHERE te.task_id = ? ORDER BY te.started_at DESC",
            [$taskId]
        );
    }
}
