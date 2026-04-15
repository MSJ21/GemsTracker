import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Flame, TrendingUp, Clock, CheckSquare, Plus, Calendar, BookOpen, Bug, SquareCheck, Crown } from 'lucide-react';
import { dashboardApi } from '@/api/dashboard';
import { tasksApi } from '@/api/tasks';
import { projectsApi } from '@/api/projects';
import { useAuthStore } from '@/store/authStore';
import { useToastStore } from '@/store/toastStore';
import { useTaskStatuses } from '@/hooks/useTaskStatuses';
import { StatCard } from '@/components/shared/StatCard';
import { GreetingWidget } from '@/components/shared/GreetingWidget';
import { MiniCalendar } from '@/components/shared/MiniCalendar';
import { NotesWidget } from '@/components/shared/NotesWidget';
import { PomodoroWidget } from '@/components/shared/PomodoroWidget';
import { Card, CardHeader, CardBody, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { PageSpinner } from '@/components/ui/Spinner';
import { taskStatusBadge } from '@/components/ui/Badge';
import { formatDate, formatHours, progressPercent, isOverdue } from '@/utils/helpers';

const schema = z.object({
  project_id:  z.string().min(1, 'Project required'),
  title:       z.string().min(1, 'Title required'),
  description: z.string().optional(),
  hours_spent: z.coerce.number().min(0).max(24),
  status:      z.string(),
  priority:    z.string(),
  issue_type:  z.string(),
  task_date:   z.string(),
  due_date:    z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const ISSUE_TYPE_OPTIONS = [
  { value: 'task',  label: '☑  Task',  Icon: SquareCheck, color: 'text-blue-500',    bg: 'bg-blue-50 dark:bg-blue-900/20',    border: 'border-blue-300' },
  { value: 'story', label: '📖 Story', Icon: BookOpen,    color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-300' },
  { value: 'bug',   label: '🐛 Bug',   Icon: Bug,         color: 'text-red-500',     bg: 'bg-red-50 dark:bg-red-900/20',      border: 'border-red-300' },
  { value: 'epic',  label: '👑 Epic',  Icon: Crown,       color: 'text-violet-600',  bg: 'bg-violet-50 dark:bg-violet-900/20',border: 'border-violet-300' },
];

export default function UserDashboardPage() {
  const qc           = useQueryClient();
  const { user }     = useAuthStore();
  const { push }     = useToastStore();
  const { options: statusOptions } = useTaskStatuses();
  const [taskModal, setTaskModal] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['user-dashboard'],
    queryFn:  () => dashboardApi.user().then(r => r.data),
    staleTime: 2 * 60 * 1000,
    refetchInterval: 60_000,
  });

  const { data: projData } = useQuery({
    queryKey: ['user-projects'],
    queryFn:  () => projectsApi.userProjects().then(r => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { status: 'pending', priority: 'medium', issue_type: 'task', task_date: new Date().toISOString().split('T')[0], hours_spent: 0 },
  });
  const selectedIssueType = watch('issue_type');

  const createTask = useMutation({
    mutationFn: (d: FormData) => tasksApi.create({ ...d, project_id: Number(d.project_id), due_date: d.due_date || null }),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['user-dashboard'] });
      qc.invalidateQueries({ queryKey: ['user-tasks'] });
      push('Task logged', 'success');
      setTaskModal(false);
      reset({ status: 'pending', task_date: new Date().toISOString().split('T')[0], hours_spent: 0 });
    },
    onError: (e: unknown) => push((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed', 'error'),
  });

  if (isLoading || !data) return <PageSpinner />;

  const projects    = projData ?? data.projects;
  const projOptions = projects.map(p => ({ value: String(p.id), label: p.name }));
  const { weekly_summary: ws } = data;

  // Highlight task dates on calendar
  const taskDates = data.recent_tasks.map(t => t.task_date);

  return (
    <div className="flex flex-col gap-6">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Dashboard</h2>
        <Button size="sm" onClick={() => setTaskModal(true)}>
          <Plus className="h-4 w-4" /> Log Task
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Task Streak"      value={`${data.streak} day${data.streak !== 1 ? 's' : ''}`} icon={Flame}        color="amber" />
        <StatCard label="This Week"        value={ws.this_week_tasks ?? 0}             icon={CheckSquare} color="blue"  trend={`Last week: ${ws.last_week_tasks ?? 0}`} />
        <StatCard label="Hours This Week"  value={formatHours(ws.this_week_hours ?? 0)} icon={Clock}       color="green" />
        <StatCard label="Projects"         value={data.projects.length}                 icon={TrendingUp}  color="purple" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>My Projects</CardTitle></CardHeader>
          <CardBody className="flex flex-col gap-3 p-4">
            {data.projects.length === 0 && <p className="text-sm text-slate-400">No projects assigned</p>}
            {data.projects.map(p => {
              const pct = progressPercent(p.done_tasks, p.total_tasks);
              return (
                <div key={p.id} className="rounded-xl border border-slate-100 p-4 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{p.name}</p>
                      <p className="text-xs text-slate-400">{p.entity_name}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 text-xs text-slate-400">
                      <Calendar className="h-3 w-3" />
                      <span className={isOverdue(p.end_date) && p.status !== 'completed' ? 'text-red-500 font-medium' : ''}>
                        {formatDate(p.end_date)}
                      </span>
                    </div>
                  </div>
                  <ProgressBar value={pct} showLabel color={pct === 100 ? 'green' : isOverdue(p.end_date) ? 'red' : 'blue'} />
                  <p className="mt-1 text-xs text-slate-400">{p.done_tasks ?? 0} of {p.total_tasks ?? 0} tasks · {formatHours(p.total_hours ?? 0)}</p>
                </div>
              );
            })}
          </CardBody>
        </Card>

        <Card>
          <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
          <CardBody className="p-0">
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {data.recent_tasks.map(t => (
                <div key={t.id} className="flex items-start justify-between px-5 py-3">
                  <div className="flex-1 min-w-0 pr-3">
                    <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{t.title}</p>
                    <p className="text-xs text-slate-400">{t.project_name} · {formatDate(t.task_date)}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {taskStatusBadge(t.status)}
                    <span className="text-xs text-slate-400">{formatHours(t.hours_spent)}</span>
                  </div>
                </div>
              ))}
              {data.recent_tasks.length === 0 && (
                <p className="px-5 py-8 text-center text-sm text-slate-400">No recent tasks</p>
              )}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Greeting + Calendar + Pomodoro */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <GreetingWidget name={user?.name} />
        </div>
        <MiniCalendar highlightDates={taskDates} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <NotesWidget />
        </div>
        <PomodoroWidget />
      </div>

      <Modal
        open={taskModal}
        onClose={() => { setTaskModal(false); reset({ status: 'pending', priority: 'medium', issue_type: 'task', task_date: new Date().toISOString().split('T')[0], hours_spent: 0 }); }}
        title="Log Task"
        size="lg"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setTaskModal(false)}>Cancel</Button>
            <Button size="sm" loading={isSubmitting} onClick={handleSubmit(d => createTask.mutate(d))}>Log Task</Button>
          </>
        }
      >
        <form className="flex flex-col gap-4">
          {/* Issue type selector */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Issue Type</p>
            <div className="flex gap-2 flex-wrap">
              {ISSUE_TYPE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setValue('issue_type', opt.value)}
                  className={`flex items-center gap-1.5 rounded-lg border-2 px-3 py-1.5 text-sm font-medium transition-all ${
                    selectedIssueType === opt.value
                      ? `${opt.border} ${opt.bg} ${opt.color}`
                      : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <Select label="Project" required options={projOptions} placeholder="Select project" error={errors.project_id?.message} {...register('project_id')} />
          <Input label="Title" required error={errors.title?.message} {...register('title')} />
          <Textarea label="Description" rows={2} {...register('description')} />

          <div className="grid grid-cols-2 gap-3">
            <Select label="Status"   options={statusOptions}  {...register('status')} />
            <Select label="Priority" options={[
              { value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' }, { value: 'critical', label: 'Critical' },
            ]} {...register('priority')} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input label="Hours" type="number" step="0.5" min="0" max="24" error={errors.hours_spent?.message} {...register('hours_spent')} />
            <Input label="Task Date" type="date" {...register('task_date')} />
            <Input label="Due Date"  type="date" {...register('due_date')} />
          </div>
        </form>
      </Modal>
    </div>
  );
}
