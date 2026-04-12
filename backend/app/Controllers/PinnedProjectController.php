<?php
namespace App\Controllers;

use App\Models\PinnedProject;
use Core\Controller;

class PinnedProjectController extends Controller
{
    private PinnedProject $model;

    public function __construct()
    {
        $this->model = new PinnedProject();
    }

    public function index(array $params = []): never
    {
        $auth = $this->authUser();
        $this->success($this->model->getByUser((int)$auth['id']));
    }

    public function pin(array $params): never
    {
        $auth = $this->authUser();
        $this->model->pin((int)$auth['id'], (int)$params['id']);
        $this->success(null, 'Pinned');
    }

    public function unpin(array $params): never
    {
        $auth = $this->authUser();
        $this->model->unpin((int)$auth['id'], (int)$params['id']);
        $this->success(null, 'Unpinned');
    }
}
