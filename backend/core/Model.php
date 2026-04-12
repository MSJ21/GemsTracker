<?php
namespace Core;

abstract class Model
{
    protected DB $db;
    protected string $table;
    protected string $pk = 'id';

    public function __construct()
    {
        $this->db = DB::getInstance();
    }

    public function findById(int $id): array|false
    {
        return $this->db->fetchOne(
            "SELECT * FROM {$this->table} WHERE {$this->pk} = ? AND is_deleted = 0",
            [$id]
        );
    }

    public function findAll(array $conditions = [], string $order = 'created_at DESC'): array
    {
        $where  = 'WHERE is_deleted = 0';
        $params = [];
        foreach ($conditions as $col => $val) {
            $where   .= " AND {$col} = ?";
            $params[] = $val;
        }
        return $this->db->query("SELECT * FROM {$this->table} {$where} ORDER BY {$order}", $params);
    }

    public function create(array $data): int|string
    {
        return $this->db->insert($this->table, $data);
    }

    public function update(int $id, array $data): bool
    {
        $sets   = implode(', ', array_map(fn($c) => "{$c} = ?", array_keys($data)));
        $params = [...array_values($data), $id];
        return $this->db->execute("UPDATE {$this->table} SET {$sets} WHERE {$this->pk} = ?", $params);
    }

    public function softDelete(int $id): bool
    {
        return $this->db->execute(
            "UPDATE {$this->table} SET is_deleted = 1, deleted_at = NOW() WHERE {$this->pk} = ?",
            [$id]
        );
    }

    public function restore(int $id): bool
    {
        return $this->db->execute(
            "UPDATE {$this->table} SET is_deleted = 0, deleted_at = NULL WHERE {$this->pk} = ?",
            [$id]
        );
    }

    public function findDeleted(): array
    {
        return $this->db->query(
            "SELECT * FROM {$this->table} WHERE is_deleted = 1 ORDER BY deleted_at DESC"
        );
    }

    public function count(array $conditions = []): int
    {
        $where  = 'WHERE is_deleted = 0';
        $params = [];
        foreach ($conditions as $col => $val) {
            $where   .= " AND {$col} = ?";
            $params[] = $val;
        }
        $row = $this->db->fetchOne("SELECT COUNT(*) as n FROM {$this->table} {$where}", $params);
        return (int)($row['n'] ?? 0);
    }
}
