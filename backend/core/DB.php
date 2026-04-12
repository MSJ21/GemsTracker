<?php
namespace Core;

use PDO;

class DB
{
    private static ?DB $instance = null;
    private PDO $pdo;

    private function __construct()
    {
        $cfg = require APP_ROOT . '/config/database.php';
        $dsn = "pgsql:host={$cfg['host']};port={$cfg['port']};dbname={$cfg['dbname']}";
        $this->pdo = new PDO($dsn, $cfg['user'], $cfg['password'], [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]);
    }

    public static function getInstance(): self
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function query(string $sql, array $params = []): array
    {
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    public function fetchOne(string $sql, array $params = []): array|false
    {
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetch();
    }

    public function execute(string $sql, array $params = []): bool
    {
        return $this->pdo->prepare($sql)->execute($params);
    }

    public function insert(string $table, array $data): int|string
    {
        $cols  = implode(', ', array_keys($data));
        $marks = implode(', ', array_fill(0, count($data), '?'));
        $stmt  = $this->pdo->prepare("INSERT INTO {$table} ({$cols}) VALUES ({$marks}) RETURNING id");
        $stmt->execute(array_values($data));
        return $stmt->fetch()['id'];
    }

    public function beginTransaction(): void { $this->pdo->beginTransaction(); }
    public function commit(): void           { $this->pdo->commit(); }
    public function rollback(): void         { $this->pdo->rollBack(); }
}
