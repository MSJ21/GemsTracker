<?php
namespace App\Models;

use Core\DB;

class FilterPreset
{
    private DB $db;

    public function __construct()
    {
        $this->db = DB::getInstance();
    }

    public function getByUser(int $userId): array
    {
        return $this->db->query(
            "SELECT * FROM filter_presets WHERE user_id = ? ORDER BY created_at DESC",
            [$userId]
        );
    }

    public function create(int $userId, string $name, array $filters): int
    {
        return (int)$this->db->insert('filter_presets', [
            'user_id' => $userId,
            'name'    => $name,
            'filters' => json_encode($filters),
        ]);
    }

    public function delete(int $id, int $userId): void
    {
        $this->db->query(
            "DELETE FROM filter_presets WHERE id = ? AND user_id = ?",
            [$id, $userId]
        );
    }
}
