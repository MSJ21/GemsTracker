import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Download, Filter, ArrowUpDown, ArrowUp, ArrowDown, X, UserX, AlertCircle, Save, Bookmark, Trash2 } from 'lucide-react';
import { reportsApi } from '@/api/reports';
import { filterPresetsApi } from '@/api/tasks';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card, CardHeader, CardBody, CardTitle } from '@/components/ui/Card';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { BarChartWidget } from '@/components/charts/BarChartWidget';
import { Avatar } from '@/components/shared/Avatar';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { PageSpinner } from '@/components/ui/Spinner';
import { taskStatusBadge } from '@/components/ui/Badge';
import { usePagination } from '@/hooks/usePagination';
import { useSort } from '@/hooks/useSort';
import { formatDate, formatHours } from '@/utils/helpers';
import { exportToExcel } from '@/utils/excelUtils';
import type { TaskFilters, Task } from '@/types';

function exportExcel(tasks: Task[]) {
  exportToExcel(
    [
      ['User', 'Project', 'Title', 'Hours', 'Status', 'Date'],
      ...tasks.map(t => [t.user_name ?? '', t.project_name, t.title ?? '', t.hours_spent, t.status, t.task_date]),
    ],
    `report-${new Date().toISOString().split('T')[0]}.xlsx`,
  );
}

