<?php
namespace App\Models;

use Core\Model;

class Milestone extends Model
{
    protected string $table = 'milestones';

    public function forProject(int $projectId): array
    {
        return $this->db->query(
            "SELECT m.*,
                    (SELECT COUNT(*) FROM tasks t WHERE t.milestone_id = m.id AND t.is_deleted = 0) AS task_count,
                    (SELECT COUNT(*) FROM tasks t WHERE t.milestone_id = m.id AND t.status = 'done' AND t.is_deleted = 0) AS done_count
             FROM milestones m
             WHERE m.project_id = ? AND m.is_deleted = 0
             ORDER BY m.due_date ASC NULLS LAST, m.name",
            [$projectId]
        );
    }
}
