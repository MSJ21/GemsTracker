<?php
namespace App\Models;

use Core\Model;

class Goal extends Model
{
    protected string $table = 'goals';

    public function allWithKeyResults(): array
    {
        $goals = $this->db->query(
            "SELECT g.*, u.name AS owner_name
             FROM goals g
             LEFT JOIN users u ON u.id = g.owner_id
             WHERE g.is_deleted = 0
             ORDER BY g.created_at DESC"
        );
        foreach ($goals as &$goal) {
            $goal['key_results'] = $this->db->query(
                "SELECT * FROM key_results WHERE goal_id = ? AND is_deleted = 0 ORDER BY id",
                [$goal['id']]
            );
        }
        return $goals;
    }

    public function findWithKeyResults(int $id): array|false
    {
        $goal = $this->db->fetchOne(
            "SELECT g.*, u.name AS owner_name
             FROM goals g LEFT JOIN users u ON u.id = g.owner_id
             WHERE g.id = ? AND g.is_deleted = 0",
            [$id]
        );
        if (!$goal) return false;
        $goal['key_results'] = $this->db->query(
            "SELECT * FROM key_results WHERE goal_id = ? AND is_deleted = 0 ORDER BY id",
            [$id]
        );
        return $goal;
    }

    public function updateProgress(int $goalId): void
    {
        $krs = $this->db->query(
            "SELECT target, current_val FROM key_results WHERE goal_id = ? AND is_deleted = 0",
            [$goalId]
        );
        if (!$krs) return;
        $total = 0;
        foreach ($krs as $kr) {
            $t = (float)$kr['target'];
            $c = (float)$kr['current_val'];
            $total += $t > 0 ? min(100, ($c / $t) * 100) : 0;
        }
        $avg = round($total / count($krs));
        $this->db->execute("UPDATE goals SET progress = ? WHERE id = ?", [$avg, $goalId]);
    }
}
