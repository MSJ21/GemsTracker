import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { ArrowLeft, Building2, FolderKanban, CheckSquare, Clock, TrendingUp, Users } from 'lucide-react';
import { entitiesApi } from '@/api/entities';
import { projectsApi } from '@/api/projects';
import { tasksApi } from '@/api/tasks';
import { Badge, projectStatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardBody, CardTitle } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { PageSpinner } from '@/components/ui/Spinner';
import { Avatar } from '@/components/shared/Avatar';
import { AvatarGroup } from '@/components/shared/AvatarGroup';
import { formatDate, progressPercent, isOverdue, formatHours } from '@/utils/helpers';

export default function EntityViewPage() {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();
  const entityId = Number(id);
  const { track } = useRecentlyViewed();

  const { data: entityData, isLoading: eLoading } = useQuery({
    queryKey: ['entities'],
    queryFn:  () => entitiesApi.list().then(r => r.data),
  });

  const { data: projData, isLoading: pLoading } = useQuery({
    queryKey: ['admin-projects'],
    queryFn:  () => projectsApi.list().then(r => r.data),
  });

  const projects = (projData?.projects ?? []).filter(p => p.entity_id === entityId);
  const projIds  = projects.map(p => p.id);

  // Fetch tasks for all projects in this entity to derive team members
  const { data: allTasks, isLoading: tLoading } = useQuery({
    queryKey: ['entity-tasks', entityId],
    queryFn:  async () => {
      const results = await Promise.all(projIds.map(pid => tasksApi.list({ project_id: String(pid) }).then(r => r.data)));
      return results.flat();
    },
    enabled: projIds.length > 0,
  });

  const entity = entityData?.entities.find(e => e.id === entityId);

  useEffect(() => {
    if (entity) track({ type: 'entity', id: entity.id, name: entity.name });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entity?.id]);

  if (eLoading || pLoading || tLoading) return <PageSpinner />;

  if (!entity) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Building2 className="mb-3 h-12 w-12 text-slate-300" />
        <p className="text-slate-500">Entity not found</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate(-1)}>Go back</Button>
      </div>
    );
  }

  const tasks = allTasks ?? [];

  // Derive unique team members from tasks
  const userMap = new Map<number, { id: number; name: string; avatar: null; taskCount: number; hours: number }>();
  for (const t of tasks) {
    const prev = userMap.get(t.user_id) ?? { id: t.user_id, name: t.user_name ?? 'Unknown', avatar: null, taskCount: 0, hours: 0 };
    userMap.set(t.user_id, { ...prev, taskCount: prev.taskCount + 1, hours: prev.hours + Number(t.hours_spent) });
  }
  const teamMembers = [...userMap.values()].sort((a, b) => b.taskCount - a.taskCount);

  const totalTasks = projects.reduce((s, p) => s + (p.total_tasks ?? 0), 0);
  const doneTasks  = projects.reduce((s, p) => s + (p.done_tasks ?? 0), 0);
  const totalHours = projects.reduce((s, p) => s + (p.total_hours ?? 0), 0);
  const activeProj = projects.filter(p => p.status === 'active').length;

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link to="/admin/entities" className="flex items-center gap-1 hover:text-primary-600 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Entities
        </Link>
        <span>/</span>
        <span className="font-medium text-slate-700 dark:text-slate-300">{entity.name}</span>
      </div>

      {/* Entity header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          {entity.logo ? (
            <img src={entity.logo} alt={entity.name} className="h-16 w-16 rounded-2xl object-cover shadow-md" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-violet-600 shadow-md">
              <Building2 className="h-8 w-8 text-white" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{entity.name}</h1>
              <Badge variant={entity.status === 'active' ? 'green' : 'gray'}>{entity.status}</Badge>
            </div>
            {entity.description && <p className="mt-1 text-sm text-slate-500">{entity.description}</p>}
            <p className="mt-1 text-xs text-slate-400">Created {formatDate(entity.created_at)}</p>
            {teamMembers.length > 0 && (
              <div className="mt-2 flex items-center gap-2">
                <AvatarGroup people={teamMembers} max={6} size="sm" />
                <span className="text-xs text-slate-400">{teamMembers.length} team member{teamMembers.length !== 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
        </div>
        <Link to="/admin/entities">
          <Button variant="outline" size="sm">Manage Entities</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { icon: FolderKanban, label: 'Total Projects', value: projects.length,   color: 'text-primary-600' },
          { icon: TrendingUp,   label: 'Active',         value: activeProj,         color: 'text-emerald-600' },
          { icon: CheckSquare,  label: 'Tasks Done',     value: `${doneTasks}/${totalTasks}`, color: 'text-blue-600' },
          { icon: Clock,        label: 'Total Hours',    value: formatHours(totalHours),      color: 'text-amber-600' },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
              <s.icon className={`h-5 w-5 ${s.color}`} />
            </div>
            <div>
              <p className="text-xs text-slate-500">{s.label}</p>
              <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Projects table — takes 2 cols */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Projects ({projects.length})</CardTitle>
            </CardHeader>
            <CardBody className="p-0">
              {projects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <FolderKanban className="mb-3 h-10 w-10 text-slate-300" />
                  <p className="text-sm text-slate-400">No projects yet</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                  {projects.map(p => {
                    const pct     = progressPercent(p.done_tasks, p.total_tasks);
                    const overdue = isOverdue(p.end_date) && p.status !== 'completed';
                    // Users working on this project
                    const pTasks  = tasks.filter(t => t.project_id === p.id);
                    const pUsers  = [...new Map(pTasks.map(t => [t.user_id, { id: t.user_id, name: t.user_name ?? '', avatar: null }])).values()];
                    return (
                      <div key={p.id} className="px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Link to={`/admin/projects/${p.id}`} className="font-semibold text-slate-900 hover:text-primary-600 dark:text-slate-100 transition-colors">
                                {p.name}
                              </Link>
                              {projectStatusBadge(p.status)}
                            </div>
                            {p.description && <p className="text-xs text-slate-400 truncate max-w-xs">{p.description}</p>}
                          </div>
                          <span className={`text-xs font-medium ${overdue ? 'text-red-500' : 'text-slate-400'}`}>
                            {formatDate(p.end_date)}
                          </span>
                        </div>
                        <ProgressBar value={pct} showLabel color={pct === 100 ? 'green' : overdue ? 'red' : 'blue'} />
                        <div className="mt-2 flex items-center justify-between">
                          <p className="text-xs text-slate-400">{p.done_tasks ?? 0}/{p.total_tasks ?? 0} tasks</p>
                          {pUsers.length > 0 && <AvatarGroup people={pUsers} max={4} size="xs" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Team members sidebar — 1 col */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4 text-slate-400" />
              Team Members ({teamMembers.length})
            </CardTitle>
          </CardHeader>
          <CardBody className="p-0">
            {teamMembers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Users className="mb-2 h-8 w-8 text-slate-200 dark:text-slate-700" />
                <p className="text-xs text-slate-400">No members yet</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {teamMembers.map((m, i) => (
                  <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                    <span className="w-5 text-center text-xs font-bold text-slate-300">#{i + 1}</span>
                    <Avatar name={m.name} avatar={m.avatar} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{m.name}</p>
                      <p className="text-xs text-slate-400">{m.taskCount} tasks · {formatHours(m.hours)}</p>
                    </div>
                    {/* workload bar */}
                    <div className="w-16">
                      <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className="h-full rounded-full bg-primary-500"
                          style={{ width: `${Math.min(100, (m.taskCount / (teamMembers[0]?.taskCount || 1)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
