import { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus, Pencil, Trash2, Search, Filter, ArrowUpDown, ArrowUp, ArrowDown,
  X, ClipboardList, CheckSquare2, Download, LayoutGrid, List,
  FileText, Upload, RefreshCw, Eye, UserCog,
  BookOpen, Bug, SquareCheck, Crown,
} from 'lucide-react';
import { tasksApi } from '@/api/tasks';
import { projectsApi } from '@/api/projects';
import { membersApi, type ProjectMember } from '@/api/members';
import { useToastStore } from '@/store/toastStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';
import { Card } from '@/components/ui/Card';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { TaskDetailModal } from '@/components/shared/TaskDetailModal';
import { KanbanBoard } from '@/components/shared/KanbanBoard';
import { PageSpinner } from '@/components/ui/Spinner';
import { taskStatusBadge, priorityBadge, dueDateBadge } from '@/components/ui/Badge';
import { usePagination } from '@/hooks/usePagination';
import { useSort } from '@/hooks/useSort';
import { useTaskStatuses } from '@/hooks/useTaskStatuses';
import { formatDate, formatHours, cn } from '@/utils/helpers';
import { exportToExcel, downloadSampleExcel, parseExcelFile } from '@/utils/excelUtils';
import type { Task, TaskFilters, IssueType } from '@/types';