type SortKey = 'user_name' | 'project_name' | 'title' | 'hours_spent' | 'status' | 'task_date';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function AdminReportsPage() {
  const qc = useQueryClient();
  const [filters, setFilters] = useState<TaskFilters>({});
  const [applied, setApplied] = useState<TaskFilters>({});
  const [search, setSearch]   = useState('');
  const [checkDate, setCheckDate] = useState(todayISO());
  const [presetName, setPresetName]           = useState('');
  const [showPresets, setShowPresets]         = useState(false);
  const [deletePresetId, setDeletePresetId]   = useState<number | null>(null);

  const { data: presets = [] } = useQuery({
    queryKey: ['filter-presets'],
    queryFn:  () => filterPresetsApi.list().then(r => r.data ?? []),
  });

  const savePresetMut = useMutation({
    mutationFn: () => filterPresetsApi.create(presetName.trim(), applied),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['filter-presets'] }); setPresetName(''); },
  });

  const deletePresetMut = useMutation({
    mutationFn: (id: number) => filterPresetsApi.delete(id),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['filter-presets'] }); setDeletePresetId(null); },
  });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-reports', applied],
    queryFn:  () => reportsApi.admin(applied).then(r => r.data),
  });

  const chartData    = useMemo(() => (data?.tasks_per_project ?? []).map(p => ({ name: p.name, value: p.task_count })), [data]);
  const userOptions  = useMemo(() => (data?.users ?? []).map(u => ({ value: String(u.id), label: u.name })), [data]);
  const projOptions  = useMemo(() => (data?.projects ?? []).map(p => ({ value: String(p.id), label: p.name })), [data]);

  const statusOptions = [
    { value: 'pending',     label: 'Pending' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'done',        label: 'Done' },
  ];

  const filteredTasks = useMemo(() => {
    const tasks = data?.tasks ?? [];
    if (!search) return tasks;
    const q = search.toLowerCase();
    return tasks.filter(t =>
      t.title.toLowerCase().includes(q) ||
      (t.user_name ?? '').toLowerCase().includes(q) ||
      t.project_name.toLowerCase().includes(q)
    );
  }, [data?.tasks, search]);

  // Non-submitters: users in user_activity who have no task on checkDate.
  // Uses user_activity (role=user only) to avoid filtering by status field
  // which may not be present in report payload. Slices task_date to 10 chars
  // to handle any time-component variations from the DB.
  const nonSubmitters = useMemo(() => {
    if (!data || !checkDate) return [];
    const submittedIds = new Set(
      (data.tasks ?? [])
        .filter(t => (t.task_date ?? '').slice(0, 10) === checkDate)
        .map(t => t.user_id)
    );
    return (data.user_activity ?? []).filter(u => !submittedIds.has(u.id));
  }, [data, checkDate]);

  const { sort, setSort, sorted } = useSort<Task & Record<string, unknown>>(
    filteredTasks as (Task & Record<string, unknown>)[],
    'task_date',
    'desc'
  );
  const pg = usePagination(sorted, 20);

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sort?.key !== col) return <ArrowUpDown className="h-3 w-3 opacity-40" />;
    return sort.dir === 'asc' ? <ArrowUp className="h-3 w-3 text-primary-500" /> : <ArrowDown className="h-3 w-3 text-primary-500" />;
  };

  const hasFilters = Object.values(applied).some(Boolean);

  if (isLoading || !data) return <PageSpinner />;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Reports</h2>
          <p className="text-sm text-slate-500">{data.tasks.length} tasks total</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => exportExcel(filteredTasks)}>
          <Download className="h-4 w-4" /> Export Excel
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Filter className="h-4 w-4" /> Filters</CardTitle></CardHeader>
        <CardBody>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Select options={userOptions}   placeholder="All users"    value={filters.user_id ?? ''}    onChange={e => setFilters(f => ({ ...f, user_id:    e.target.value }))} />
            <Select options={projOptions}   placeholder="All projects" value={filters.project_id ?? ''} onChange={e => setFilters(f => ({ ...f, project_id: e.target.value }))} />
            <Select options={statusOptions} placeholder="All statuses" value={filters.status ?? ''}     onChange={e => setFilters(f => ({ ...f, status:     e.target.value }))} />
            <Input type="date" value={filters.date_from ?? ''} onChange={e => setFilters(f => ({ ...f, date_from: e.target.value }))} />
            <Input type="date" value={filters.date_to   ?? ''} onChange={e => setFilters(f => ({ ...f, date_to:   e.target.value }))} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" onClick={() => { setApplied(filters); pg.setPage(1); }}>Apply</Button>
            <Button size="sm" variant="outline" onClick={() => { setFilters({}); setApplied({}); setSearch(''); }}>
              <X className="h-3.5 w-3.5" /> Clear
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowPresets(s => !s)}>
              <Bookmark className="h-3.5 w-3.5" /> Presets {presets.length > 0 && `(${presets.length})`}
            </Button>
          </div>

          {showPresets && (
            <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
              <div className="flex flex-wrap gap-2 mb-3">
                {presets.map(p => (
                  <div key={p.id} className="flex items-center gap-1 rounded-full bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-700 pl-3 pr-1 py-1">
                    <button className="text-xs font-medium text-slate-700 dark:text-slate-200 hover:text-primary-600"
                      onClick={() => { setFilters(p.filters); setApplied(p.filters); }}>
                      {p.name}
                    </button>
                    <button
                      onClick={() => setDeletePresetId(p.id)}
                      disabled={deletePresetMut.isPending && deletePresetId === p.id}
                      className="ml-1 rounded-full p-0.5 text-slate-300 hover:text-red-500 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {presets.length === 0 && <p className="text-xs text-slate-400">No saved presets yet</p>}
              </div>
              <div className="flex gap-2">
                <input value={presetName} onChange={e => setPresetName(e.target.value)} placeholder="Preset name…"
                  className="h-8 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-xs focus:border-primary-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
                <Button size="sm" disabled={!presetName.trim()} onClick={() => savePresetMut.mutate()}>
                  <Save className="h-3.5 w-3.5" /> Save current
                </Button>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Summary stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Total Tasks',  value: data.tasks.length,                                                       cls: 'text-primary-600' },
          { label: 'Total Hours',  value: formatHours(data.tasks.reduce((s, t) => s + Number(t.hours_spent), 0)),  cls: 'text-emerald-600' },
          { label: 'Active Users', value: data.user_activity.filter(u => u.total_tasks > 0).length,                cls: 'text-blue-600' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <p className="text-xs text-slate-500">{s.label}</p>
            <p className={`mt-1 text-2xl font-bold ${s.cls}`}>{s.value}</p>
            {hasFilters && <p className="mt-0.5 text-xs text-slate-400">filtered results</p>}
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Tasks per Project</CardTitle></CardHeader>
          <CardBody>
            <BarChartWidget data={chartData} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader><CardTitle>User Activity</CardTitle></CardHeader>
          <CardBody className="p-0">
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {data.user_activity.map((u, i) => (
                <div key={u.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="w-5 text-xs font-bold text-slate-400">#{i + 1}</span>
                  <Avatar name={u.name} avatar={u.avatar} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{u.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{u.total_tasks} tasks</p>
                    <p className="text-xs text-slate-400">{formatHours(u.total_hours)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* ── Non-Submitters ──────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2">
              <UserX className="h-4 w-4 text-red-500" />
              Who Hasn&apos;t Submitted
            </CardTitle>
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-slate-500">Check date</label>
              <input
                type="date"
                value={checkDate}
                onChange={e => setCheckDate(e.target.value)}
                className="h-8 rounded-lg border border-slate-200 bg-slate-50 px-2 text-xs text-slate-700 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              />
            </div>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {nonSubmitters.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                <AlertCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">All active users submitted for {formatDate(checkDate)}</p>
              <p className="text-xs text-slate-400">Everyone is up to date</p>
            </div>
          ) : (
            <>
              <div className="border-b border-slate-100 bg-red-50 px-5 py-2.5 dark:border-slate-700 dark:bg-red-900/10">
                <p className="text-xs font-medium text-red-600 dark:text-red-400">
                  {nonSubmitters.length} active user{nonSubmitters.length !== 1 ? 's' : ''} did not log any task on {formatDate(checkDate)}
                </p>
              </div>
              <div className="grid grid-cols-1 divide-y divide-slate-100 dark:divide-slate-700 sm:grid-cols-2 sm:divide-y-0">
                {nonSubmitters.map(u => (
                  <div key={u.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <Avatar name={u.name} avatar={u.avatar} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{u.name}</p>
                      <p className="truncate text-xs text-slate-400">{u.email}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600 dark:bg-red-900/30 dark:text-red-400">
                      Not submitted
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardBody>
      </Card>

      {/* Tasks table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>Tasks ({filteredTasks.length})</CardTitle>
            <div className="relative">
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); pg.setPage(1); }}
                placeholder="Search tasks..."
                className="h-8 w-48 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
                {([
                  ['user_name',    'User'],
                  ['project_name', 'Project'],
                  ['title',        'Task'],
                  ['hours_spent',  'Hours'],
                  ['status',       'Status'],
                  ['task_date',    'Date'],
                ] as [SortKey, string][]).map(([key, label]) => (
                  <th key={key} className="px-5 py-3 text-left">
                    <button onClick={() => setSort(key)} className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                      {label} <SortIcon col={key} />
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {pg.paged.map(t => (
                <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{t.user_name}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{t.project_name}</td>
                  <td className="px-5 py-3 font-medium text-slate-900 dark:text-slate-100 max-w-xs truncate">{t.title}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{formatHours(t.hours_spent)}</td>
                  <td className="px-5 py-3">{taskStatusBadge(t.status)}</td>
                  <td className="px-5 py-3 text-xs text-slate-400">{formatDate(t.task_date)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {pg.totalItems === 0 && (
            <EmptyState title="No tasks found" description={search || hasFilters ? 'Try adjusting your search or filters' : 'No tasks recorded yet'} />
          )}
        </div>
        {pg.totalItems > 0 && (
          <div className="border-t border-slate-100 px-4 dark:border-slate-700">
            <Pagination {...pg} />
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={deletePresetId !== null}
        onClose={() => setDeletePresetId(null)}
        onConfirm={() => deletePresetId !== null && deletePresetMut.mutate(deletePresetId)}
        loading={deletePresetMut.isPending}
        title="Delete Preset"
        message="Delete this saved filter preset? This cannot be undone."
      />
    </div>
  );
}
