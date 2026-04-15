import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { projectsApi } from '@/api/projects';
import { tasksApi } from '@/api/tasks';
import { sprintsApi } from '@/api/sprints';
import { Select } from '@/components/ui/Select';
import { Map, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/utils/helpers';
import type { Task } from '@/types';

const PRIORITY_COLOR: Record<string, string> = {
  critical: 'bg-red-500',
  high:     'bg-orange-400',
  medium:   'bg-blue-400',
  low:      'bg-slate-400',
};

const STATUS_COLOR: Record<string, string> = {
  'pending':     'bg-slate-400',
  'in-progress': 'bg-blue-500',
  'done':        'bg-emerald-500',
};

function weeksBetween(a: Date, b: Date) {
  return Math.ceil((b.getTime() - a.getTime()) / (7 * 86400000));
}

function startOfWeek(d: Date) {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  c.setDate(c.getDate() - c.getDay() + 1);
  return c;
}

const COL_W = 48; // px per week column
const ROW_H = 38;

/* ── Page ─────────────────────────────────────────────────────────── */
export default function RoadmapPage() {
  const [projectId, setProjectId] = useState<number | null>(null);
  const [viewType, setViewType]   = useState<'tasks' | 'sprints'>('tasks');
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: projects = [] } = useQuery({
    queryKey: ['user-projects'],
    queryFn: () => projectsApi.userProjects().then(r => r.data ?? []),
  });
  const selectedPid = projectId ?? (projects[0]?.id ?? null);

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', { project_id: selectedPid }],
    queryFn: () => tasksApi.list({ project_id: String(selectedPid!) }).then(r => r.data ?? []),
    enabled: !!selectedPid && viewType === 'tasks',
  });

  const { data: sprints = [] } = useQuery({
    queryKey: ['sprints', selectedPid],
    queryFn: () => sprintsApi.list(selectedPid!).then(r => r.data ?? []),
    enabled: !!selectedPid && viewType === 'sprints',
  });

  // Determine timeline range
  const today = new Date();
  const allDates: Date[] = [];

  if (viewType === 'tasks') {
    (tasks as Task[]).forEach(t => {
      if (t.task_date) { allDates.push(new Date(t.task_date)); }
      if (t.due_date)  { allDates.push(new Date(t.due_date)); }
    });
  } else {
    (sprints as { start_date: string | null; end_date: string | null }[]).forEach(s => {
      if (s.start_date) { allDates.push(new Date(s.start_date)); }
      if (s.end_date)   { allDates.push(new Date(s.end_date)); }
    });
  }

  const minDate = allDates.length ? new Date(Math.min(...allDates.map(d => d.getTime()))) : today;
  const maxDate = allDates.length ? new Date(Math.max(...allDates.map(d => d.getTime()))) : new Date(today.getTime() + 90 * 86400000);

  const origin = startOfWeek(new Date(minDate.getTime() - 7 * 86400000));
  const end    = startOfWeek(new Date(maxDate.getTime() + 14 * 86400000));
  const weeks  = Math.max(8, weeksBetween(origin, end));

  const weekHeaders = Array.from({ length: weeks }, (_, i) => {
    const d = new Date(origin.getTime() + i * 7 * 86400000);
    return { label: d.toLocaleDateString('en', { month: 'short', day: 'numeric' }), date: d };
  });

  const todayOffset = Math.max(0, weeksBetween(origin, today)) * COL_W;

  const projectOptions = (projects as { id: number; name: string }[]).map(p => ({ value: String(p.id), label: p.name }));

  const items = viewType === 'tasks'
    ? (tasks as Task[]).filter(t => t.due_date)
    : (sprints as { id: number; name: string; status: string; start_date: string | null; end_date: string | null }[]).filter(s => s.start_date && s.end_date);

  const scroll = (dir: number) => {
    if (scrollRef.current) { scrollRef.current.scrollLeft += dir * COL_W * 4; }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Roadmap</h1>
          <p className="mt-1 text-sm text-slate-500">Timeline view of tasks and sprints</p>
        </div>
        <div className="flex items-center gap-2">
          {projects.length > 1 && (
            <Select
              options={projectOptions}
              value={String(selectedPid ?? '')}
              onChange={e => setProjectId(Number(e.target.value))}
            />
          )}
          <div className="flex rounded-lg border border-slate-200 dark:border-slate-700">
            {(['tasks', 'sprints'] as const).map(v => (
              <button
                key={v}
                onClick={() => setViewType(v)}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium capitalize transition-colors',
                  viewType === v
                    ? 'bg-primary-600 text-white'
                    : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800',
                  v === 'tasks' ? 'rounded-l-lg' : 'rounded-r-lg',
                )}
              >
                {v}
              </button>
            ))}
          </div>
          <button onClick={() => scroll(-1)} className="rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:text-slate-700 dark:border-slate-700">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={() => scroll(1)} className="rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:text-slate-700 dark:border-slate-700">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="py-20 text-center">
          <Map className="mx-auto mb-3 h-12 w-12 text-slate-300" />
          <p className="text-slate-500">
            {selectedPid ? 'No items with dates found. Add due dates to see the roadmap.' : 'Select a project to view the roadmap.'}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
          {/* Week header */}
          <div className="flex border-b border-slate-200 dark:border-slate-700">
            <div className="w-48 shrink-0 border-r border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-900">
              {viewType === 'tasks' ? 'Task' : 'Sprint'}
            </div>
            <div ref={scrollRef} className="flex-1 overflow-x-auto" style={{ scrollBehavior: 'smooth' }}>
              <div className="flex" style={{ width: weeks * COL_W }}>
                {weekHeaders.map((wk, i) => (
                  <div
                    key={i}
                    className={cn(
                      'shrink-0 border-r border-slate-100 py-2 text-center text-[10px] text-slate-400 dark:border-slate-800',
                      wk.date.toDateString() === startOfWeek(today).toDateString() && 'font-bold text-primary-600 dark:text-primary-400',
                    )}
                    style={{ width: COL_W }}
                  >
                    {wk.label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Rows */}
          <div className="max-h-[600px] overflow-y-auto">
            {items.map((item, idx) => {
              const isTask = viewType === 'tasks';
              const task   = item as Task;
              const sprint = item as { id: number; name: string; status: string; start_date: string; end_date: string };

              const label = isTask ? task.title : sprint.name;
              const color = isTask ? (PRIORITY_COLOR[task.priority] ?? 'bg-slate-400') : (STATUS_COLOR[sprint.status] ?? 'bg-slate-400');

              let startW: number, endW: number;
              if (isTask) {
                startW = Math.max(0, weeksBetween(origin, new Date(task.task_date)));
                endW   = task.due_date ? weeksBetween(origin, new Date(task.due_date)) : startW + 1;
              } else {
                startW = sprint.start_date ? Math.max(0, weeksBetween(origin, new Date(sprint.start_date))) : 0;
                endW   = sprint.end_date ? weeksBetween(origin, new Date(sprint.end_date)) : startW + 2;
              }
              const spanW = Math.max(1, endW - startW);

              return (
                <div key={(item as { id: number }).id} className={cn('flex', idx % 2 === 0 ? '' : 'bg-slate-50/50 dark:bg-slate-900/30')}>
                  {/* Label column */}
                  <div className="w-48 shrink-0 truncate border-r border-slate-100 px-4 py-2 text-xs text-slate-700 dark:border-slate-700 dark:text-slate-300" style={{ height: ROW_H }}>
                    {label}
                  </div>
                  {/* Bar column */}
                  <div className="relative flex-1 overflow-hidden" style={{ height: ROW_H, width: weeks * COL_W }}>
                    {/* Today line */}
                    <div
                      className="absolute top-0 bottom-0 w-px bg-red-400/50"
                      style={{ left: todayOffset }}
                    />
                    {/* Week grid */}
                    {weekHeaders.map((_, i) => (
                      <div key={i} className="absolute top-0 bottom-0 border-r border-slate-100 dark:border-slate-800" style={{ left: (i + 1) * COL_W - 1 }} />
                    ))}
                    {/* Bar */}
                    {startW < weeks && (
                      <div
                        title={label}
                        className={cn('absolute top-2 h-[22px] rounded-full px-2 text-[10px] font-medium text-white flex items-center truncate shadow-sm', color)}
                        style={{ left: startW * COL_W + 2, width: Math.min(spanW * COL_W - 4, (weeks - startW) * COL_W - 4) }}
                      >
                        {label}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
