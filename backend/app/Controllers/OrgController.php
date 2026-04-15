<?php
namespace App\Controllers;

use Core\Controller;

class OrgController extends Controller
{
    public function tree(array $params = []): never
    {
        $db    = \Core\DB::getInstance();
        $users = $db->query(
            "SELECT u.id, u.name, u.email, u.job_title, u.avatar, u.role, u.status,
                    u.manager_id
             FROM users u
             WHERE u.is_deleted = 0
             ORDER BY u.name"
        );

        // Index by id (cast keys to int for consistent lookup)
        $map = [];
        foreach ($users as $u) {
            $u['id']         = (int)$u['id'];
            $u['manager_id'] = $u['manager_id'] !== null ? (int)$u['manager_id'] : null;
            $map[$u['id']]   = $u;
        }

        // Group child ids by parent id
        $childrenOf = [];
        foreach ($map as $id => $u) {
            $mid = $u['manager_id'];
            if ($mid && isset($map[$mid])) {
                $childrenOf[$mid][] = $id;
            }
        }

        // Recursively build a node; $placed prevents revisiting (cycle-safe)
        $placed    = [];
        $buildNode = function(int $id) use (&$buildNode, $map, $childrenOf, &$placed): array {
            $placed[$id] = true;
            $node = $map[$id];
            $node['children'] = [];
            foreach (($childrenOf[$id] ?? []) as $childId) {
                if (!isset($placed[$childId])) {          // skip already-placed nodes (breaks cycles)
                    $node['children'][] = $buildNode((int)$childId);
                }
            }
            return $node;
        };

        // Primary roots = users with no valid manager
        $roots = [];
        foreach ($map as $id => $u) {
            $mid = $u['manager_id'];
            if (!$mid || !isset($map[$mid])) {
                $roots[] = $buildNode((int)$id);
            }
        }

        // Secondary roots = any users not yet placed (caught in cycles)
        foreach ($map as $id => $u) {
            if (!isset($placed[$id])) {
                $roots[] = $buildNode((int)$id);
            }
        }

        $this->success($roots);
    }

    public function setManager(array $params = []): never
    {
        $db     = \Core\DB::getInstance();
        $userId = (int)($params['user_id'] ?? 0);
        $data   = $this->input();
        $mgr    = !empty($data['manager_id']) ? (int)$data['manager_id'] : null;

        // Prevent cycles
        if ($mgr === $userId) $this->error('User cannot manage themselves');

        $db->execute(
            "UPDATE users SET manager_id = ? WHERE id = ?",
            [$mgr, $userId]
        );
        $this->success(null, 'Manager updated');
    }
}
