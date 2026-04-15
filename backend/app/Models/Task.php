<?php
namespace App\Models;

use Core\Model;

class Task extends Model
{
    protected string $table = 'tasks';

    private function baseSelect(string $alias = 't'): string
    {
        return "SELECT {$alias}.*,
                       COALESCE((SELECT COUNT(*) FROM subtasks WHERE task_id = {$alias}.id), 0) AS subtask_total,
                       COALESCE((SELECT COUNT(*) FROM subtasks WHERE task_id = {$alias}.id AND is_done = 1), 0) AS subtask_done,
                       COALESCE((SELECT SUM(seconds) FROM time_entries WHERE task_id = {$alias}.id AND stopped_at IS NOT NULL), 0) AS tracked_seconds,
                       (SELECT name   FROM users WHERE id = {$alias}.assignee_id) AS assignee_name,
                       (SELECT avatar FROM users WHERE id = {$alias}.assignee_id) AS assignee_avatar";
    }

    public function getByUserId(int $userId, array $filters = []): array
    {
        $where  = 'WHERE (t.user_id = ? OR t.assignee_id = ?) AND t.is_deleted = 0';
        $params = [$userId, $userId];

        if (!empty($filters['project_id'])) { $where .= ' AND t.project_id = ?'; $params[] = $filters['project_id']; }
        if (!empty($filters['status']))     { $where .= ' AND t.status = ?';     $params[] = $filters['status']; }
        if (!empty($filters['priority']))   { $where .= ' AND t.priority = ?';   $params[] = $filters['priority']; }
        if (!empty($filters['date_from']))  { $where .= ' AND t.task_date >= ?'; $params[] = $filters['date_from']; }
        if (!empty($filters['date_to']))    { $where .= ' AND t.task_date <= ?'; $params[] = $filters['date_to']; }

        return $this->db->query("
            {$this->baseSelect()}
            , p.name AS project_name
            , (SELECT name FROM users WHERE id = t.user_id) AS user_name
            FROM tasks t
            JOIN projects p ON p.id = t.project_id
            {$where}
            ORDER BY t.task_date DESC, t.created_at DESC
        ", $params);
    }

    public function getAdminFiltered(array $filters = []): array
    {
        $where  = 'WHERE t.is_deleted = 0';
        $params = [];

        if (!empty($filters['user_id']))    { $where .= ' AND t.user_id = ?';    $params[] = $filters['user_id']; }
        if (!empty($filters['project_id'])) { $where .= ' AND t.project_id = ?'; $params[] = $filters['project_id']; }
        if (!empty($filters['status']))     { $where .= ' AND t.status = ?';     $params[] = $filters['status']; }
        if (!empty($filters['priority']))   { $where .= ' AND t.priority = ?';   $params[] = $filters['priority']; }
        if (!empty($filters['date_from']))  { $where .= ' AND t.task_date >= ?'; $params[] = $filters['date_from']; }
        if (!empty($filters['date_to']))    { $where .= ' AND t.task_date <= ?'; $params[] = $filters['date_to']; }

        return $this->db->query("
            {$this->baseSelect()}
            , p.name AS project_name, u.name AS user_name
            FROM tasks t
            JOIN projects p ON p.id = t.project_id
            JOIN users u ON u.id = t.user_id
            {$where}
            ORDER BY t.task_date DESC, t.created_at DESC
        ", $params);
    }

    public function getByProject(int $projectId): array
    {
        return $this->db->query("
            {$this->baseSelect()}
            , u.name AS user_name
            FROM tasks t
            JOIN users u ON u.id = t.user_id
            WHERE t.project_id = ? AND t.is_deleted = 0
            ORDER BY t.task_date DESC, t.created_at DESC
        ", [$projectId]);
    }

    public function getUserStatusSummary(int $userId, ?string $from, ?string $to): array
    {
        $where  = 'WHERE t.user_id = ? AND t.is_deleted = 0';
        $params = [$userId];
        if ($from) { $where .= ' AND t.task_date >= ?'; $params[] = $from; }
        if ($to)   { $where .= ' AND t.task_date <= ?'; $params[] = $to; }

        return $this->db->query(
            "SELECT t.status, COUNT(*) AS count FROM tasks t {$where} GROUP BY t.status",
            $params
        );
    }

    public function getHoursByProject(int $userId): array
    {
        return $this->db->query("
            SELECT p.name AS project_name, COALESCE(SUM(t.hours_spent), 0) AS total_hours
            FROM tasks t
            JOIN projects p ON p.id = t.project_id
            WHERE t.user_id = ? AND t.is_deleted = 0
            GROUP BY p.id, p.name
            ORDER BY total_hours DESC
        ", [$userId]);
    }

    public function getWeeklySummary(int $userId): array
    {
        $row = $this->db->fetchOne("
            SELECT
                COUNT(*) FILTER (WHERE t.task_date >= date_trunc('week', CURRENT_DATE)) AS this_week_tasks,
                COUNT(*) FILTER (WHERE t.task_date >= date_trunc('week', CURRENT_DATE) - INTERVAL '7 days'
                                   AND t.task_date < date_trunc('week', CURRENT_DATE))   AS last_week_tasks,
                COALESCE(SUM(t.hours_spent) FILTER (WHERE t.task_date >= date_trunc('week', CURRENT_DATE)), 0) AS this_week_hours
            FROM tasks t
            WHERE t.user_id = ? AND t.is_deleted = 0
        ", [$userId]);
        return $row ?: [];
    }

    public function getTodayCount(): int
    {
        $row = $this->db->fetchOne(
            "SELECT COUNT(*) AS n FROM tasks WHERE task_date = CURRENT_DATE AND is_deleted = 0"
        );
        return (int)($row['n'] ?? 0);
    }

    public function getRecurringDue(): array
    {
        return $this->db->query("
            SELECT * FROM tasks
            WHERE recur_type IS NOT NULL
              AND is_deleted = 0
              AND (recur_end IS NULL OR recur_end >= CURRENT_DATE)
              AND NOT EXISTS (
                SELECT 1 FROM tasks t2
                WHERE t2.parent_id = tasks.id
                  AND t2.task_date = CURRENT_DATE
                  AND t2.is_deleted = 0
              )
              AND (
                (recur_type = 'daily')
                OR (recur_type = 'weekly' AND EXTRACT(DOW FROM tasks.task_date) = EXTRACT(DOW FROM CURRENT_DATE))
              )
        ");
    }
}
