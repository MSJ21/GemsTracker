<?php
namespace App\Models;

use Core\Model;

class ProjectMember extends Model
{
    protected string $table = 'project_members';

    public function forProject(int $projectId): array
    {
        return $this->db->query(
            "SELECT pm.*, u.name, u.email, u.avatar, u.status AS user_status
             FROM project_members pm
             JOIN users u ON u.id = pm.user_id
             WHERE pm.project_id = ?
             ORDER BY pm.role DESC, u.name",
            [$projectId]
        );
    }

    public function isManager(int $projectId, int $userId): bool
    {
        $row = $this->db->fetchOne(
            "SELECT 1 FROM project_members WHERE project_id = ? AND user_id = ? AND role = 'manager'",
            [$projectId, $userId]
        );
        return (bool)$row;
    }

    public function isMember(int $projectId, int $userId): bool
    {
        $row = $this->db->fetchOne(
            "SELECT 1 FROM project_members WHERE project_id = ? AND user_id = ?",
            [$projectId, $userId]
        );
        return (bool)$row;
    }

    public function upsert(int $projectId, int $userId, string $role): void
    {
        $this->db->execute(
            "INSERT INTO project_members (project_id, user_id, role)
             VALUES (?, ?, ?)
             ON CONFLICT (project_id, user_id) DO UPDATE SET role = EXCLUDED.role",
            [$projectId, $userId, $role]
        );
    }

    public function remove(int $projectId, int $userId): void
    {
        $this->db->execute(
            "DELETE FROM project_members WHERE project_id = ? AND user_id = ?",
            [$projectId, $userId]
        );
    }

    /** Projects where user is manager */
    public function managedProjects(int $userId): array
    {
        return $this->db->query(
            "SELECT project_id FROM project_members WHERE user_id = ? AND role = 'manager'",
            [$userId]
        );
    }
}
