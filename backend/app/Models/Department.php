<?php
namespace App\Models;

use Core\Model;

class Department extends Model
{
    protected string $table = 'departments';

    public function all(): array
    {
        return $this->db->query(
            "SELECT d.*, u.name AS head_name
             FROM departments d
             LEFT JOIN users u ON u.id = d.head_id
             WHERE d.is_deleted = 0
             ORDER BY d.name"
        );
    }

    public function withMemberCount(): array
    {
        return $this->db->query(
            "SELECT d.*, u.name AS head_name,
                    (SELECT COUNT(*) FROM users WHERE department_id = d.id AND is_deleted = 0) AS member_count
             FROM departments d
             LEFT JOIN users u ON u.id = d.head_id
             WHERE d.is_deleted = 0
             ORDER BY d.name"
        );
    }
}
