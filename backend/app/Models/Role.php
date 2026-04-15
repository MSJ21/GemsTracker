<?php
namespace App\Models;

use Core\Model;

class Role extends Model
{
    protected string $table = 'roles';

    public function all(): array
    {
        return $this->db->query(
            "SELECT r.*,
                    (SELECT COUNT(*) FROM user_roles ur WHERE ur.role_id = r.id) AS user_count
             FROM roles r
             WHERE r.is_deleted = 0
             ORDER BY r.name"
        );
    }

    public function withPermissions(int $roleId): array|false
    {
        $role = $this->db->fetchOne(
            "SELECT * FROM roles WHERE id = ? AND is_deleted = 0", [$roleId]
        );
        if (!$role) return false;

        $role['permissions'] = $this->db->query(
            "SELECT p.module, p.action FROM role_permissions rp
             JOIN permissions p ON p.id = rp.permission_id
             WHERE rp.role_id = ?",
            [$roleId]
        );
        return $role;
    }

    public function syncPermissions(int $roleId, array $permissionIds): void
    {
        $this->db->execute("DELETE FROM role_permissions WHERE role_id = ?", [$roleId]);
        foreach ($permissionIds as $pid) {
            $this->db->execute(
                "INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?) ON CONFLICT DO NOTHING",
                [$roleId, (int)$pid]
            );
        }
    }

    public function getUserRoles(int $userId): array
    {
        return $this->db->query(
            "SELECT r.* FROM user_roles ur
             JOIN roles r ON r.id = ur.role_id
             WHERE ur.user_id = ? AND r.is_deleted = 0",
            [$userId]
        );
    }

    public function assignToUser(int $userId, int $roleId): void
    {
        $this->db->execute(
            "INSERT INTO user_roles (user_id, role_id) VALUES (?, ?) ON CONFLICT DO NOTHING",
            [$userId, $roleId]
        );
    }

    public function removeFromUser(int $userId, int $roleId): void
    {
        $this->db->execute(
            "DELETE FROM user_roles WHERE user_id = ? AND role_id = ?",
            [$userId, $roleId]
        );
    }
}
