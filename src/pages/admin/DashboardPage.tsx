import { useQuery } from '@tanstack/react-query';
import { Building2, FolderKanban, Users, ClipboardList, AlertTriangle, Calendar } from 'lucide-react';
import { dashboardApi } from '@/api/dashboard';
import { StatCard } from '@/components/shared/StatCard';
import { GreetingWidget } from '@/components/shared/GreetingWidget';
import { MiniCalendar } from '@/components/shared/MiniCalendar';
import { NotesWidget } from '@/components/shared/NotesWidget';
import { RecentlyViewedWidget } from '@/components/shared/RecentlyViewedWidget';
import { PomodoroWidget } from '@/components/shared/PomodoroWidget';
import { PinnedProjectsWidget } from '@/components/shared/PinnedProjectsWidget';
import { Card, CardHeader, CardBody, CardTitle } from '@/components/ui/Card';
import { taskStatusBadge, projectStatusBadge } from '@/components/ui/Badge';
import { Avatar } from '@/components/shared/Avatar';
import { PageSpinner } from '@/components/ui/Spinner';
import { useAuthStore } from '@/store/authStore';
import { formatDate, formatHours } from '@/utils/helpers';
import type { UserActivity } from '@/types';

export default function AdminDashboardPage() {
  const { user } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn:  () => dashboardApi.admin().then(r => r.data),
    refetchInterval: 60_000,
  });

  if (isLoading || !data) return <PageSpinner />;

  const taskDates = data.recent_tasks.map(t => t.task_date);

  return (
    <div className="flex flex-col gap-6">
      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Entities"  value={data.stats.entities}    icon={Building2}    color="blue"   />
        <StatCard label="Active Projects" value={data.stats.projects}    icon={FolderKanban} color="green"  />
        <StatCard label="Team Members"    value={data.stats.users}       icon={Users}        color="purple" />
        <StatCard label="Tasks Today"     value={data.stats.tasks_today} icon={ClipboardList} color="amber" />
      </div>

      {/* Overdue alerts */}
      {data.deadline_alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="h-4 w-4" />
              Overdue Projects ({data.deadline_alerts.length})
            </CardTitle>
          </CardHeader>
          <CardBody className="p-0">
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {data.deadline_alerts.map(p => (
                <div key={p.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{p.name}</p>
                    <p className="text-xs text-slate-500">{p.entity_name}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-xs text-red-500">
                      <Calendar className="h-3 w-3" />
                      {formatDate(p.end_date)}
                    </div>
                    {projectStatusBadge(p.status)}
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* User Activity + Recent Tasks */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>User Activity</CardTitle>
          </CardHeader>
          <CardBody className="p-0">
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {data.user_activity_table.map((u: UserActivity) => (
                <div key={u.id} className="flex items-center gap-3 px-5 py-3">
                  <Avatar name={u.name} avatar={u.avatar} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{u.name}</p>
                    <p className="text-xs text-slate-400">{u.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{u.total_tasks}</p>
                    <p className="text-xs text-slate-400">{formatHours(u.total_hours)}</p>
                  </div>
                </div>
              ))}
              {data.user_activity_table.length === 0 && (
                <p className="px-5 py-8 text-center text-sm text-slate-400">No activity yet</p>
              )}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Tasks</CardTitle>
          </CardHeader>
          <CardBody className="p-0">
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {data.recent_tasks.slice(0, 10).map(t => (
                <div key={t.id} className="flex items-start justify-between px-5 py-3">
                  <div className="flex-1 min-w-0 pr-3">
                    <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{t.title}</p>
                    <p className="text-xs text-slate-400">{t.project_name} · {t.user_name}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {taskStatusBadge(t.status)}
                    <span className="text-xs text-slate-400">{formatHours(t.hours_spent)}</span>
                  </div>
                </div>
              ))}
              {data.recent_tasks.length === 0 && (
                <p className="px-5 py-8 text-center text-sm text-slate-400">No tasks this week</p>
              )}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Recently Viewed */}
      <RecentlyViewedWidget />

      {/* Pinned Projects */}
      <PinnedProjectsWidget />

      {/* Greeting + Calendar + Pomodoro */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <GreetingWidget name={user?.name} />
        </div>
        <MiniCalendar highlightDates={taskDates} />
      </div>

      {/* Notes + Pomodoro */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <NotesWidget />
        </div>
        <PomodoroWidget />
      </div>
    </div>
  );
}
