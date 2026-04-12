<?php
namespace App\Controllers;

use App\Models\FilterPreset;
use Core\Controller;

class FilterPresetController extends Controller
{
    private FilterPreset $model;

    public function __construct()
    {
        $this->model = new FilterPreset();
    }

    public function index(array $params = []): never
    {
        $auth    = $this->authUser();
        $presets = $this->model->getByUser((int)$auth['id']);
        // Decode JSON filters field
        foreach ($presets as &$p) {
            $p['filters'] = json_decode($p['filters'], true) ?? [];
        }
        $this->success($presets);
    }

    public function store(array $params = []): never
    {
        $auth    = $this->authUser();
        $data    = $this->input();
        $name    = trim($data['name'] ?? '');
        $filters = $data['filters'] ?? [];
        if (!$name) $this->error('Name is required');

        $id = $this->model->create((int)$auth['id'], $name, $filters);
        $this->success(['id' => $id], 'Preset saved');
    }

    public function destroy(array $params): never
    {
        $auth = $this->authUser();
        $this->model->delete((int)$params['id'], (int)$auth['id']);
        $this->success(null, 'Preset deleted');
    }
}
