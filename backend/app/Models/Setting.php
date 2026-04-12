<?php
namespace App\Models;

use Core\DB;

class Setting
{
    private DB $db;

    public function __construct()
    {
        $this->db = DB::getInstance();
    }

    public function all(): array
    {
        $rows = $this->db->query("SELECT key, value FROM settings ORDER BY key");
        $result = [];
        foreach ($rows as $row) {
            $result[$row['key']] = $row['value'];
        }
        return $result;
    }

    public function get(string $key, string $default = ''): string
    {
        $row = $this->db->fetchOne("SELECT value FROM settings WHERE key = ?", [$key]);
        return $row ? (string)$row['value'] : $default;
    }

    public function set(string $key, string $value): void
    {
        $this->db->query(
            "INSERT INTO settings (key, value, updated_at) VALUES (?, ?, NOW())
             ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()",
            [$key, $value]
        );
    }
}
