<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/config/config.php';
error_reporting(E_ALL);
ini_set('display_errors', 1);
spl_autoload_register(function (string $class): void {
    $map = [
        'Core\\'        => APP_ROOT . '/core/',
        'App\\Controllers\\' => APP_ROOT . '/app/Controllers/',
        'App\\Models\\'      => APP_ROOT . '/app/Models/',
        'App\\Middleware\\'  => APP_ROOT . '/app/Middleware/',
    ];
    foreach ($map as $prefix => $dir) {
        if (str_starts_with($class, $prefix)) {
            $file = $dir . substr($class, strlen($prefix)) . '.php';
            if (file_exists($file)) require_once $file;
            return;
        }
    }
});

header('Content-Type: application/json; charset=utf-8');

$requestOrigin = $_SERVER['HTTP_ORIGIN'] ?? '';

if (in_array($requestOrigin, ALLOWED_ORIGINS, true)) {
    header('Access-Control-Allow-Origin: ' . $requestOrigin);
    header('Access-Control-Allow-Credentials: true');
} else {
    header('Access-Control-Allow-Origin: ' . (ALLOWED_ORIGINS[0] ?? ''));
}

header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Vary: Origin');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Max-Age: 86400');
    http_response_code(204);
    exit;
}

$router = new \Core\Router();

use App\Controllers\{AuthController, DashboardController, EntityController, ProjectController, UserManagementController, TaskController, ReportController, ProfileController, NotesController, SettingsController, SubtaskController, CommentController, TimeEntryController, FilterPresetController, PinnedProjectController, LabelController, MilestoneController, NotificationController, AnnouncementController, AuditLogController, GoalController, OrgController, TaskActivityController, SprintController, TaskWatcherController, TaskLinkController, ProjectMemberController};

$router->add('POST', '/api/auth/login', [AuthController::class, 'login']);
$router->add('GET',  '/api/auth/me',    [AuthController::class, 'me'], true);

$router->add('GET', '/api/admin/dashboard', [DashboardController::class, 'admin'], true, true);

$router->add('GET',    '/api/admin/entities',             [EntityController::class, 'index'],   true, true);
$router->add('POST',   '/api/admin/entities',             [EntityController::class, 'store'],   true, true);
$router->add('POST',   '/api/admin/entities/{id}',        [EntityController::class, 'update'],  true, true);
$router->add('DELETE', '/api/admin/entities/{id}',        [EntityController::class, 'destroy'], true, true);
$router->add('POST',   '/api/admin/entities/{id}/restore',[EntityController::class, 'restore'], true, true);

$router->add('GET',    '/api/admin/projects',             [ProjectController::class, 'index'],   true, true);
$router->add('POST',   '/api/admin/projects',             [ProjectController::class, 'store'],   true, true);
$router->add('PUT',    '/api/admin/projects/{id}',        [ProjectController::class, 'update'],  true, true);
$router->add('DELETE', '/api/admin/projects/{id}',        [ProjectController::class, 'destroy'], true, true);
$router->add('POST',   '/api/admin/projects/{id}/restore',[ProjectController::class, 'restore'], true, true);

$router->add('GET',    '/api/admin/users',                      [UserManagementController::class, 'index'],          true, true);
$router->add('POST',   '/api/admin/users',                      [UserManagementController::class, 'store'],          true, true);
$router->add('POST',   '/api/admin/users/{id}',                 [UserManagementController::class, 'update'],         true, true);
$router->add('DELETE', '/api/admin/users/{id}',                 [UserManagementController::class, 'destroy'],        true, true);
$router->add('POST',   '/api/admin/users/{id}/restore',         [UserManagementController::class, 'restore'],        true, true);
$router->add('GET',    '/api/admin/users/{id}/assignments',     [UserManagementController::class, 'getAssignments'],  true, true);
$router->add('POST',   '/api/admin/users/{id}/assignments',     [UserManagementController::class, 'assign'],          true, true);
$router->add('GET',    '/api/admin/users/{id}/entities',        [UserManagementController::class, 'getEntities'],     true, true);
$router->add('POST',   '/api/admin/users/{id}/entities',        [UserManagementController::class, 'assignEntities'],  true, true);

$router->add('GET', '/api/admin/reports',        [ReportController::class, 'admin'],       true, true);
$router->add('GET', '/api/admin/reports/export', [ReportController::class, 'adminExport'], true, true);

$router->add('GET', '/api/user/dashboard', [DashboardController::class, 'user'],         true);
$router->add('GET', '/api/user/projects',  [ProjectController::class,   'userProjects'], true);
$router->add('GET', '/api/user/reports',   [ReportController::class,    'user'],         true);
$router->add('POST','/api/user/profile',   [ProfileController::class,   'update'],       true);

