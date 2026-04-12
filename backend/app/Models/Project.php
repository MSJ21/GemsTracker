<?php
namespace App\Models;

use Core\Model;

class Project extends Model
{
    protected string $table = 'projects';

    public function getAllWithEntity(): array
    {
        return $this->db->query("
            SELECT p.*, e.name AS entity_name,
                   COUNT(t.id)                                          AS total_tasks,
                   COUNT(t.id) FILTER (WHERE t.status = 'done')         AS done_tasks,
                   COALESCE(SUM(t.hours_spent), 0)                      AS total_hours
            FROM projects p
            JOIN entities e ON e.id = p.entity_id
            LEFT JOIN tasks t ON t.project_id = p.id AND t.is_deleted = 0
            WHERE p.is_deleted = 0
            GROUP BY p.id, e.name
            ORDER BY p.created_at DESC
        ");
    }

    public function getByUserId(int $userId): array
    {
        return $this->db->query("
            SELECT p.*, e.name AS entity_name,
                   COUNT(t.id)                                          AS total_tasks,
                   COUNT(t.id) FILTER (WHERE t.status = 'done')         AS done_tasks,
                   COALESCE(SUM(t.hours_spent), 0)                      AS total_hours
            FROM projects p
            JOIN entities e ON e.id = p.entity_id
            JOIN user_projects up ON up.project_id = p.id AND up.user_id = ?
            LEFT JOIN tasks t ON t.project_id = p.id AND t.is_deleted = 0
            WHERE p.is_deleted = 0
            GROUP BY p.id, e.name
            ORDER BY p.end_date ASC NULLS LAST
        ", [$userId]);
    }

    public function getDeadlineAlerts(): array
    {
        return $this->db->query("
            SELECT p.*, e.name AS entity_name
            FROM projects p
            JOIN entities e ON e.id = p.entity_id
            WHERE p.is_deleted = 0
              AND p.end_date < CURRENT_DATE
              AND p.status != 'completed'
            ORDER BY p.end_date ASC
        ");
    }

    public function getTasksPerProject(): array
    {
        return $this->db->query("
            SELECT p.name, COUNT(t.id) AS task_count, COALESCE(SUM(t.hours_spent), 0) AS total_hours
            FROM projects p
            LEFT JOIN tasks t ON t.project_id = p.id AND t.is_deleted = 0
            WHERE p.is_deleted = 0
            GROUP BY p.id, p.name
            ORDER BY task_count DESC
            LIMIT 20
        ");
    }
}
