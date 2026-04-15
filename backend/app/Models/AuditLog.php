<?php
namespace App\Models;

use Core\Model;

class AuditLog extends Model
{
    protected string $table = 'audit_logs';

    public function log(int $userId, string $action, string $entity, int $entityId, array $changes = []): void
    {
        $ip = $_SERVER['REMOTE_ADDR'] ?? null;
        $this->db->execute(
            "INSERT INTO audit_logs (user_id, action, entity, entity_id, changes, ip)
             VALUES (?, ?, ?, ?, ?, ?)",
            [$userId, $action, $entity, $entityId, $changes ? json_encode($changes) : null, $ip]
        );
    }

    public function recent(int $limit = 100, ?string $entity = null, ?int $entityId = null): array
    {
        $where  = '1=1';
        $params = [];
        if ($entity) {
            $where   .= " AND al.entity = ?";
            $params[] = $entity;
        }
        if ($entityId !== null) {
            $where   .= " AND al.entity_id = ?";
            $params[] = $entityId;
        }
        $params[] = $limit;
        return $this->db->query(
            "SELECT al.*, u.name AS user_name, u.email AS user_email
             FROM audit_logs al
             LEFT JOIN users u ON u.id = al.user_id
             WHERE {$where}
             ORDER BY al.created_at DESC
             LIMIT ?",
            $params
        );
    }
}
