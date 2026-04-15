<?php
namespace App\Models;

use Core\Model;

class Notification extends Model
{
    protected string $table = 'notifications';

    public function forUser(int $userId, int $limit = 30): array
    {
        return $this->db->query(
            "SELECT * FROM notifications WHERE user_id = ?
             ORDER BY created_at DESC LIMIT ?",
            [$userId, $limit]
        );
    }

    public function unreadCount(int $userId): int
    {
        $r = $this->db->fetchOne(
            "SELECT COUNT(*) AS n FROM notifications WHERE user_id = ? AND is_read = FALSE",
            [$userId]
        );
        return (int)($r['n'] ?? 0);
    }

    public function markAllRead(int $userId): void
    {
        $this->db->execute(
            "UPDATE notifications SET is_read = TRUE WHERE user_id = ?",
            [$userId]
        );
    }

    public function markRead(int $id, int $userId): void
    {
        $this->db->execute(
            "UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?",
            [$id, $userId]
        );
    }

    public static function push(int $userId, string $type, string $title, string $body = '', string $link = ''): void
    {
        $db = \Core\DB::getInstance();
        $db->execute(
            "INSERT INTO notifications (user_id, type, title, body, link) VALUES (?, ?, ?, ?, ?)",
            [$userId, $type, $title, $body, $link]
        );
    }
}