/* ── Issue type icon (shared mini config) ─────────────────────────── */
const ISSUE_ICONS: Record<IssueType, { Icon: React.FC<{ className?: string }>; color: string; bg: string }> = {
  story: { Icon: BookOpen,    color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
  bug:   { Icon: Bug,         color: 'text-red-500',     bg: 'bg-red-100 dark:bg-red-900/30' },
  task:  { Icon: SquareCheck, color: 'text-blue-500',    bg: 'bg-blue-100 dark:bg-blue-900/30' },
  epic:  { Icon: Crown,       color: 'text-violet-600',  bg: 'bg-violet-100 dark:bg-violet-900/30' },
};

function IssueTypeIcon({ type }: { type: string }) {
  const cfg = ISSUE_ICONS[(type as IssueType)] ?? ISSUE_ICONS.task;
  return (
    <span className={cn('inline-flex items-center justify-center rounded-sm p-0.5', cfg.bg)} title={type}>
      <cfg.Icon className={cn('h-3 w-3', cfg.color)} />
    </span>
  );
}

/* ── Reassign modal ────────────────────────────────────────────────── */
function ReassignModal({ task, open, onClose, onDone }: {
  task: Task | null;
  open: boolean;
  onClose: () => void;
  onDone: () => void;
}) {
  const toast = useToastStore();
  const { data: members = [], isLoading } = useQuery({
    queryKey: ['project-members-user', task?.project_id],
    queryFn:  () => membersApi.forProject(task!.project_id).then(r => r.data ?? []),
    enabled:  open && !!task,
  });

  const assignMut = useMutation({
    mutationFn: (assigneeId: number | null) => membersApi.assignTask(task!.id, assigneeId),
    onSuccess: () => { toast.push('Assignee updated', 'success'); onDone(); onClose(); },
    onError:   (e: Error) => toast.push(e.message, 'error'),
  });

  if (!task) return null;

  return (
    <Modal open={open} onClose={onClose} title={`Assign — ${task.title}`} size="sm"
      footer={<Button variant="outline" size="sm" onClick={onClose}>Close</Button>}
    >
      {isLoading ? (
        <p className="py-6 text-center text-sm text-slate-400">Loading members…</p>
      ) : members.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-400">No members in this project.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {/* Unassign option */}
          <button
            onClick={() => assignMut.mutate(null)}
            disabled={assignMut.isPending}
            className={cn(
              'flex items-center gap-3 rounded-xl border p-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800',
              !task.assignee_id ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/20' : 'border-slate-200 dark:border-slate-700',
            )}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-dashed border-slate-300 dark:border-slate-600 text-xs text-slate-400">?</span>
            <span className="text-sm text-slate-600 dark:text-slate-300">Unassigned</span>
            {!task.assignee_id && <span className="ml-auto text-xs text-primary-600 dark:text-primary-400 font-medium">Current</span>}
          </button>
          {(members as ProjectMember[]).map(m => (
            <button
              key={m.user_id}
              onClick={() => assignMut.mutate(m.user_id)}
              disabled={assignMut.isPending}
              className={cn(
                'flex items-center gap-3 rounded-xl border p-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800',
                task.assignee_id === m.user_id ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/20' : 'border-slate-200 dark:border-slate-700',
              )}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-500 text-xs font-bold text-white flex-shrink-0">
                {m.name.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{m.name}</p>
                <p className="text-xs text-slate-400 truncate">{m.email}</p>
              </div>
              {task.assignee_id === m.user_id && <span className="ml-auto text-xs text-primary-600 dark:text-primary-400 font-medium flex-shrink-0">Current</span>}
              <span className={cn('ml-auto flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium',
                m.role === 'manager' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-700'
              )}>{m.role}</span>
            </button>
          ))}
        </div>
      )}
    </Modal>
  );
}

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
  recur_type:  z.string().optional(),
  recur_end:   z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const issueTypeOptions = [
  { value: 'task',  label: 'Task' },
  { value: 'story', label: 'Story' },
  { value: 'bug',   label: 'Bug' },
  { value: 'epic',  label: 'Epic' },
];
type SortKey  = 'title' | 'project_name' | 'hours_spent' | 'status' | 'priority' | 'task_date' | 'due_date';

const priorityOptions = [{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }, { value: 'critical', label: 'Critical' }];
const recurOptions   = [{ value: '', label: 'No repeat' }, { value: 'daily', label: 'Daily' }, { value: 'weekly', label: 'Weekly' }];

function todayStr() { return new Date().toISOString().split('T')[0]; }

function quickRange(preset: string) {
  const today = new Date();
  const fmt   = (d: Date) => d.toISOString().split('T')[0];
  if (preset === 'today') return { date_from: fmt(today), date_to: fmt(today) };
  if (preset === 'week')  { const m = new Date(today); m.setDate(today.getDate() - today.getDay() + 1); return { date_from: fmt(m), date_to: fmt(today) }; }
  if (preset === 'month') { const f = new Date(today.getFullYear(), today.getMonth(), 1); return { date_from: fmt(f), date_to: fmt(today) }; }
  return { date_from: '', date_to: '' };
}

function exportExcel(tasks: Task[]) {
  exportToExcel(
    [
      ['Date', 'Title', 'Project', 'Hours', 'Status', 'Priority', 'Due Date'],
      ...tasks.map(t => [t.task_date, t.title, t.project_name, t.hours_spent, t.status, t.priority, t.due_date ?? '']),
    ],
    'tasks.xlsx',
  );
}

function exportPdf(tasks: Task[]) {
  const win = window.open('', '_blank');
  if (!win) return;
  const rows = tasks.map(t => `
    <tr>
      <td>${t.task_date}</td><td>${t.title}</td><td>${t.project_name}</td>
      <td>${t.hours_spent}h</td><td>${t.status}</td><td>${t.priority}</td><td>${t.due_date ?? '-'}</td>
    </tr>`).join('');
  win.document.write(`
    <html><head><title>Tasks Report</title>
    <style>
      body { font-family: Arial, sans-serif; font-size: 12px; margin: 20px; }
      h1 { font-size: 18px; margin-bottom: 16px; }
      table { width: 100%; border-collapse: collapse; }
      th, td { border: 1px solid #ddd; padding: 6px 10px; text-align: left; }
      th { background: #f1f5f9; font-weight: 600; }
      tr:nth-child(even) { background: #f8fafc; }
    </style></head>
    <body>
      <h1>Tasks Report — ${new Date().toLocaleDateString()}</h1>
      <table>
        <thead><tr><th>Date</th><th>Title</th><th>Project</th><th>Hours</th><th>Status</th><th>Priority</th><th>Due</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </body></html>`);
  win.document.close();
  win.print();
}

/* ── Bulk Excel import modal ───────────────────────────────────────── */
type ImportRow = { title: string; project_id: number; task_date: string; hours_spent: number; status: string; priority: string };

function BulkImportModal({ open, onClose, projectOptions, onImport }: {
  open: boolean;
  onClose: () => void;
  projectOptions: { value: string; label: string }[];
  onImport: (tasks: ImportRow[]) => void;
}) {
  const [error, setError]     = useState('');
  const [preview, setPreview] = useState<ImportRow[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setError(''); setPreview([]);
    const raw = await parseExcelFile(file);
    const results: ImportRow[] = [];
    for (const row of raw) {
      const get = (key: string) => {
        const found = Object.keys(row).find(k => k.toLowerCase().trim() === key);
        return found ? (row[found] ?? '').trim() : '';
      };
      const title = get('title'); if (!title) continue;
      const projectName = get('project');
      const proj = projectOptions.find(p => p.label.toLowerCase() === projectName.toLowerCase());
      results.push({
        title,
        project_id:  proj ? Number(proj.value) : Number(projectOptions[0]?.value ?? 0),
        task_date:   get('date') || todayStr(),
        hours_spent: parseFloat(get('hours') || '0') || 0,
        status:      get('status') || 'pending',
        priority:    get('priority') || 'medium',
      });
    }
    if (!results.length) { setError('No valid rows found. Check column headers match the sample.'); return; }
    setPreview(results);
  };

  const handleClose = () => { setPreview([]); setError(''); onClose(); };

  return (
    <Modal open={open} onClose={handleClose} title="Bulk Import Tasks"
      footer={<>
        <Button variant="outline" size="sm" onClick={handleClose}>Cancel</Button>
        <Button size="sm" disabled={!preview.length} onClick={() => { onImport(preview); handleClose(); }}>
          Import {preview.length} tasks
        </Button>
      </>}
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">Upload an Excel file with columns: <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">Title, Project, Date, Hours, Status, Priority</code></p>
          <button
            type="button"
            onClick={() => downloadSampleExcel(
              ['Title', 'Project', 'Date', 'Hours', 'Status', 'Priority'],
              ['Stand-up meeting', 'Project Alpha', todayStr(), 0.5, 'done', 'medium'],
              'tasks-sample.xlsx',
            )}
            className="flex shrink-0 items-center gap-1 text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400"
          >
            <Download className="h-3 w-3" /> Download sample
          </button>
        </div>
        <div
          onClick={() => fileRef.current?.click()}
          className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 p-8 transition-colors hover:border-primary-400 hover:bg-primary-50/50 dark:border-slate-600 dark:hover:border-primary-600 dark:hover:bg-primary-900/10"
        >
          <Upload className="h-8 w-8 text-slate-400" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Click to upload Excel file (.xlsx)</p>
          <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleFile} className="hidden" />
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        {preview.length > 0 && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <p className="border-b border-slate-100 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              Preview — {preview.length} tasks
            </p>
            <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700">
              {preview.map((t, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <span className="font-medium truncate flex-1">{t.title}</span>
                  <span className="text-slate-400">{t.task_date}</span>
                  <span className="text-slate-400">{t.hours_spent}h</span>
                  <span className="text-slate-400">{t.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

/* ── Main page ─────────────────────────────────────────────────────── */
export default function TasksPage() {
  const qc       = useQueryClient();
  const { push } = useToastStore();
  const { options: statusOptions, keys: statusKeys } = useTaskStatuses();

  const [view, setView]                 = useState<'list' | 'kanban'>('list');
  const [filters, setFilters]           = useState<TaskFilters>({});
  const [search, setSearch]             = useState('');
  const [showFilters, setShowFilters]   = useState(false);
  const [quickPreset, setQuickPreset]   = useState('');
  const [modalOpen, setModalOpen]       = useState(false);
  const [editTarget, setEditTarget]     = useState<Task | null>(null);
  const [detailTask, setDetailTask]     = useState<Task | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);
  const [bulkSelected, setBulkSelected] = useState<Set<number>>(new Set());
  const [bulkConfirm, setBulkConfirm]   = useState(false);
  const [importOpen, setImportOpen]     = useState(false);
  const [assignTarget, setAssignTarget] = useState<Task | null>(null);

  const queryKey = ['user-tasks', filters];

  const { data: tasks, isLoading } = useQuery({
    queryKey,
    queryFn: () => tasksApi.list(filters).then(r => r.data ?? []),
  });

  const { data: projData } = useQuery({
    queryKey: ['user-projects'],
    queryFn:  () => projectsApi.userProjects().then(r => r.data ?? []),
  });

  // T shortcut = new task, Ctrl+N also works
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (modalOpen || importOpen || detailTask) return;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === 't' || e.key === 'T') { e.preventDefault(); openCreate(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') { e.preventDefault(); openCreate(); }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [modalOpen, importOpen, detailTask]);

  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { status: 'pending', priority: 'medium', issue_type: 'task', task_date: todayStr(), hours_spent: 0, recur_type: '' },
  });
  const recurType = watch('recur_type');

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['user-tasks'] });
    qc.invalidateQueries({ queryKey: ['user-dashboard'] });
  };
  const apiErr = (e: unknown) =>
    push((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed', 'error');

  const createMut = useMutation({
    mutationFn: (d: FormData) => tasksApi.create({
      ...d,
      project_id: Number(d.project_id),
      issue_type: d.issue_type || 'task',
      due_date:   d.due_date || null,
      recur_type: d.recur_type || null,
      recur_end:  d.recur_end || null,
    }),
    onSuccess: () => { invalidate(); push('Task logged', 'success'); closeModal(); },
    onError:   apiErr,
  });

  const updateMut = useMutation({
    mutationFn: ({ id, d }: { id: number; d: Partial<FormData> }) =>
      tasksApi.update(id, {
        ...d,
        project_id: d.project_id ? Number(d.project_id) : undefined,
        due_date:   d.due_date   || null,
        recur_type: d.recur_type || null,
        recur_end:  d.recur_end  || null,
      }),
    onSuccess: () => { invalidate(); push('Task updated', 'success'); closeModal(); },
    onError:   apiErr,
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => tasksApi.delete(id),
    onSuccess:  () => { invalidate(); push('Task deleted', 'success'); setDeleteTarget(null); },
  });

  const bulkDeleteMut = useMutation({
    mutationFn: async (ids: number[]) => { for (const id of ids) await tasksApi.delete(id); },
    onSuccess: () => { invalidate(); push(`${bulkSelected.size} tasks deleted`, 'success'); setBulkSelected(new Set()); setBulkConfirm(false); },
    onError:   apiErr,
  });

  const bulkImportMut = useMutation({
    mutationFn: (rows: Parameters<typeof tasksApi.bulkCreate>[0]) => tasksApi.bulkCreate(rows),
    onSuccess:  (r) => { invalidate(); push(`${r.data?.created ?? 0} tasks imported`, 'success'); },
    onError:    apiErr,
  });

  const def = { status: 'pending', priority: 'medium', issue_type: 'task', task_date: todayStr(), hours_spent: 0, recur_type: '' };
  const closeModal = () => { setModalOpen(false); setEditTarget(null); reset(def); };
  const openCreate = () => { reset(def); setEditTarget(null); setModalOpen(true); };
  const openEdit   = (t: Task) => {
    reset({
      project_id: String(t.project_id), title: t.title, description: t.description ?? '',
      hours_spent: t.hours_spent, status: t.status, priority: t.priority ?? 'medium',
      issue_type: t.issue_type ?? 'task',
      task_date: t.task_date, due_date: t.due_date ?? '', recur_type: t.recur_type ?? '', recur_end: t.recur_end ?? '',
    });
    setEditTarget(t); setModalOpen(true);
  };
  const onSubmit = (d: FormData) =>
    editTarget ? updateMut.mutate({ id: editTarget.id, d }) : createMut.mutate(d);

  const cycleStatus = (t: Task) => {
    const idx  = statusKeys.indexOf(t.status);
    const next = statusKeys[(idx + 1) % statusKeys.length];
    updateMut.mutate({ id: t.id, d: { status: next } });
  };

  const applyQuickPreset = (preset: string) => {
    const next = quickPreset === preset ? '' : preset;
    setQuickPreset(next);
    if (!next) { setFilters(f => ({ ...f, date_from: undefined, date_to: undefined })); return; }
    const { date_from, date_to } = quickRange(next);
    setFilters(f => ({ ...f, date_from, date_to }));
  };

  const projOptions = (projData ?? []).map(p => ({ value: String(p.id), label: p.name }));

  const filtered = useMemo(() => {
    const all = tasks ?? [];
    if (!search) return all;
    const q = search.toLowerCase();
    return all.filter(t => t.title.toLowerCase().includes(q) || t.project_name.toLowerCase().includes(q));
  }, [tasks, search]);

  const { sort, setSort, sorted } = useSort<Task & Record<string, unknown>>(
    filtered as (Task & Record<string, unknown>)[], 'task_date', 'desc'
  );
  const pg = usePagination(sorted);

  const hasFilters = search || Object.values(filters).some(Boolean);

  const toggleBulk = (id: number) => setBulkSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll  = () => bulkSelected.size === pg.paged.length ? setBulkSelected(new Set()) : setBulkSelected(new Set(pg.paged.map(t => t.id)));

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sort?.key !== col) return <ArrowUpDown className="h-3 w-3 opacity-40" />;
    return sort.dir === 'asc' ? <ArrowUp className="h-3 w-3 text-primary-500" /> : <ArrowDown className="h-3 w-3 text-primary-500" />;
  };

  const dueCls = (t: Task) => {
    if (!t.due_date) return '';
    const diff = Math.round((new Date(t.due_date).setHours(0,0,0,0) - new Date().setHours(0,0,0,0)) / 86400000);
    if (diff < 0)   return 'bg-red-50/60 dark:bg-red-900/10';
    if (diff === 0) return 'bg-amber-50/60 dark:bg-amber-900/10';
    return '';
  };

  if (isLoading) return <PageSpinner />;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">My Tasks</h2>
          <p className="text-sm text-slate-500">{filtered.length} tasks</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <button onClick={() => setView('list')}
              className={cn('flex items-center gap-1 px-3 py-1.5 text-xs font-medium transition-colors', view === 'list' ? 'bg-primary-600 text-white' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800')}>
              <List className="h-3.5 w-3.5" /> List
            </button>
            <button onClick={() => setView('kanban')}
              className={cn('flex items-center gap-1 px-3 py-1.5 text-xs font-medium transition-colors', view === 'kanban' ? 'bg-primary-600 text-white' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800')}>
              <LayoutGrid className="h-3.5 w-3.5" /> Kanban
            </button>
          </div>
          <Button variant="outline" size="sm" onClick={() => exportPdf(filtered)} title="Export PDF"><FileText className="h-4 w-4" /></Button>
          <Button variant="outline" size="sm" onClick={() => exportExcel(filtered)} title="Export Excel"><Download className="h-4 w-4" /></Button>
          <Button variant="outline" size="sm" onClick={() => setImportOpen(true)} title="Bulk import"><Upload className="h-4 w-4" /></Button>
          <Button variant="outline" size="sm" onClick={() => setShowFilters(f => !f)}
            className={cn(hasFilters && 'border-primary-400 text-primary-600')}>
            <Filter className="h-4 w-4" /> Filters
          </Button>
          <Button size="sm" onClick={openCreate} title="New task (T)">
            <Plus className="h-4 w-4" /> Log Task
          </Button>
        </div>
      </div>

      {/* Quick date chips */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-slate-400">Quick:</span>
        {[['today','Today'],['week','This Week'],['month','This Month']] .map(([v,l]) => (
          <button key={v} onClick={() => applyQuickPreset(v)}
            className={cn('rounded-full px-3 py-1 text-xs font-medium transition-colors',
              quickPreset === v ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300')}>
            {l}
          </button>
        ))}
        {hasFilters && (
          <button onClick={() => { setSearch(''); setFilters({}); setQuickPreset(''); }}
            className="flex items-center gap-1 rounded-full px-2 py-1 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
            <X className="h-3 w-3" /> Clear all
          </button>
        )}
      </div>

      {/* Advanced filters */}
      {showFilters && (
        <Card>
          <div className="p-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={e => { setSearch(e.target.value); pg.setPage(1); }} placeholder="Search tasks…"
                className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm focus:border-primary-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
            </div>
            <Select options={projOptions}    placeholder="All projects" value={filters.project_id ?? ''} onChange={e => { setFilters(f => ({ ...f, project_id: e.target.value || undefined })); pg.setPage(1); }} />
            <Select options={statusOptions}  placeholder="All statuses" value={filters.status ?? ''}     onChange={e => { setFilters(f => ({ ...f, status: e.target.value || undefined })); pg.setPage(1); }} />
            <Select options={priorityOptions} placeholder="All priorities" value={filters.priority ?? ''} onChange={e => { setFilters(f => ({ ...f, priority: e.target.value || undefined })); pg.setPage(1); }} />
            <div className="flex gap-2">
              <Input type="date" value={filters.date_from ?? ''} onChange={e => { setFilters(f => ({ ...f, date_from: e.target.value || undefined })); setQuickPreset(''); }} />
              <Input type="date" value={filters.date_to   ?? ''} onChange={e => { setFilters(f => ({ ...f, date_to:   e.target.value || undefined })); setQuickPreset(''); }} />
            </div>
          </div>
        </Card>
      )}

      {/* Bulk action bar */}
      {bulkSelected.size > 0 && (
        <div className="flex items-center justify-between rounded-xl bg-primary-50 px-4 py-2.5 dark:bg-primary-900/20">
          <span className="flex items-center gap-2 text-sm font-medium text-primary-700 dark:text-primary-300">
            <CheckSquare2 className="h-4 w-4" /> {bulkSelected.size} selected
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setBulkSelected(new Set())}><X className="h-3.5 w-3.5" /> Deselect</Button>
            <Button variant="outline" size="sm" onClick={() => setBulkConfirm(true)}
              className="border-red-300 text-red-600 hover:bg-red-50">
              <Trash2 className="h-3.5 w-3.5" /> Delete {bulkSelected.size}
            </Button>
          </div>
        </div>
      )}

      {/* Kanban view */}
      {view === 'kanban' && (
        <KanbanBoard tasks={filtered} queryKey={queryKey} onOpenTask={setDetailTask} />
      )}

      {/* List view */}
      {view === 'list' && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
                  <th className="w-10 px-3 py-3">
                    <input type="checkbox" checked={pg.paged.length > 0 && bulkSelected.size === pg.paged.length} onChange={toggleAll}
                      className="rounded border-slate-300 text-primary-600 focus:ring-primary-500" />
                  </th>
                  {([['title','Task'],['project_name','Project'],['status','Status'],['priority','Priority'],['hours_spent','Hours'],['due_date','Due'],['task_date','Date']] as [SortKey,string][]).map(([key,label]) => (
                    <th key={key} className="px-4 py-3 text-left">
                      <button onClick={() => setSort(key)} className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                        {label} <SortIcon col={key} />
                      </button>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Assignee</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Assigned By</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {pg.paged.map(t => (
                  <tr key={t.id} className={cn('transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40', dueCls(t), bulkSelected.has(t.id) && 'bg-primary-50/60 dark:bg-primary-900/10')}>
                    <td className="px-3 py-3">
                      <input type="checkbox" checked={bulkSelected.has(t.id)} onChange={() => toggleBulk(t.id)}
                        className="rounded border-slate-300 text-primary-600 focus:ring-primary-500" />
                    </td>
                    <td className="px-4 py-3 max-w-[220px]">
                      <button onClick={() => setDetailTask(t)} className="text-left group w-full">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <IssueTypeIcon type={t.issue_type ?? 'task'} />
                          <p className="font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-primary-600 dark:group-hover:text-primary-400">{t.title}</p>
                        </div>
                        <div className="flex items-center gap-1 pl-5">
                          {t.subtask_total > 0 && <span className="text-[10px] text-slate-400">{t.subtask_done}/{t.subtask_total} subtasks</span>}
                          {t.recur_type && <RefreshCw className="h-2.5 w-2.5 text-violet-400" />}
                        </div>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">{t.project_name}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => cycleStatus(t)} title="Click to cycle status" className="transition-transform hover:scale-105">
                        {taskStatusBadge(t.status)}
                      </button>
                    </td>
                    <td className="px-4 py-3">{priorityBadge(t.priority ?? 'medium')}</td>
                    <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap">{formatHours(t.hours_spent)}</td>
                    <td className="px-4 py-3">{dueDateBadge(t.due_date)}</td>
                    <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">{formatDate(t.task_date)}</td>
                    <td className="px-4 py-3">
                      {t.assignee_name ? (
                        <div className="flex items-center gap-1.5">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-500 text-[9px] font-bold text-white flex-shrink-0">
                            {t.assignee_name.charAt(0).toUpperCase()}
                          </span>
                          <span className="text-xs text-slate-600 dark:text-slate-300 truncate max-w-[80px]">{t.assignee_name}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-300 dark:text-slate-600">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {t.user_name ? (
                        <div className="flex items-center gap-1.5">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-400 text-[9px] font-bold text-white flex-shrink-0">
                            {t.user_name.charAt(0).toUpperCase()}
                          </span>
                          <span className="text-xs text-slate-600 dark:text-slate-300 truncate max-w-[80px]">{t.user_name}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-300 dark:text-slate-600">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setDetailTask(t)} title="View details"><Eye className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => openEdit(t)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => setAssignTarget(t)} title="Assign to member"><UserCog className="h-3.5 w-3.5 text-violet-400" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(t)}><Trash2 className="h-3.5 w-3.5 text-red-400" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {pg.totalItems === 0 && (
              <EmptyState icon={ClipboardList}
                title={hasFilters ? 'No tasks match your filters' : 'No tasks yet'}
                description={hasFilters ? 'Try adjusting your filters' : 'Log your first task — press T'}
                action={!hasFilters ? <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4" /> Log Task</Button> : undefined}
              />
            )}
          </div>
          {pg.totalItems > 0 && <div className="border-t border-slate-100 px-4 dark:border-slate-700"><Pagination {...pg} /></div>}
        </Card>
      )}

      {/* Floating quick-add hint */}
      <div className="fixed bottom-6 right-6 z-30">
        <button onClick={openCreate}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-600 shadow-lg shadow-primary-600/30 text-white hover:bg-primary-700 transition-all hover:scale-105 active:scale-95"
          title="New task (T)">
          <Plus className="h-6 w-6" />
        </button>
      </div>

      {/* Create / Edit Modal */}
      <Modal open={modalOpen} onClose={closeModal} title={editTarget ? 'Edit Task' : 'Log Task'}
        footer={<>
          <Button variant="outline" size="sm" onClick={closeModal}>Cancel</Button>
          <Button size="sm" loading={isSubmitting} onClick={handleSubmit(onSubmit)}>{editTarget ? 'Save' : 'Log'}</Button>
        </>}
      >
        <form className="flex flex-col gap-4">
          <Select label="Project" required options={projOptions} placeholder="Select project" error={errors.project_id?.message} {...register('project_id')} />
          <Input  label="Title"   required error={errors.title?.message} {...register('title')} />
          <Textarea label="Description" rows={2} {...register('description')} />
          <div className="grid grid-cols-3 gap-3">
            <Select label="Issue Type" options={issueTypeOptions} {...register('issue_type')} />
            <Select label="Status"     options={statusOptions}    {...register('status')} />
            <Select label="Priority"   options={priorityOptions}  {...register('priority')} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input label="Hours"    type="number" step="0.5" min="0" max="24" {...register('hours_spent')} />
            <Input label="Date"     type="date" {...register('task_date')} />
            <Input label="Due Date" type="date" {...register('due_date')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select label="Repeat" options={recurOptions} {...register('recur_type')} />
            {recurType && <Input label="Repeat until" type="date" {...register('recur_end')} />}
          </div>
        </form>
      </Modal>

      {/* Task detail modal */}
      {detailTask && (
        <TaskDetailModal
          task={detailTask}
          onClose={() => setDetailTask(null)}
          onEdit={t => { setDetailTask(null); openEdit(t); }}
        />
      )}

      {/* Bulk import */}
      <BulkImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        projectOptions={projOptions}
        onImport={rows => bulkImportMut.mutate(rows)}
      />

      {/* Delete confirms */}
      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMut.mutate(deleteTarget!.id)} loading={deleteMut.isPending}
        message={`Delete "${deleteTarget?.title}"?`} />
      <ConfirmDialog open={bulkConfirm} onClose={() => setBulkConfirm(false)}
        onConfirm={() => bulkDeleteMut.mutate([...bulkSelected])} loading={bulkDeleteMut.isPending}
        message={`Delete ${bulkSelected.size} selected tasks? This cannot be undone.`} />

      <ReassignModal
        task={assignTarget}
        open={!!assignTarget}
        onClose={() => setAssignTarget(null)}
        onDone={() => { qc.invalidateQueries({ queryKey: ['user-tasks'] }); }}
      />
    </div>
  );
}
