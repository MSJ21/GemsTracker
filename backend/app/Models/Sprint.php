<?php
namespace App\Models;

use Core\Model;

class Sprint extends Model
{
    protected string $table = 'sprints';

    public function forProject(int $projectId): array
    {
        return $this->db->query(
            "SELECT s.*,
                    COUNT(t.id) AS task_count,
                    COUNT(CASE WHEN t.status = 'done' THEN 1 END) AS done_count,
                    COALESCE(SUM(t.story_points), 0) AS total_points,
                    COALESCE(SUM(CASE WHEN t.status = 'done' THEN t.story_points ELSE 0 END), 0) AS done_points
             FROM sprints s
             LEFT JOIN tasks t ON t.sprint_id = s.id AND t.is_deleted = 0
             WHERE s.project_id = ?
             GROUP BY s.id
             ORDER BY s.created_at DESC",
            [$projectId]
        );
    }

    public function withTasks(int $sprintId): array
    {
        $sprint = $this->db->fetchOne(
            "SELECT * FROM sprints WHERE id = ?",
            [$sprintId]
        );
        if (! $sprint) {return [];}

        $sprint['tasks'] = $this->db->query(
            "SELECT t.*,
                    u.name   AS user_name,
                    a.name   AS assignee_name,
                    a.avatar AS assignee_avatar,
                    COALESCE((SELECT COUNT(*) FROM subtasks WHERE task_id = t.id), 0) AS subtask_total,
                    COALESCE((SELECT COUNT(*) FROM subtasks WHERE task_id = t.id AND is_done = 1), 0) AS subtask_done,
                    COALESCE((SELECT SUM(seconds) FROM time_entries WHERE task_id = t.id AND stopped_at IS NOT NULL), 0) AS tracked_seconds
             FROM tasks t
             LEFT JOIN users u ON u.id = t.user_id
             LEFT JOIN users a ON a.id = t.assignee_id
             WHERE t.sprint_id = ? AND t.is_deleted = 0
             ORDER BY t.priority DESC, t.created_at",
            [$sprintId]
        );
        return $sprint;
    }

    public function backlog(int $projectId): array
    {
        return $this->db->query(
            "SELECT t.*,
                    u.name   AS user_name,
                    a.name   AS assignee_name,
                    a.avatar AS assignee_avatar,
                    p.name   AS project_name,
                    COALESCE((SELECT COUNT(*) FROM subtasks WHERE task_id = t.id), 0) AS subtask_total,
                    COALESCE((SELECT COUNT(*) FROM subtasks WHERE task_id = t.id AND is_done = 1), 0) AS subtask_done,
                    COALESCE((SELECT SUM(seconds) FROM time_entries WHERE task_id = t.id AND stopped_at IS NOT NULL), 0) AS tracked_seconds
             FROM tasks t
             LEFT JOIN users u ON u.id = t.user_id
             LEFT JOIN users a ON a.id = t.assignee_id
             LEFT JOIN projects p ON p.id = t.project_id
             WHERE t.project_id = ? AND t.sprint_id IS NULL AND t.is_deleted = 0
             ORDER BY t.priority DESC, t.created_at",
            [$projectId]
        );
    }

    /** Fetch single sprint row (used for permission check) */
    public function fetchOne(int $id): array | false
    {
        return $this->db->fetchOne("SELECT * FROM sprints WHERE id = ?", [$id]);
    }

    public function delete($id): bool
    {
        $result = $this->db->query(
            "DELETE FROM sprints WHERE id = ?",
            [$id]
        );

        return $result !== false;
    }
}
