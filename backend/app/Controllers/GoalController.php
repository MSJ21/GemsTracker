<?php
namespace App\Controllers;

use App\Models\Goal;
use Core\Controller;

class GoalController extends Controller
{
    private Goal $model;

    public function __construct()
    {
        $this->model = new Goal();
    }

    public function index(array $params = []): never
    {
        $this->success($this->model->allWithKeyResults());
    }

    public function store(array $params = []): never
    {
        $auth = $this->authUser();
        $data = $this->input();
        $title = trim($data['title'] ?? '');
        if ($title === '') $this->error('Title is required');

        $id = $this->model->create([
            'title'       => $title,
            'description' => $data['description'] ?? '',
            'owner_id'    => !empty($data['owner_id']) ? (int)$data['owner_id'] : (int)$auth['id'],
            'due_date'    => ($data['due_date'] ?? '') ?: null,
            'status'      => $data['status'] ?? 'active',
        ]);

        // Create key results
        if (!empty($data['key_results']) && is_array($data['key_results'])) {
            foreach ($data['key_results'] as $kr) {
                $this->model->db->execute(
                    "INSERT INTO key_results (goal_id, title, target, unit) VALUES (?, ?, ?, ?)",
                    [$id, $kr['title'], $kr['target'] ?? 100, $kr['unit'] ?? '']
                );
            }
        }

        $this->success($this->model->findWithKeyResults((int)$id), 'Goal created');
    }

    public function update(array $params = []): never
    {
        $id   = (int)($params['id'] ?? 0);
        $data = $this->input();
        $title = trim($data['title'] ?? '');
        if ($title === '') $this->error('Title is required');

        $this->model->update($id, [
            'title'       => $title,
            'description' => $data['description'] ?? '',
            'owner_id'    => !empty($data['owner_id']) ? (int)$data['owner_id'] : null,
            'due_date'    => ($data['due_date'] ?? '') ?: null,
            'status'      => $data['status'] ?? 'active',
        ]);

        $this->success($this->model->findWithKeyResults($id), 'Goal updated');
    }

    public function destroy(array $params = []): never
    {
        $id = (int)($params['id'] ?? 0);
        $this->model->softDelete($id);
        $this->success(null, 'Goal deleted');
    }

    public function updateKeyResult(array $params = []): never
    {
        $krId = (int)($params['kr_id'] ?? 0);
        $data = $this->input();

        $kr = $this->model->db->fetchOne(
            "SELECT * FROM key_results WHERE id = ?", [$krId]
        );
        if (!$kr) $this->error('Key result not found', 404);

        $this->model->db->execute(
            "UPDATE key_results SET current_val = ?, title = ?, target = ?, unit = ? WHERE id = ?",
            [
                $data['current_val'] ?? $kr['current_val'],
                $data['title'] ?? $kr['title'],
                $data['target'] ?? $kr['target'],
                $data['unit'] ?? $kr['unit'],
                $krId
            ]
        );
        $this->model->updateProgress((int)$kr['goal_id']);
        $this->success($this->model->findWithKeyResults((int)$kr['goal_id']), 'Updated');
    }
}
