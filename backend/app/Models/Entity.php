<?php
namespace App\Models;

use Core\Model;

class Entity extends Model
{
    protected string $table = 'entities';

    public function getWithProjectCount(): array
    {
        return $this->db->query("
            SELECT e.*, COUNT(p.id) AS project_count
            FROM entities e
            LEFT JOIN projects p ON p.entity_id = e.id AND p.is_deleted = 0
            WHERE e.is_deleted = 0
            GROUP BY e.id
            ORDER BY e.created_at DESC
        ");
    }
}
