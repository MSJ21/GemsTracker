<?php
namespace App\Controllers;

use App\Models\Note;
use Core\Controller;

class NotesController extends Controller
{
    public function index(array $params = []): never
    {
        $user  = $this->authUser();
        $notes = (new Note())->getByUser((int)$user['id']);

        // Cast is_pinned to bool for JSON
        $notes = array_map(function (array $n): array {
            $n['is_pinned'] = (bool)$n['is_pinned'];
            return $n;
        }, $notes);

        $this->success($notes);
    }

    public function store(array $params = []): never
    {
        $user = $this->authUser();
        $body = $this->input();

        $id   = (new Note())->createForUser((int)$user['id'], $body);
        $note = (new Note())->findById((int)$id);

        if ($note) {
            $note['is_pinned'] = (bool)$note['is_pinned'];
        }

        $this->success($note, 'Note created');
    }

    public function update(array $params = []): never
    {
        $user = $this->authUser();
        $body = $this->input();
        $id   = (int)($params['id'] ?? 0);

        (new Note())->updateForUser($id, (int)$user['id'], $body);

        $note = (new Note())->findById($id);
        if ($note) {
            $note['is_pinned'] = (bool)$note['is_pinned'];
        }

        $this->success($note, 'Note updated');
    }

    public function destroy(array $params = []): never
    {
        $user = $this->authUser();
        $id   = (int)($params['id'] ?? 0);

        (new Note())->deleteForUser($id, (int)$user['id']);
        $this->success(null, 'Note deleted');
    }
}
