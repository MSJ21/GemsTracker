<?php
namespace App\Controllers;

use App\Models\AuditLog;
use Core\Controller;

class AuditLogController extends Controller
{
    private AuditLog $model;

    public function __construct()
    {
        $this->model = new AuditLog();
    }

    public function index(array $params = []): never
    {
        $entity   = $_GET['entity']    ?? null;
        $entityId = !empty($_GET['entity_id']) ? (int)$_GET['entity_id'] : null;
        $limit    = min((int)($_GET['limit'] ?? 100), 500);
        $this->success($this->model->recent($limit, $entity ?: null, $entityId));
    }
}
