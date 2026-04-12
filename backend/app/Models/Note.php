<?php
namespace App\Models;

use Core\Model;

class Note extends Model
{
    protected string $table = 'notes';

    public function findById(int $id): array|false
    {
        return $this->db->fetchOne("SELECT * FROM notes WHERE id = ?", [$id]);
    }

    public function getByUser(int $userId): array
    {
        return $this->db->query(
            "SELECT * FROM notes WHERE user_id = ? ORDER BY is_pinned DESC, updated_at DESC",
            [$userId]
        );
    }

    public function createForUser(int $userId, array $data): int|string
    {
        $pinned = (isset($data['is_pinned']) && $data['is_pinned']) ? 'true' : 'false';

        return $this->db->insert('notes', [
            'user_id'   => $userId,
            'title'     => $data['title']   ?? '',
            'content'   => $data['content'] ?? '',
            'color'     => $data['color']   ?? 'yellow',
            'is_pinned' => $pinned,
        ]);
    }

    public function updateForUser(int $id, int $userId, array $data): bool
    {
        $allowed = ['title', 'content', 'color', 'is_pinned'];
        $sets    = [];
        $params  = [];

        foreach ($allowed as $field) {
            if (!array_key_exists($field, $data)) {
                continue;
            }
            $sets[] = "{$field} = ?";
            if ($field === 'is_pinned') {
                $params[] = $data[$field] ? 'true' : 'false';
            } else {
                $params[] = $data[$field];
            }
        }

        if (empty($sets)) {
            return false;
        }

        $sets[]   = "updated_at = NOW()";
        $params[] = $id;
        $params[] = $userId;

        return $this->db->execute(
            "UPDATE notes SET " . implode(', ', $sets) . " WHERE id = ? AND user_id = ?",
            $params
        );
    }

    public function deleteForUser(int $id, int $userId): bool
    {
        return $this->db->execute(
            "DELETE FROM notes WHERE id = ? AND user_id = ?",
            [$id, $userId]
        );
    }
}
