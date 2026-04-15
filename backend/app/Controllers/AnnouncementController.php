<?php
namespace App\Controllers;

use App\Models\Announcement;
use App\Models\Notification;
use Core\Controller;

class AnnouncementController extends Controller
{
    private Announcement $model;

    public function __construct()
    {
        $this->model = new Announcement();
    }

    public function index(array $params = []): never
    {
        $auth = $this->authUser();
        $this->success($this->model->allWithRead((int)$auth['id']));
    }

    public function store(array $params = []): never
    {
        $auth  = $this->authUser();
        $data  = $this->input();
        $title = trim($data['title'] ?? '');
        $body  = trim($data['body'] ?? '');
        if ($title === '') { $this->error('Title is required'); }
        if ($body === '')  { $this->error('Body is required'); }

        $id = $this->model->create([
            'title'      => $title,
            'body'       => $body,
            'created_by' => $auth['id'],
        ]);

        // Notify all active users except the author
        $db    = \Core\DB::getInstance();
        $users = $db->query(
            "SELECT id FROM users WHERE is_deleted = 0 AND id != ?",
            [(int)$auth['id']]
        );
        foreach ($users as $u) {
            Notification::push(
                (int)$u['id'],
                'announcement',
                'New announcement',
                $title,
                '/announcements'
            );
        }

        $this->success(['id' => $id], 'Announcement published');
    }

    public function destroy(array $params = []): never
    {
        $id = (int)($params['id'] ?? 0);
        $this->model->softDelete($id);
        $this->success(null, 'Announcement deleted');
    }

    public function markRead(array $params = []): never
    {
        $auth = $this->authUser();
        $id   = (int)($params['id'] ?? 0);
        $this->model->markRead($id, (int)$auth['id']);
        $this->success(null, 'Marked read');
    }
}
