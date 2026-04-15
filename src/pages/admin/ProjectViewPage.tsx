import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, FolderKanban, CheckSquare, Clock, AlertTriangle,
  TrendingUp, Users, UserCog, Plus, Trash2, Crown, User,
} from 'lucide-react';
import { projectsApi } from '@/api/projects';
import { tasksApi } from '@/api/tasks';
import { usersApi } from '@/api/users';
import { membersApi, type ProjectMember } from '@/api/members';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { projectStatusBadge, taskStatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Card, CardHeader, CardBody, CardTitle } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { PageSpinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/shared/Avatar';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { useToastStore } from '@/store/toastStore';
import { formatDate, formatHours, progressPercent, isOverdue, daysUntil, avatarUrl } from '@/utils/helpers';
import { cn } from '@/utils/helpers';

type Tab = 'overview' | 'tasks' | 'members';

/* ─── Members tab ─────────────────────────────────────────────────── */
function MembersTab({ projectId }: { projectId: number }) {
  const qc    = useQueryClient();
  const toast = useToastStore();
  const [addOpen, setAddOpen]         = useState(false);
  const [removeTarget, setRemoveTarget] = useState<ProjectMember | null>(null);
  const [userId, setUserId]           = useState('');
  const [role, setRole]               = useState<'manager' | 'member'>('member');

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['project-members', projectId],
    queryFn:  () => membersApi.list(projectId).then(r => r.data ?? []),
  });

  const { data: usersData } = useQuery({
    queryKey: ['users-list'],
    queryFn:  () => usersApi.list().then(r => r.data?.users ?? []),
  });

  const existingIds = new Set((members as ProjectMember[]).map(m => m.user_id));
  const availableUsers = (usersData ?? []).filter((u: { id: number }) => !existingIds.has(u.id));
  const userOptions = [
    { value: '', label: '— Select user —' },
    ...availableUsers.map((u: { id: number; name: string }) => ({ value: String(u.id), label: u.name })),
  ];

  const addMut = useMutation({
    mutationFn: () => membersApi.upsert(projectId, Number(userId), role),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project-members', projectId] });
      setAddOpen(false); setUserId(''); setRole('member');
      toast.push('Member added', 'success');
    },
    onError: (e: Error) => toast.push(e.message, 'error'),
  });

  const removeMut = useMutation({
    mutationFn: (uid: number) => membersApi.remove(projectId, uid),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['project-members', projectId] }); toast.push('Member removed', 'success'); setRemoveTarget(null); },
    onError: (e: Error) => toast.push(e.message, 'error'),
  });

  const changRoleMut = useMutation({
    mutationFn: ({ uid, r }: { uid: number; r: 'manager' | 'member' }) => membersApi.upsert(projectId, uid, r),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['project-members', projectId] }); toast.push('Role updated', 'success'); },
    onError: (e: Error) => toast.push(e.message, 'error'),
  });

  const managers = (members as ProjectMember[]).filter(m => m.role === 'manager');
  const devs     = (members as ProjectMember[]).filter(m => m.role === 'member');

  return (
    <div className="space-y-6">
      {/* Info banner */}
      <div className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
        <UserCog className="mt-0.5 h-5 w-5 shrink-0 text-blue-500" />
        <div className="text-sm text-blue-800 dark:text-blue-300">
          <p className="font-semibold">Project Roles</p>
          <p className="mt-0.5 text-xs">
            <strong>Managers</strong> can create sprints, assign tasks to team members, and manage the sprint board.
            <strong> Members</strong> work on tasks and update their progress.
          </p>
        </div>
      </div>

      {/* Managers */}
      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <Crown className="h-4 w-4 text-amber-500" />
            <span className="font-semibold text-slate-900 dark:text-white">Project Managers</span>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
              {managers.length}
            </span>
          </div>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" /> Add Member
          </Button>
        </div>
        {isLoading ? (
          <p className="py-8 text-center text-sm text-slate-400">Loading…</p>
        ) : managers.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">No managers assigned. Add one to allow sprint creation.</p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {managers.map(m => (
              <MemberRow key={m.user_id} member={m} onRemove={() => setRemoveTarget(m)} onRoleChange={r => changRoleMut.mutate({ uid: m.user_id, r })} />
            ))}
          </div>
        )}
      </div>

      {/* Members */}
      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4 dark:border-slate-700">
          <User className="h-4 w-4 text-slate-400" />
          <span className="font-semibold text-slate-900 dark:text-white">Team Members</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-400">
            {devs.length}
          </span>
        </div>
        {devs.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">No members yet.</p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {devs.map(m => (
              <MemberRow key={m.user_id} member={m} onRemove={() => setRemoveTarget(m)} onRoleChange={r => changRoleMut.mutate({ uid: m.user_id, r })} />
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        onConfirm={() => removeTarget && removeMut.mutate(removeTarget.user_id)}
        loading={removeMut.isPending}
        title="Remove Member"
        message={`Remove ${removeTarget?.name} from this project?`}
      />

      {/* Add modal */}
      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add Project Member"
        size="sm"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button size="sm" loading={addMut.isPending} disabled={!userId} onClick={() => addMut.mutate()}>
              Add Member
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Select
            label="User"
            required
            options={userOptions}
            value={userId}
            onChange={e => setUserId(e.target.value)}
          />
          <div>
            <p className="mb-2 text-xs font-semibold text-slate-700 dark:text-slate-300">Role</p>
            <div className="flex gap-3">
              {(['manager', 'member'] as const).map(r => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={cn(
                    'flex-1 rounded-xl border px-4 py-3 text-sm font-medium transition-all',
                    role === r
                      ? 'border-primary-400 bg-primary-50 text-primary-700 dark:border-primary-600 dark:bg-primary-900/20 dark:text-primary-400'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400',
                  )}
                >
                  {r === 'manager' ? (
                    <><Crown className="mx-auto mb-1 h-5 w-5 text-amber-500" /><span>Manager</span><p className="mt-1 text-[10px] font-normal opacity-70">Can create sprints & assign tasks</p></>
                  ) : (
                    <><User className="mx-auto mb-1 h-5 w-5 text-slate-400" /><span>Member</span><p className="mt-1 text-[10px] font-normal opacity-70">Works on tasks</p></>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function MemberRow({ member, onRemove, onRoleChange }: {
  member: ProjectMember;
  onRemove: () => void;
  onRoleChange: (r: 'manager' | 'member') => void;
}) {
  const isManager = member.role === 'manager';
  return (
    <div className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/30">
      {member.avatar ? (
        <img src={avatarUrl(member.avatar)} alt={member.name} className="h-8 w-8 rounded-full object-cover" />
      ) : (
        <Avatar name={member.name} size="sm" />
      )}
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{member.name}</p>
        <p className="truncate text-xs text-slate-400">{member.email}</p>
      </div>
      <span className={cn(
        'rounded-full px-2.5 py-0.5 text-[10px] font-semibold',
        isManager
          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
          : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
      )}>
        {isManager ? 'Manager' : 'Member'}
      </span>
      <button
        onClick={() => onRoleChange(isManager ? 'member' : 'manager')}
        className="rounded-lg border border-slate-200 px-2 py-1 text-[10px] font-medium text-slate-500 hover:border-primary-300 hover:text-primary-600 dark:border-slate-700"
        title="Toggle role"
      >
        {isManager ? 'Make Member' : 'Make Manager'}
      </button>
      <button
        onClick={onRemove}
        className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/* ─── Main page ───────────────────────────────────────────────────── */
export default function ProjectViewPage() {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();
  const projId   = Number(id);
  const { track } = useRecentlyViewed();
  const [tab, setTab] = useState<Tab>('overview');

  const { data: projData, isLoading: pLoading } = useQuery({
    queryKey: ['admin-projects'],
    queryFn:  () => projectsApi.list().then(r => r.data),
  });

  const { data: taskData, isLoading: tLoading } = useQuery({
    queryKey: ['admin-project-tasks', projId],
    queryFn:  () => tasksApi.list({ project_id: String(projId) }).then(r => r.data),
    enabled:  !!projId,
  });

  const project = projData?.projects.find(p => p.id === projId);

  useEffect(() => {
    if (project) { track({ type: 'project', id: project.id, name: project.name, sub: project.entity_name }); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.id]);

  if (pLoading || tLoading) { return <PageSpinner />; }

  const tasks = taskData ?? [];

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <FolderKanban className="mb-3 h-12 w-12 text-slate-300" />
        <p className="text-slate-500">Project not found</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate(-1)}>Go back</Button>
      </div>
    );
  }

  const pct      = progressPercent(project.done_tasks, project.total_tasks);
  const overdue  = isOverdue(project.end_date) && project.status !== 'completed';
  const days     = daysUntil(project.end_date);

  const pending    = tasks.filter(t => t.status === 'pending').length;
  const inProgress = tasks.filter(t => t.status === 'in-progress').length;
  const done       = tasks.filter(t => t.status === 'done').length;

  const memberMap = new Map<number, { id: number; name: string; avatar: null; taskCount: number; hours: number }>();
  for (const t of tasks) {
    const prev = memberMap.get(t.user_id) ?? { id: t.user_id, name: t.user_name ?? 'Unknown', avatar: null, taskCount: 0, hours: 0 };
    memberMap.set(t.user_id, { ...prev, taskCount: prev.taskCount + 1, hours: prev.hours + Number(t.hours_spent) });
  }
  const teamMembers = [...memberMap.values()].sort((a, b) => b.taskCount - a.taskCount);

  const TABS: { key: Tab; label: string; icon: typeof Users }[] = [
    { key: 'overview', label: 'Overview', icon: TrendingUp },
    { key: 'tasks',    label: `Tasks (${tasks.length})`, icon: CheckSquare },
    { key: 'members',  label: 'Members & Roles', icon: UserCog },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link to="/admin/projects" className="flex items-center gap-1 hover:text-primary-600 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Projects
        </Link>
        <span>/</span>
        <span className="font-medium text-slate-700 dark:text-slate-300">{project.name}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md">
            <FolderKanban className="h-7 w-7 text-white" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{project.name}</h1>
              {projectStatusBadge(project.status)}
              {overdue && (
                <span className="flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600 dark:bg-red-900/30 dark:text-red-400">
                  <AlertTriangle className="h-3 w-3" /> Overdue
                </span>
              )}
            </div>
            <p className="mt-0.5 text-sm text-slate-400">{project.entity_name}</p>
            {project.description && <p className="mt-1 text-sm text-slate-500">{project.description}</p>}
          </div>
        </div>
        <Link to="/admin/projects">
          <Button variant="outline" size="sm">All Projects</Button>
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { icon: CheckSquare,   label: 'Tasks Done',  value: `${project.done_tasks ?? 0}/${project.total_tasks ?? 0}`, color: 'text-emerald-600' },
          { icon: Clock,         label: 'Total Hours', value: formatHours(project.total_hours ?? 0),                     color: 'text-blue-600' },
          { icon: TrendingUp,    label: 'Progress',    value: `${pct}%`,                                                  color: 'text-primary-600' },
          { icon: AlertTriangle, label: days !== null && days >= 0 ? 'Days Left' : 'Days Overdue', value: days !== null ? Math.abs(days) : '—', color: overdue ? 'text-red-600' : 'text-amber-600' },
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

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-medium transition-colors',
              tab === t.key
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300',
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'overview' && (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Progress Overview</CardTitle></CardHeader>
              <CardBody className="flex flex-col gap-4">
                <ProgressBar value={pct} showLabel color={pct === 100 ? 'green' : overdue ? 'red' : 'blue'} />
                <div className="grid grid-cols-3 gap-3 text-center">
                  {[
                    { label: 'Pending',     count: pending,    cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
                    { label: 'In Progress', count: inProgress, cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
                    { label: 'Done',        count: done,       cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
                  ].map(s => (
                    <div key={s.label} className={`rounded-xl p-3 ${s.cls}`}>
                      <p className="text-2xl font-bold">{s.count}</p>
                      <p className="text-xs font-medium">{s.label}</p>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader><CardTitle>Timeline</CardTitle></CardHeader>
              <CardBody className="flex flex-col gap-3">
                {[
                  { label: 'Start Date', value: formatDate(project.start_date), highlight: false },
                  { label: 'End Date',   value: formatDate(project.end_date),   highlight: overdue },
                  { label: 'Created',    value: formatDate(project.created_at),  highlight: false },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800">
                    <span className="text-sm text-slate-500">{row.label}</span>
                    <span className={`text-sm font-medium ${row.highlight ? 'text-red-500' : 'text-slate-700 dark:text-slate-300'}`}>{row.value}</span>
                  </div>
                ))}
                {days !== null && (
                  <div className={`flex items-center justify-between rounded-xl px-4 py-3 ${overdue ? 'bg-red-50 dark:bg-red-900/20' : 'bg-emerald-50 dark:bg-emerald-900/20'}`}>
                    <span className="text-sm text-slate-500">{overdue ? 'Overdue by' : 'Days remaining'}</span>
                    <span className={`text-sm font-bold ${overdue ? 'text-red-600' : 'text-emerald-600'}`}>{Math.abs(days)} days</span>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>

          {teamMembers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-slate-400" />
                  Working on this Project ({teamMembers.length})
                </CardTitle>
              </CardHeader>
              <CardBody className="p-0">
                <div className="grid divide-y divide-slate-100 dark:divide-slate-700 sm:grid-cols-2 sm:divide-y-0 sm:divide-x">
                  {teamMembers.map((m, i) => (
                    <div key={m.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <span className="w-5 text-center text-xs font-bold text-slate-300">#{i + 1}</span>
                      <Avatar name={m.name} avatar={m.avatar} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{m.name}</p>
                        <p className="text-xs text-slate-400">{m.taskCount} task{m.taskCount !== 1 ? 's' : ''} · {formatHours(m.hours)}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{Math.round((m.taskCount / tasks.length) * 100)}%</span>
                        <div className="h-1.5 w-16 rounded-full bg-slate-100 dark:bg-slate-800">
                          <div className="h-full rounded-full bg-primary-500 transition-all" style={{ width: `${Math.round((m.taskCount / tasks.length) * 100)}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      )}

      {tab === 'tasks' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Tasks ({tasks.length})</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="amber">{pending} pending</Badge>
                <Badge variant="blue">{inProgress} in-progress</Badge>
                <Badge variant="green">{done} done</Badge>
              </div>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            {tasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <CheckSquare className="mb-3 h-10 w-10 text-slate-300" />
                <p className="text-sm text-slate-400">No tasks yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
                      {['Task', 'Reporter', 'Assignee', 'Hours', 'Status', 'Date'].map(h => (
                        <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {tasks.map(t => (
                      <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="px-5 py-3">
                          <p className="font-medium text-slate-900 dark:text-slate-100 max-w-xs truncate">{t.title}</p>
                          {t.story_points != null && (
                            <span className="mt-0.5 inline-block rounded-full bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
                              {t.story_points} SP
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-slate-500">{t.user_name ?? '—'}</td>
                        <td className="px-5 py-3 text-slate-500">{t.assignee_name ?? <span className="text-slate-300">Unassigned</span>}</td>
                        <td className="px-5 py-3 text-slate-600">{formatHours(t.hours_spent)}</td>
                        <td className="px-5 py-3">{taskStatusBadge(t.status)}</td>
                        <td className="px-5 py-3 text-xs text-slate-400">{formatDate(t.task_date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {tab === 'members' && <MembersTab projectId={projId} />}
    </div>
  );
}
