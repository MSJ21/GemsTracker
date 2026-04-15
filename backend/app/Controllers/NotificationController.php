<?php
namespace App\Controllers;

use App\Models\Notification;
use Core\Controller;

class NotificationController extends Controller
{
    private Notification $model;

    public function __construct()
    {
        $this->model = new Notification();
    }

    public function index(array $params = []): never
    {
        $auth = $this->authUser();
        $list = $this->model->forUser((int)$auth['id']);
        $unread = $this->model->unreadCount((int)$auth['id']);
        $this->success(['items' => $list, 'unread' => $unread]);
    }

    public function markRead(array $params = []): never
    {
        $auth = $this->authUser();
        $id   = (int)($params['id'] ?? 0);
        $this->model->markRead($id, (int)$auth['id']);
        $this->success(null, 'Marked read');
    }

    public function markAllRead(array $params = []): never
    {
        $auth = $this->authUser();
        $this->model->markAllRead((int)$auth['id']);
        $this->success(null, 'All marked read');
    }
}
