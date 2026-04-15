<?php
namespace App\Models;

use Core\Model;

class Leave extends Model
{
    protected string $table = 'leaves';

    public function allWithUser(): array
    {
        return $this->db->query(
            "SELECT l.*, u.name AS user_name, u.email AS user_email,
                    r.name AS reviewer_name
             FROM leaves l
             JOIN users u ON u.id = l.user_id
             LEFT JOIN users r ON r.id = l.reviewed_by
             WHERE l.is_deleted = 0
             ORDER BY l.created_at DESC"
        );
    }

    public function forUser(int $userId): array
    {
        return $this->db->query(
            "SELECT l.*, r.name AS reviewer_name
             FROM leaves l
             LEFT JOIN users r ON r.id = l.reviewed_by
             WHERE l.user_id = ? AND l.is_deleted = 0
             ORDER BY l.created_at DESC",
            [$userId]
        );
    }
}