$router->add('GET',    '/api/notes',      [NotesController::class, 'index'],   true);
$router->add('POST',   '/api/notes',      [NotesController::class, 'store'],   true);
$router->add('PUT',    '/api/notes/{id}', [NotesController::class, 'update'],  true);
$router->add('DELETE', '/api/notes/{id}', [NotesController::class, 'destroy'], true);

$router->add('GET',  '/api/admin/settings', [SettingsController::class, 'index'],  true, true);
$router->add('POST', '/api/admin/settings', [SettingsController::class, 'update'], true, true);

$router->add('GET',  '/api/admin/mail-settings',      [SettingsController::class, 'mailIndex'],  true, true);
$router->add('POST', '/api/admin/mail-settings',      [SettingsController::class, 'mailUpdate'], true, true);
$router->add('POST', '/api/admin/mail-settings/test', [SettingsController::class, 'mailTest'],   true, true);

$router->add('GET', '/api/settings', [SettingsController::class, 'index'], false);

$router->add('GET',    '/api/tasks',                          [TaskController::class, 'index'],         true);
$router->add('POST',   '/api/tasks',                          [TaskController::class, 'store'],         true);
$router->add('POST',   '/api/tasks/bulk',                     [TaskController::class, 'bulkStore'],     true);
$router->add('POST',   '/api/tasks/spawn-recurring',          [TaskController::class, 'spawnRecurring'],true, true);
$router->add('PUT',    '/api/tasks/{id}',                     [TaskController::class, 'update'],        true);
$router->add('DELETE', '/api/tasks/{id}',                     [TaskController::class, 'destroy'],       true);
$router->add('POST',   '/api/tasks/{id}/restore',             [TaskController::class, 'restore'],       true);

$router->add('GET',    '/api/tasks/{task_id}/subtasks',       [SubtaskController::class, 'index'],   true);
$router->add('POST',   '/api/tasks/{task_id}/subtasks',       [SubtaskController::class, 'store'],   true);
$router->add('PUT',    '/api/subtasks/{id}',                  [SubtaskController::class, 'update'],  true);
$router->add('DELETE', '/api/subtasks/{id}',                  [SubtaskController::class, 'destroy'], true);
$router->add('POST',   '/api/tasks/{task_id}/subtasks/reorder',[SubtaskController::class, 'reorder'],true);

$router->add('GET',    '/api/tasks/{task_id}/comments',       [CommentController::class, 'index'],   true);
$router->add('POST',   '/api/tasks/{task_id}/comments',       [CommentController::class, 'store'],   true);
$router->add('PUT',    '/api/comments/{id}',                  [CommentController::class, 'update'],  true);
$router->add('DELETE', '/api/comments/{id}',                  [CommentController::class, 'destroy'], true);

$router->add('GET',    '/api/timer/active',                   [TimeEntryController::class, 'active'], true);
$router->add('POST',   '/api/tasks/{task_id}/timer/start',    [TimeEntryController::class, 'start'],  true);
$router->add('POST',   '/api/timer/stop',                     [TimeEntryController::class, 'stop'],   true);
$router->add('GET',    '/api/tasks/{task_id}/timer/entries',  [TimeEntryController::class, 'entries'],true);

$router->add('GET',    '/api/filter-presets',                 [FilterPresetController::class, 'index'],   true);
$router->add('POST',   '/api/filter-presets',                 [FilterPresetController::class, 'store'],   true);
$router->add('DELETE', '/api/filter-presets/{id}',            [FilterPresetController::class, 'destroy'], true);

$router->add('GET',    '/api/pinned-projects',                [PinnedProjectController::class, 'index'], true);
$router->add('POST',   '/api/pinned-projects/{id}/pin',       [PinnedProjectController::class, 'pin'],   true);
$router->add('DELETE', '/api/pinned-projects/{id}/unpin',     [PinnedProjectController::class, 'unpin'], true);

// Labels
$router->add('GET',    '/api/labels',        [LabelController::class, 'index'],   true);
$router->add('POST',   '/api/labels',        [LabelController::class, 'store'],   true);
$router->add('PUT',    '/api/labels/{id}',   [LabelController::class, 'update'],  true);
$router->add('DELETE', '/api/labels/{id}',   [LabelController::class, 'destroy'], true);

