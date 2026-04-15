<?php
namespace App\Models;

use Core\Model;

class Announcement extends Model
{
    protected string $table = 'announcements';

    public function allWithRead(int $userId): array
    {
        return $this->db->query(
            "SELECT a.*, u.name AS author_name,
                    CASE WHEN ar.user_id IS NOT NULL THEN TRUE ELSE FALSE END AS is_read
             FROM announcements a
             LEFT JOIN users u ON u.id = a.created_by
             LEFT JOIN announcement_reads ar ON ar.announcement_id = a.id AND ar.user_id = ?
             WHERE a.is_deleted = 0
             ORDER BY a.created_at DESC",
            [$userId]
        );
    }

    public function markRead(int $id, int $userId): void
    {
        $this->db->execute(
            "INSERT INTO announcement_reads (announcement_id, user_id) VALUES (?, ?) ON CONFLICT DO NOTHING",
            [$id, $userId]
        );
    }
}
