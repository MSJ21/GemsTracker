<?php
namespace App\Models;

use Core\DB;

class PinnedProject
{
    private DB $db;

    public function __construct()
    {
        $this->db = DB::getInstance();
    }

    public function getByUser(int $userId): array
    {
        return $this->db->query("
            SELECT p.*, e.name AS entity_name
            FROM pinned_projects pp
            JOIN projects p ON p.id = pp.project_id
            LEFT JOIN entities e ON e.id = p.entity_id
            WHERE pp.user_id = ?
            ORDER BY p.name
        ", [$userId]);
    }

    public function isPinned(int $userId, int $projectId): bool
    {
        $row = $this->db->fetchOne(
            "SELECT 1 FROM pinned_projects WHERE user_id = ? AND project_id = ?",
            [$userId, $projectId]
        );
        return (bool)$row;
    }

    public function pin(int $userId, int $projectId): void
    {
        $this->db->query(
            "INSERT INTO pinned_projects (user_id, project_id) VALUES (?, ?) ON CONFLICT DO NOTHING",
            [$userId, $projectId]
        );
    }

    public function unpin(int $userId, int $projectId): void
    {
        $this->db->query(
            "DELETE FROM pinned_projects WHERE user_id = ? AND project_id = ?",
            [$userId, $projectId]
        );
    }
}
