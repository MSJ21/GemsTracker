import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, ArrowUpDown, ArrowUp, ArrowDown, ClipboardList } from 'lucide-react';
import { reportsApi } from '@/api/reports';
import { Card, CardHeader, CardBody, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { DoughnutChartWidget } from '@/components/charts/DoughnutChartWidget';
import { BarChartWidget } from '@/components/charts/BarChartWidget';
import { PageSpinner } from '@/components/ui/Spinner';
import { taskStatusBadge } from '@/components/ui/Badge';
import { usePagination } from '@/hooks/usePagination';
import { useSort } from '@/hooks/useSort';
import { formatDate, formatHours } from '@/utils/helpers';
import { exportToExcel } from '@/utils/excelUtils';
import type { TaskFilters, Task } from '@/types';

const STATUS_COLORS: Record<string, string> = {
  pending:       '#f59e0b',
  'in-progress': '#3b82f6',
  done:          '#22c55e',
};

type SortKey = 'project_name' | 'title' | 'hours_spent' | 'status' | 'task_date';

function exportExcel(tasks: Task[]) {
  exportToExcel(
    [
      ['Project', 'Title', 'Hours', 'Status', 'Date'],
      ...tasks.map(t => [t.project_name, t.title ?? '', t.hours_spent, t.status, t.task_date]),
    ],
    `my-report-${new Date().toISOString().split('T')[0]}.xlsx`,
  );
}

export default function UserReportsPage() {
  const [filters, setFilters] = useState<TaskFilters>({});
  const [applied, setApplied] = useState<TaskFilters>({});

  const { data, isLoading } = useQuery({
    queryKey: ['user-reports', applied],
    queryFn:  () => reportsApi.user(applied).then(r => r.data),
  });

  const doughnutData = useMemo(() =>
    (data?.status_summary ?? []).map(s => ({
      name: s.status, value: Number(s.count), color: STATUS_COLORS[s.status] ?? '#6b7280',
    })),
    [data]
  );

  const barData = useMemo(() =>
    (data?.hours_by_project ?? []).map(h => ({ name: h.project_name, value: Number(h.total_hours) })),
    [data]
  );

  const { sort, setSort, sorted } = useSort<Task & Record<string, unknown>>(
    (data?.tasks ?? []) as (Task & Record<string, unknown>)[],
    'task_date',
    'desc'
  );
  const pg = usePagination(sorted, 20);

  const ws = data?.weekly_summary;

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sort?.key !== col) return <ArrowUpDown className="h-3 w-3 opacity-40" />;
    return sort.dir === 'asc' ? <ArrowUp className="h-3 w-3 text-primary-500" /> : <ArrowDown className="h-3 w-3 text-primary-500" />;
  };

  if (isLoading || !data) return <PageSpinner />;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">My Reports</h2>
          <p className="text-sm text-slate-500">{data.tasks.length} tasks total</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => exportExcel(data.tasks)}>
          <Download className="h-4 w-4" /> Export Excel
        </Button>
      </div>

      {/* Summary stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs text-slate-500">This Week Tasks</p>
          <p className="mt-1 text-2xl font-bold text-primary-600">{ws?.this_week_tasks ?? 0}</p>
          <p className="text-xs text-slate-400">Last week: {ws?.last_week_tasks ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs text-slate-500">Hours This Week</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">{formatHours(ws?.this_week_hours ?? 0)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs text-slate-500">Total Tasks</p>
          <p className="mt-1 text-2xl font-bold text-slate-700 dark:text-slate-200">{data.tasks.length}</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardBody>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Input type="date" label="From" value={filters.date_from ?? ''} onChange={e => setFilters(f => ({ ...f, date_from: e.target.value }))} />
            <Input type="date" label="To"   value={filters.date_to   ?? ''} onChange={e => setFilters(f => ({ ...f, date_to:   e.target.value }))} />
            <Select
              label="Status"
              options={[{ value: 'pending', label: 'Pending' }, { value: 'in-progress', label: 'In Progress' }, { value: 'done', label: 'Done' }]}
              placeholder="All statuses"
              value={filters.status ?? ''}
              onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
            />
            <div className="flex items-end gap-2">
              <Button size="sm" onClick={() => { setApplied(filters); pg.setPage(1); }}>Apply</Button>
              <Button size="sm" variant="outline" onClick={() => { setFilters({}); setApplied({}); }}>Clear</Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Status Breakdown</CardTitle></CardHeader>
          <CardBody>
            {doughnutData.length > 0 ? (
              <DoughnutChartWidget data={doughnutData} />
            ) : (
              <p className="py-12 text-center text-sm text-slate-400">No data</p>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader><CardTitle>Hours by Project</CardTitle></CardHeader>
          <CardBody>
            {barData.length > 0 ? (
              <BarChartWidget data={barData} color="#22c55e" valueLabel="Hours" />
            ) : (
              <p className="py-12 text-center text-sm text-slate-400">No data</p>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Tasks table with sort + pagination */}
      <Card>
        <CardHeader>
          <CardTitle>Tasks ({pg.totalItems})</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
                {([
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
            <EmptyState icon={ClipboardList} title="No tasks found" description="Try adjusting your filters or date range" />
          )}
        </div>
        {pg.totalItems > 0 && (
          <div className="border-t border-slate-100 px-4 dark:border-slate-700">
            <Pagination {...pg} />
          </div>
        )}
      </Card>
    </div>
  );
}
