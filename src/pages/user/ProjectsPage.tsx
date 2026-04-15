import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Clock, CheckSquare, Search, Filter, X, FolderKanban, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { projectsApi } from '@/api/projects';
import { Card, CardBody } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { PageSpinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { projectStatusBadge } from '@/components/ui/Badge';
import { usePagination } from '@/hooks/usePagination';
import { useSort } from '@/hooks/useSort';
import { formatDate, formatHours, progressPercent, isOverdue, cn } from '@/utils/helpers';
import type { Project } from '@/types';

type SortKey = 'name' | 'entity_name' | 'status' | 'end_date';

export default function UserProjectsPage() {
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [showFilters, setShowFilters]   = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['user-projects'],
    queryFn:  () => projectsApi.userProjects().then(r => r.data),
  });

  const entityOptions = useMemo(() => {
    const map = new Map<number, string>();
    (data ?? []).forEach(p => map.set(p.entity_id, p.entity_name));
    return Array.from(map.entries()).map(([id, name]) => ({ value: String(id), label: name }));
  }, [data]);

  const filtered = useMemo(() => {
    const all = data ?? [];
    return all.filter(p => {
      const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.entity_name.toLowerCase().includes(search.toLowerCase());
      const matchStatus = !statusFilter || p.status === statusFilter;
      const matchEntity = !entityFilter || p.entity_id === Number(entityFilter);
      return matchSearch && matchStatus && matchEntity;
    });
  }, [data, search, statusFilter, entityFilter]);

  const { sort, setSort, sorted } = useSort<Project & Record<string, unknown>>(
    filtered as (Project & Record<string, unknown>)[],
    'name'
  );
  const pg = usePagination(sorted, 9);

  const activeFilters = [search, statusFilter, entityFilter].filter(Boolean).length;

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sort?.key !== col) return <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />;
    return sort.dir === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-primary-500" /> : <ArrowDown className="h-3.5 w-3.5 text-primary-500" />;
  };

  if (isLoading || !data) return <PageSpinner />;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">My Projects</h2>
          <p className="text-sm text-slate-500">{data.length} assigned</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Sort pills */}
          <div className="hidden sm:flex items-center gap-1 rounded-xl bg-slate-100 p-1 text-xs dark:bg-slate-800">
            {(['name', 'end_date', 'status'] as SortKey[]).map(k => (
              <button
                key={k}
                onClick={() => setSort(k)}
                className={cn(
                  'flex items-center gap-1 rounded-lg px-2 py-1 font-medium capitalize transition-colors',
                  sort?.key === k ? 'bg-white text-primary-600 shadow-sm dark:bg-slate-700' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                )}
              >
                {k.replace('_', ' ')} <SortIcon col={k} />
              </button>
            ))}
          </div>
          <Button
            variant="outline" size="sm"
            onClick={() => setShowFilters(f => !f)}
            className={cn(activeFilters > 0 && 'border-primary-400 text-primary-600')}
          >
            <Filter className="h-4 w-4" />
            {activeFilters > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary-600 text-[10px] font-bold text-white">{activeFilters}</span>
            )}
          </Button>
        </div>
      </div>

      {showFilters && (
        <div className="flex flex-wrap gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <div className="relative flex-1 min-w-40">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); pg.setPage(1); }}
              placeholder="Search projects..."
              className="h-9 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
          {entityOptions.length > 1 && (
            <Select
              className="min-w-40"
              options={entityOptions}
              placeholder="All entities"
              value={entityFilter}
              onChange={e => { setEntityFilter(e.target.value); pg.setPage(1); }}
            />
          )}
          <Select
            className="min-w-36"
            options={[{ value: 'active', label: 'Active' }, { value: 'on-hold', label: 'On Hold' }, { value: 'completed', label: 'Completed' }]}
            placeholder="All statuses"
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); pg.setPage(1); }}
          />
          {activeFilters > 0 && (
            <Button variant="outline" size="sm" onClick={() => { setSearch(''); setStatusFilter(''); setEntityFilter(''); }}>
              <X className="h-3.5 w-3.5" /> Clear
            </Button>
          )}
        </div>
      )}

      {pg.totalItems === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title={activeFilters > 0 ? 'No projects match your filters' : 'No projects assigned'}
          description={activeFilters > 0 ? 'Try adjusting your filters' : 'Contact your admin to get assigned to projects'}
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {pg.paged.map(p => {
              const pct    = progressPercent(p.done_tasks, p.total_tasks);
              const overdue = isOverdue(p.end_date) && p.status !== 'completed';
              return (
                <Card key={p.id} className={cn(overdue && 'border-red-200 dark:border-red-900/50')}>
                  <CardBody>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">{p.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{p.entity_name}</p>
                      </div>
                      {projectStatusBadge(p.status)}
                    </div>

                    {p.description && (
                      <p className="mb-3 text-xs text-slate-500 line-clamp-2">{p.description}</p>
                    )}

                    <div className="mb-3">
                      <ProgressBar
                        value={pct}
                        showLabel
                        color={pct === 100 ? 'green' : overdue ? 'red' : 'blue'}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <CheckSquare className="h-3 w-3" />
                          {p.done_tasks ?? 0}/{p.total_tasks ?? 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatHours(p.total_hours ?? 0)}
                        </span>
                      </div>
                      <span className={cn('flex items-center gap-1', overdue && 'font-medium text-red-500')}>
                        <Calendar className="h-3 w-3" />
                        {formatDate(p.end_date)}
                      </span>
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>

          {pg.totalPages > 1 && (
            <div className="rounded-2xl border border-slate-200 bg-white px-4 dark:border-slate-700 dark:bg-slate-900">
              <Pagination {...pg} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
