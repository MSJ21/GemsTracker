<?php
namespace App\Models;

use Core\Model;

class User extends Model
{
    protected string $table = 'users';

    public function findByEmail(string $email): array|false
    {
        return $this->db->fetchOne(
            'SELECT * FROM users WHERE email = ? AND is_deleted = 0',
            [$email]
        );
    }

    public function getAllWithStats(): array
    {
        return $this->db->query("
            SELECT u.id, u.name, u.email, u.role, u.status, u.avatar, u.created_at,
                   COUNT(t.id)                       AS total_tasks,
                   COALESCE(SUM(t.hours_spent), 0)   AS total_hours,
                   MAX(t.task_date)                  AS last_active
            FROM users u
            LEFT JOIN tasks t ON t.user_id = u.id AND t.is_deleted = 0
            WHERE u.is_deleted = 0
            GROUP BY u.id
            ORDER BY u.created_at DESC
        ");
    }

    public function getTaskStreak(int $userId): int
    {
        $rows = $this->db->query(
            "SELECT DISTINCT task_date::date AS day FROM tasks
             WHERE user_id = ? AND is_deleted = 0 ORDER BY day DESC",
            [$userId]
        );

        $streak   = 0;
        $expected = new \DateTime('today');

        foreach ($rows as $row) {
            $day = new \DateTime($row['day']);
            if ($day->format('Y-m-d') !== $expected->format('Y-m-d')) break;
            $streak++;
            $expected->modify('-1 day');
        }

        return $streak;
    }

    public function getActivityTimeline(int $userId): array
    {
        return $this->db->query("
            SELECT t.id, t.title, t.hours_spent, t.status, t.task_date, p.name AS project_name
            FROM tasks t
            JOIN projects p ON p.id = t.project_id
            WHERE t.user_id = ? AND t.is_deleted = 0
            ORDER BY t.task_date DESC, t.created_at DESC
            LIMIT 10
        ", [$userId]);
    }

    public function getUserActivityTable(): array
    {
        return $this->db->query("
            SELECT u.id, u.name, u.email, u.avatar,
                   COUNT(t.id)                      AS total_tasks,
                   COALESCE(SUM(t.hours_spent), 0)  AS total_hours,
                   MAX(t.task_date)                 AS last_active
            FROM users u
            LEFT JOIN tasks t ON t.user_id = u.id AND t.is_deleted = 0
            WHERE u.is_deleted = 0 AND u.role = 'user'
            GROUP BY u.id
            ORDER BY total_tasks DESC
        ");
    }
}
