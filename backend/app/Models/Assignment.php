<?php
namespace App\Models;

use Core\Model;

class Assignment extends Model
{
    protected string $table = 'user_projects';

    public function getProjectIds(int $userId): array
    {
        $rows = $this->db->query('SELECT project_id FROM user_projects WHERE user_id = ?', [$userId]);
        return array_column($rows, 'project_id');
    }

    public function syncUserProjects(int $userId, array $projectIds): void
    {
        $this->db->beginTransaction();
        try {
            $this->db->execute('DELETE FROM user_projects WHERE user_id = ?', [$userId]);
            foreach ($projectIds as $pid) {
                $this->db->execute(
                    'INSERT INTO user_projects (user_id, project_id) VALUES (?, ?) ON CONFLICT DO NOTHING',
                    [$userId, (int)$pid]
                );
            }
            $this->db->commit();
        } catch (\Throwable $e) {
            $this->db->rollback();
            throw $e;
        }
    }

    public function getUsersForProject(int $projectId): array
    {
        return $this->db->query("
            SELECT u.id, u.name, u.email, u.avatar
            FROM user_projects up
            JOIN users u ON u.id = up.user_id
            WHERE up.project_id = ?
        ", [$projectId]);
    }

    public function findById(int $id): array|false { return false; }
    public function findAll(array $c = [], string $o = 'id'): array { return []; }
    public function softDelete(int $id): bool { return false; }
    public function restore(int $id): bool { return false; }
    public function findDeleted(): array { return []; }
}