// Milestones
$router->add('GET',    '/api/projects/{project_id}/milestones',     [MilestoneController::class, 'index'],   true);
$router->add('POST',   '/api/projects/{project_id}/milestones',     [MilestoneController::class, 'store'],   true);
$router->add('PUT',    '/api/milestones/{id}',                      [MilestoneController::class, 'update'],  true);
$router->add('DELETE', '/api/milestones/{id}',                      [MilestoneController::class, 'destroy'], true);

// Notifications
$router->add('GET',  '/api/notifications',            [NotificationController::class, 'index'],      true);
$router->add('POST', '/api/notifications/{id}/read',  [NotificationController::class, 'markRead'],   true);
$router->add('POST', '/api/notifications/read-all',   [NotificationController::class, 'markAllRead'],true);

// Announcements
$router->add('GET',    '/api/announcements',              [AnnouncementController::class, 'index'],    true);
$router->add('POST',   '/api/admin/announcements',        [AnnouncementController::class, 'store'],    true, true);
$router->add('DELETE', '/api/admin/announcements/{id}',   [AnnouncementController::class, 'destroy'],  true, true);
$router->add('POST',   '/api/announcements/{id}/read',    [AnnouncementController::class, 'markRead'], true);

// Audit Log
$router->add('GET', '/api/admin/audit-log', [AuditLogController::class, 'index'], true, true);

// Goals / OKRs
$router->add('GET',    '/api/goals',                         [GoalController::class, 'index'],           true);
$router->add('POST',   '/api/goals',                         [GoalController::class, 'store'],           true);
$router->add('PUT',    '/api/goals/{id}',                    [GoalController::class, 'update'],          true);
$router->add('DELETE', '/api/goals/{id}',                    [GoalController::class, 'destroy'],         true);
$router->add('PUT',    '/api/key-results/{kr_id}',           [GoalController::class, 'updateKeyResult'], true);

// Org Chart
$router->add('GET',  '/api/admin/org-chart',                    [OrgController::class, 'tree'],       true, true);
$router->add('POST', '/api/admin/users/{user_id}/set-manager',  [OrgController::class, 'setManager'], true, true);

// Task Activity
$router->add('GET', '/api/tasks/{task_id}/activity', [TaskActivityController::class, 'index'], true);

// Project Members
$router->add('GET',    '/api/admin/projects/{project_id}/members',            [ProjectMemberController::class, 'index'],     true, true);
$router->add('POST',   '/api/admin/projects/{project_id}/members',            [ProjectMemberController::class, 'store'],     true, true);
$router->add('DELETE', '/api/admin/projects/{project_id}/members/{user_id}',  [ProjectMemberController::class, 'destroy'],   true, true);
$router->add('GET',    '/api/projects/{project_id}/members',                  [ProjectMemberController::class, 'userIndex'], true);

// Task Assignee
$router->add('PATCH', '/api/tasks/{task_id}/assignee', [SprintController::class, 'assignTaskMember'], true);

// Sprints
$router->add('GET',    '/api/projects/{project_id}/sprints',          [SprintController::class, 'index'],      true);
$router->add('POST',   '/api/projects/{project_id}/sprints',          [SprintController::class, 'store'],      true);
$router->add('GET',    '/api/projects/{project_id}/backlog',          [SprintController::class, 'backlog'],    true);
$router->add('GET',    '/api/sprints/{id}',                           [SprintController::class, 'show'],       true);
$router->add('PUT',    '/api/sprints/{id}',                           [SprintController::class, 'update'],     true);
$router->add('DELETE', '/api/sprints/{id}',                           [SprintController::class, 'destroy'],    true);
$router->add('POST',   '/api/sprints/{id}/tasks',                     [SprintController::class, 'assignTask'], true);
$router->add('DELETE', '/api/sprints/{sprint_id}/tasks/{task_id}',    [SprintController::class, 'removeTask'], true);

// Task Watchers
$router->add('GET',  '/api/tasks/{task_id}/watchers',  [TaskWatcherController::class, 'index'],      true);
$router->add('POST', '/api/tasks/{task_id}/watch',     [TaskWatcherController::class, 'watch'],      true);
$router->add('GET',  '/api/tasks/{task_id}/watching',  [TaskWatcherController::class, 'isWatching'], true);

// Task Links
$router->add('GET',    '/api/tasks/{task_id}/links', [TaskLinkController::class, 'index'],   true);
$router->add('POST',   '/api/tasks/{task_id}/links', [TaskLinkController::class, 'store'],   true);
$router->add('DELETE', '/api/task-links/{id}',       [TaskLinkController::class, 'destroy'], true);

$router->dispatch($_SERVER['REQUEST_METHOD'], $_SERVER['REQUEST_URI']);
