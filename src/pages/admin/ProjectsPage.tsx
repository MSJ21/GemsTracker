import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import {
  Plus, Pencil, Trash2, RotateCcw, FolderKanban,
  Search, Filter, ArrowUpDown, ArrowUp, ArrowDown, Eye, X, AlertTriangle, Download, Star,
  ChevronDown, ChevronRight, ClipboardList,
} from 'lucide-react';
import { projectsApi } from '@/api/projects';
import { pinnedProjectsApi, tasksApi } from '@/api/tasks';
import { entitiesApi } from '@/api/entities';
import { useToastStore } from '@/store/toastStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { PageSpinner } from '@/components/ui/Spinner';
import { projectStatusBadge, priorityBadge, dueDateBadge } from '@/components/ui/Badge';
import { usePagination } from '@/hooks/usePagination';
import { useSort } from '@/hooks/useSort';
import { formatDate, progressPercent, isOverdue, cn } from '@/utils/helpers';
import { exportToExcel } from '@/utils/excelUtils';
import type { Project, ProjectStatus } from '@/types';

const schema = z.object({
  entity_id:   z.string().min(1, 'Entity is required'),
  name:        z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  start_date:  z.string().optional(),
  end_date:    z.string().optional(),
  status:      z.string(),
});

type FormData = z.infer<typeof schema>;
type SortKey  = 'name' | 'entity_name' | 'status' | 'end_date' | 'total_tasks' | 'total_hours';

const STATUS_CYCLE: Record<ProjectStatus, ProjectStatus> = {
  'active': 'on-hold',
  'on-hold': 'completed',
  'completed': 'active',
};

function HealthBadge({ project }: { project: Project }) {
  const overdue = isOverdue(project.end_date) && project.status !== 'completed';
  const pct     = progressPercent(project.done_tasks, project.total_tasks);
  if (project.status === 'completed') return <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">On Track</span>;
  if (overdue) return <span className="flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600 dark:bg-red-900/30 dark:text-red-400"><AlertTriangle className="h-2.5 w-2.5" />Overdue</span>;
  if (pct >= 75) return <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">On Track</span>;
  if (pct >= 40) return <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">At Risk</span>;
  return <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">Early</span>;
}

function exportExcel(projects: Project[]) {
  exportToExcel(
    [
      ['Name', 'Entity', 'Status', 'Start Date', 'End Date', 'Total Tasks', 'Done Tasks', 'Total Hours'],
      ...projects.map(p => [p.name, p.entity_name, p.status, p.start_date ?? '', p.end_date ?? '', p.total_tasks ?? 0, p.done_tasks ?? 0, p.total_hours ?? 0]),
    ],
    `projects-${new Date().toISOString().slice(0, 10)}.xlsx`,
  );
}

function ProjectTaskRows({ projectId, colSpan }: { projectId: number; colSpan: number }) {
  const { data, isLoading } = useQuery({
    queryKey: ['project-tasks', projectId],
    queryFn:  () => tasksApi.list({ project_id: String(projectId) }).then(r => r.data ?? []),
  });

  if (isLoading) {
    return (
      <tr>
        <td colSpan={colSpan} className="bg-slate-50 px-8 py-3 dark:bg-slate-800/30">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <div className="h-3 w-3 animate-spin rounded-full border-2 border-slate-300 border-t-primary-500" />
            Loading tasks…
          </div>
        </td>
      </tr>
    );
  }

  const tasks = data ?? [];

  if (tasks.length === 0) {
    return (
      <tr>
        <td colSpan={colSpan} className="bg-slate-50 px-8 py-3 dark:bg-slate-800/30">
          <p className="text-xs text-slate-400 italic">No tasks in this project</p>
        </td>
      </tr>
    );
  }

  return (
    <>
      {tasks.map(t => (
        <tr key={t.id} className="bg-slate-50/70 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-700/50">
          {/* empty checkbox cell */}
          <td className="w-10 px-4 py-2" />
          {/* indent + task title */}
          <td className="px-5 py-2" colSpan={2}>
            <div className="flex items-center gap-2 pl-4 border-l-2 border-slate-200 dark:border-slate-600">
              <ClipboardList className="h-3 w-3 shrink-0 text-slate-400" />
              <span className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate max-w-[220px]">{t.title}</span>
              {t.priority && <span>{priorityBadge(t.priority)}</span>}
            </div>
          </td>
          {/* due date */}
          <td className="px-5 py-2">
            {dueDateBadge(t.due_date)}
          </td>
          {/* subtasks */}
          <td className="px-5 py-2">
            {(t.subtask_total ?? 0) > 0 && (
              <span className="text-xs text-slate-400">{t.subtask_done}/{t.subtask_total} subtasks</span>
            )}
          </td>
          {/* health (empty) */}
          <td className="px-5 py-2" />
          {/* status */}
          <td className="px-5 py-2">
            <span className={cn(
              'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
              t.status === 'done'        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
            : t.status === 'in-progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
            : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
            )}>
              {t.status}
            </span>
          </td>
          {/* actions (empty) */}
          <td className="px-5 py-2" />
        </tr>
      ))}
    </>
  );
}

