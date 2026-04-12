<?php
namespace App\Controllers;

use App\Models\{Task, User, Project};
use Core\Controller;

class ReportController extends Controller
{
    public function admin(array $params = []): never
    {
        $filters = $_GET;
        $tasks   = new Task();
        $users   = new User();
        $proj    = new Project();

        $this->success([
            'tasks'             => $tasks->getAdminFiltered($filters),
            'user_activity'     => $users->getUserActivityTable(),
            'tasks_per_project' => $proj->getTasksPerProject(),
            'users'             => $users->findAll([], 'name ASC'),
            'projects'          => $proj->getAllWithEntity(),
        ]);
    }

    public function adminExport(array $params = []): never
    {
        $tasks = (new Task())->getAdminFiltered($_GET);

        header('Content-Type: text/csv');
        header('Content-Disposition: attachment; filename="report_' . date('Y-m-d') . '.csv"');
        header('Cache-Control: no-cache');

        $out = fopen('php://output', 'w');
        fputcsv($out, ['ID', 'User', 'Project', 'Title', 'Hours', 'Status', 'Date']);

        foreach ($tasks as $t) {
            fputcsv($out, [$t['id'], $t['user_name'], $t['project_name'], $t['title'], $t['hours_spent'], $t['status'], $t['task_date']]);
        }

        fclose($out);
        exit;
    }

    public function user(array $params = []): never
    {
        $auth    = $this->authUser();
        $uid     = (int)$auth['id'];
        $filters = $_GET;
        $tasks   = new Task();

        $this->success([
            'tasks'            => $tasks->getByUserId($uid, $filters),
            'status_summary'   => $tasks->getUserStatusSummary($uid, $filters['date_from'] ?? null, $filters['date_to'] ?? null),
            'hours_by_project' => $tasks->getHoursByProject($uid),
            'weekly_summary'   => $tasks->getWeeklySummary($uid),
        ]);
    }
}
