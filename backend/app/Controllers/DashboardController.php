<?php
namespace App\Controllers;

use App\Models\{User, Entity, Project, Task};
use Core\Controller;

class DashboardController extends Controller
{
    public function admin(array $params = []): never
    {
        $users    = new User();
        $entities = new Entity();
        $projects = new Project();
        $tasks    = new Task();

        $this->success([
            'stats' => [
                'entities'    => $entities->count(),
                'projects'    => $projects->count(),
                'users'       => $users->count(['role' => 'user']),
                'tasks_today' => $tasks->getTodayCount(),
            ],
            'deadline_alerts'     => $projects->getDeadlineAlerts(),
            'user_activity_table' => $users->getUserActivityTable(),
            'recent_tasks'        => $tasks->getAdminFiltered(['date_from' => date('Y-m-d', strtotime('-7 days'))]),
        ]);
    }

    public function user(array $params = []): never
    {
        $auth   = $this->authUser();
        $uid    = (int)$auth['id'];
        $users  = new User();
        $proj   = new Project();
        $tasks  = new Task();

        $this->success([
            'streak'         => $users->getTaskStreak($uid),
            'weekly_summary' => $tasks->getWeeklySummary($uid),
            'projects'       => $proj->getByUserId($uid),
            'recent_tasks'   => $tasks->getByUserId($uid, ['date_from' => date('Y-m-d', strtotime('-7 days'))]),
        ]);
    }
}