export default function ProjectsPage() {
  const qc       = useQueryClient();
  const { push } = useToastStore();

  const [modalOpen, setModalOpen]           = useState(false);
  const [editTarget, setEditTarget]         = useState<Project | null>(null);
  const [deleteTarget, setDeleteTarget]     = useState<Project | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [search, setSearch]                 = useState('');
  const [statusFilter, setStatusFilter]     = useState('');
  const [entityFilter, setEntityFilter]     = useState('');
  const [showFilters, setShowFilters]       = useState(false);
  const [selected, setSelected]             = useState<Set<number>>(new Set());
  const [expandedRows, setExpandedRows]     = useState<Set<number>>(new Set());

  const { data, isLoading }  = useQuery({ queryKey: ['admin-projects'], queryFn: () => projectsApi.list().then(r => r.data) });
  const { data: entityData } = useQuery({ queryKey: ['entities'],       queryFn: () => entitiesApi.list().then(r => r.data) });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { status: 'active' },
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin-projects'] });
  const apiError   = (e: unknown) => push((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed', 'error');

  // Ctrl+N shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'n' && !modalOpen) {
        e.preventDefault(); openCreate();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [modalOpen]);

  const createMutation  = useMutation({ mutationFn: (d: FormData) => projectsApi.create({ ...d, entity_id: Number(d.entity_id) }), onSuccess: () => { invalidate(); push('Project created', 'success'); closeModal(); }, onError: apiError });
  const updateMutation  = useMutation({ mutationFn: (args: { id: number; d: FormData }) => projectsApi.update(args.id, { ...args.d, entity_id: Number(args.d.entity_id) }), onSuccess: () => { invalidate(); push('Project updated', 'success'); closeModal(); }, onError: apiError });
  const deleteMutation  = useMutation({ mutationFn: (id: number) => projectsApi.delete(id),  onSuccess: () => { invalidate(); push('Project deleted', 'success'); setDeleteTarget(null); } });
  const restoreMutation = useMutation({ mutationFn: (id: number) => projectsApi.restore(id), onSuccess: () => { invalidate(); push('Project restored', 'success'); } });

  const statusMutation = useMutation({
    mutationFn: (args: { id: number; status: ProjectStatus }) =>
      projectsApi.update(args.id, { status: args.status }),
    onSuccess: () => { invalidate(); push('Status updated', 'success'); },
    onError: apiError,
  });

  const { data: pinnedList = [] } = useQuery({
    queryKey: ['pinned-projects'],
    queryFn:  () => pinnedProjectsApi.list().then(r => r.data ?? []),
  });
  const pinnedIds = new Set((pinnedList).map(p => p.id));
  const pinMut = useMutation({
    mutationFn: (id: number) => pinnedIds.has(id) ? pinnedProjectsApi.unpin(id) : pinnedProjectsApi.pin(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['pinned-projects'] }),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      for (const id of ids) await projectsApi.delete(id);
    },
    onSuccess: () => {
      invalidate(); push(`Deleted ${selected.size} projects`, 'success');
      setSelected(new Set()); setBulkDeleteOpen(false);
    },
    onError: apiError,
  });

  const closeModal = () => { setModalOpen(false); setEditTarget(null); reset({ status: 'active' }); };
  const openCreate = () => { reset({ status: 'active' }); setEditTarget(null); setModalOpen(true); };
  const openEdit   = (p: Project) => {
    reset({ entity_id: String(p.entity_id), name: p.name, description: p.description ?? '', start_date: p.start_date ?? '', end_date: p.end_date ?? '', status: p.status });
    setEditTarget(p); setModalOpen(true);
  };
  const onSubmit = (d: FormData) => editTarget ? updateMutation.mutate({ id: editTarget.id, d }) : createMutation.mutate(d);

  const toggleSelect = (id: number) =>
    setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const toggleExpand = (id: number) =>
    setExpandedRows(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const entityOptions = (entityData?.entities ?? []).map(e => ({ value: String(e.id), label: e.name }));
  const entityFilterOptions = entityOptions;

  const filtered = useMemo(() => {
    const projects = data?.projects ?? [];
    return projects.filter(p => {
      const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.entity_name.toLowerCase().includes(search.toLowerCase());
      const matchStatus = !statusFilter || p.status === statusFilter;
      const matchEntity = !entityFilter || String(p.entity_id) === entityFilter;
      return matchSearch && matchStatus && matchEntity;
    });
  }, [data?.projects, search, statusFilter, entityFilter]);

  const { sort, setSort, sorted } = useSort<Project & Record<string, unknown>>(
    filtered as (Project & Record<string, unknown>)[],
    'name'
  );
  const pg = usePagination(sorted);

  const activeFilters = [search, statusFilter, entityFilter].filter(Boolean).length;

  const allPageSelected = pg.paged.length > 0 && pg.paged.every(p => selected.has(p.id));
  const toggleAllPage = () => {
    if (allPageSelected) setSelected(s => { const n = new Set(s); pg.paged.forEach(p => n.delete(p.id)); return n; });
    else setSelected(s => { const n = new Set(s); pg.paged.forEach(p => n.add(p.id)); return n; });
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sort?.key !== col) return <ArrowUpDown className="h-3 w-3 opacity-40" />;
    return sort.dir === 'asc' ? <ArrowUp className="h-3 w-3 text-primary-500" /> : <ArrowDown className="h-3 w-3 text-primary-500" />;
  };

  if (isLoading || !data) return <PageSpinner />;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Projects</h2>
          <p className="text-sm text-slate-500">{data.projects.length} total</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => exportExcel(sorted)}>
            <Download className="h-4 w-4" /> Export Excel
          </Button>
          <Button
            variant="outline" size="sm"
            onClick={() => setShowFilters(f => !f)}
            className={cn(activeFilters > 0 && 'border-primary-400 text-primary-600')}
          >
            <Filter className="h-4 w-4" />
            Filters
            {activeFilters > 0 && (
              <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary-600 text-[10px] font-bold text-white">{activeFilters}</span>
            )}
          </Button>
          <Button onClick={openCreate} size="sm"><Plus className="h-4 w-4" /> Add Project</Button>
        </div>
      </div>

      {showFilters && (
        <Card>
          <div className="p-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={e => { setSearch(e.target.value); pg.setPage(1); }}
                  placeholder="Search projects..."
                  className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
              <Select options={entityFilterOptions} placeholder="All entities" value={entityFilter} onChange={e => { setEntityFilter(e.target.value); pg.setPage(1); }} />
              <Select
                options={[{ value: 'active', label: 'Active' }, { value: 'on-hold', label: 'On Hold' }, { value: 'completed', label: 'Completed' }]}
                placeholder="All statuses"
                value={statusFilter}
                onChange={e => { setStatusFilter(e.target.value); pg.setPage(1); }}
              />
              {activeFilters > 0 && (
                <Button variant="outline" size="sm" onClick={() => { setSearch(''); setStatusFilter(''); setEntityFilter(''); }}>
                  <X className="h-3.5 w-3.5" /> Clear filters
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-primary-200 bg-primary-50 px-4 py-2.5 dark:border-primary-800/40 dark:bg-primary-900/20">
          <span className="text-sm font-medium text-primary-700 dark:text-primary-300">{selected.size} project{selected.size !== 1 ? 's' : ''} selected</span>
          <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => setBulkDeleteOpen(true)}>
            <Trash2 className="h-3.5 w-3.5" /> Delete selected
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}><X className="h-3.5 w-3.5" /> Clear</Button>
        </div>
      )}

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allPageSelected}
                    onChange={toggleAllPage}
                    className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                  />
                </th>
                <th className="w-8 px-1 py-3" />
                {([['name', 'Project'], ['entity_name', 'Entity'], ['end_date', 'Deadline']] as [SortKey, string][]).map(([key, label]) => (
                  <th key={key} className="px-5 py-3 text-left">
                    <button onClick={() => setSort(key)} className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                      {label} <SortIcon col={key} />
                    </button>
                  </th>
                ))}
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Progress</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Health</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {pg.paged.map(p => {
                const pct = progressPercent(p.done_tasks, p.total_tasks);
                const isExpanded = expandedRows.has(p.id);
                return (
                  <>
                    <tr key={p.id} className={cn('hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors', selected.has(p.id) && 'bg-primary-50/50 dark:bg-primary-900/10')}>
                      <td className="w-10 px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selected.has(p.id)}
                          onChange={() => toggleSelect(p.id)}
                          className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                        />
                      </td>
                      <td className="w-8 px-1 py-3">
                        <button
                          onClick={() => toggleExpand(p.id)}
                          title={isExpanded ? 'Collapse tasks' : 'Expand tasks'}
                          className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300 transition-colors"
                        >
                          {isExpanded
                            ? <ChevronDown className="h-3.5 w-3.5" />
                            : <ChevronRight className="h-3.5 w-3.5" />}
                        </button>
                      </td>
                      <td className="px-5 py-3">
                        <p className="font-semibold text-slate-900 dark:text-slate-100">{p.name}</p>
                        {p.description && <p className="text-xs text-slate-400 truncate max-w-[200px]">{p.description}</p>}
                      </td>
                      <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{p.entity_name}</td>
                      <td className="px-5 py-3 min-w-28">
                        <p className={`text-xs font-medium ${isOverdue(p.end_date) && p.status !== 'completed' ? 'text-red-500' : 'text-slate-500'}`}>
                          {formatDate(p.end_date)}
                        </p>
                      </td>
                      <td className="px-5 py-3 min-w-32">
                        <ProgressBar value={pct} showLabel />
                        <p className="mt-0.5 text-xs text-slate-400">{p.done_tasks ?? 0}/{p.total_tasks ?? 0}</p>
                      </td>
                      <td className="px-5 py-3"><HealthBadge project={p} /></td>
                      <td className="px-5 py-3">
                        <button
                          onClick={() => statusMutation.mutate({ id: p.id, status: STATUS_CYCLE[p.status as ProjectStatus] })}
                          title="Click to change status"
                          className="transition-opacity hover:opacity-70"
                        >
                          {projectStatusBadge(p.status)}
                        </button>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex gap-1">
                          <Link to={`/admin/projects/${p.id}`}>
                            <Button variant="ghost" size="sm" title="View details"><Eye className="h-3.5 w-3.5 text-slate-400" /></Button>
                          </Link>
                          <Button variant="ghost" size="sm" onClick={() => pinMut.mutate(p.id)} title={pinnedIds.has(p.id) ? 'Unpin from dashboard' : 'Pin to dashboard'}>
                            <Star className={cn('h-3.5 w-3.5', pinnedIds.has(p.id) ? 'fill-amber-400 text-amber-400' : 'text-slate-400')} />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => openEdit(p)}><Pencil className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(p)}><Trash2 className="h-3.5 w-3.5 text-red-400" /></Button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && <ProjectTaskRows projectId={p.id} colSpan={9} />}
                  </>
                );
              })}
            </tbody>
          </table>

          {pg.totalItems === 0 && (
            <EmptyState
              icon={FolderKanban}
              title={activeFilters > 0 ? 'No projects match your filters' : 'No projects yet'}
              description={activeFilters > 0 ? 'Try adjusting your filters' : 'Create your first project'}
              action={activeFilters === 0 ? <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4" /> Add Project</Button> : undefined}
            />
          )}
        </div>
        {pg.totalItems > 0 && (
          <div className="border-t border-slate-100 px-4 dark:border-slate-700">
            <Pagination {...pg} />
          </div>
        )}
      </Card>

      {data.deleted.length > 0 && (
        <Card>
          <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-700">
            <p className="text-sm font-semibold text-slate-400">Deleted Projects ({data.deleted.length})</p>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {data.deleted.map(p => (
              <div key={p.id} className="flex items-center justify-between px-5 py-3 opacity-60">
                <div className="flex items-center gap-2">
                  <FolderKanban className="h-4 w-4 text-slate-400" />
                  <span className="text-sm line-through text-slate-600 dark:text-slate-300">{p.name}</span>
                  <span className="text-xs text-slate-400">({p.entity_name})</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => restoreMutation.mutate(p.id)}><RotateCcw className="h-3.5 w-3.5" /> Restore</Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editTarget ? 'Edit Project' : 'New Project'}
        footer={
          <>
            <Button variant="outline" size="sm" onClick={closeModal}>Cancel</Button>
            <Button size="sm" loading={isSubmitting || createMutation.isPending || updateMutation.isPending} onClick={handleSubmit(onSubmit)}>{editTarget ? 'Save' : 'Create'}</Button>
          </>
        }
      >
        <form className="flex flex-col gap-4">
          <Select label="Entity" required options={entityOptions} placeholder="Select entity" error={errors.entity_id?.message} {...register('entity_id')} />
          <Input label="Name" required error={errors.name?.message} {...register('name')} />
          <Textarea label="Description" rows={2} {...register('description')} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Start Date" type="date" {...register('start_date')} />
            <Input label="End Date"   type="date" {...register('end_date')} />
          </div>
          <Select
            label="Status"
            options={[{ value: 'active', label: 'Active' }, { value: 'on-hold', label: 'On Hold' }, { value: 'completed', label: 'Completed' }]}
            {...register('status')}
          />
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget!.id)}
        loading={deleteMutation.isPending}
        message={`Delete "${deleteTarget?.name}"?`}
      />

      <ConfirmDialog
        open={bulkDeleteOpen}
        onClose={() => setBulkDeleteOpen(false)}
        onConfirm={() => bulkDeleteMutation.mutate(Array.from(selected))}
        loading={bulkDeleteMutation.isPending}
        message={`Delete ${selected.size} selected project${selected.size !== 1 ? 's' : ''}?`}
      />
    </div>
  );
}
