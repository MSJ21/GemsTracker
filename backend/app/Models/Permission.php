<?php
namespace App\Models;

use Core\Model;

class Permission extends Model
{
    protected string $table = 'permissions';

    public function all(): array
    {
        return $this->db->query(
            "SELECT * FROM permissions ORDER BY module, action"
        );
    }

    public function grouped(): array
    {
        $rows = $this->all();
        $out  = [];
        foreach ($rows as $r) {
            $out[$r['module']][] = $r;
        }
        return $out;
    }
}
