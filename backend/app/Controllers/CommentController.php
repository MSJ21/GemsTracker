<?php
namespace App\Controllers;

use App\Models\TaskComment;
use Core\Controller;

class CommentController extends Controller
{
    private TaskComment $model;

    public function __construct()
    {
        $this->model = new TaskComment();
    }

    public function index(array $params): never
    {
        $this->success($this->model->getByTask((int)$params['task_id']));
    }

    public function store(array $params): never
    {
        $auth = $this->authUser();
        $data = $this->input();
        $body = trim($data['body'] ?? '');
        if (!$body) $this->error('Comment cannot be empty');

        $id = $this->model->create((int)$params['task_id'], (int)$auth['id'], $body);
        $this->success(['id' => $id], 'Comment posted');
    }

    public function update(array $params): never
    {
        $auth    = $this->authUser();
        $comment = $this->model->findById((int)$params['id']);
        if (!$comment) $this->error('Not found', 404);
        if ((int)$comment['user_id'] !== (int)$auth['id'] && $auth['role'] !== 'admin') {
            $this->error('Forbidden', 403);
        }

        $data = $this->input();
        $body = trim($data['body'] ?? '');
        if (!$body) $this->error('Comment cannot be empty');

        $this->model->update((int)$params['id'], $body);
        $this->success(null, 'Comment updated');
    }

    public function destroy(array $params): never
    {
        $auth    = $this->authUser();
        $comment = $this->model->findById((int)$params['id']);
        if (!$comment) $this->error('Not found', 404);
        if ((int)$comment['user_id'] !== (int)$auth['id'] && $auth['role'] !== 'admin') {
            $this->error('Forbidden', 403);
        }

        $this->model->delete((int)$params['id']);
        $this->success(null, 'Comment deleted');
    }
}
