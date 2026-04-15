import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  type DragStartEvent, type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Zap, Plus, ChevronDown, ChevronRight, Clock,
  CheckSquare, Play, CheckCheck, Trash2, Pencil, LayoutList,
  BookOpen, Bug, SquareCheck, Crown,
} from 'lucide-react';
import { sprintsApi, type Sprint } from '@/api/sprints';
import { membersApi, type ProjectMember } from '@/api/members';
import { useAuthStore } from '@/store/authStore';
import { projectsApi } from '@/api/projects';
import { tasksApi } from '@/api/tasks';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { TaskDetailModal } from '@/components/shared/TaskDetailModal';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { useToastStore } from '@/store/toastStore';
import { cn, formatDate } from '@/utils/helpers';
import { useTaskStatuses } from '@/hooks/useTaskStatuses';
import type { Task, TaskStatus, IssueType } from '@/types';

/* ── Issue type config ────────────────────────────────────────────── */
const ISSUE_TYPES: Record<IssueType, {
  label: string;
  Icon: React.FC<{ className?: string }>;
  color: string;
  bg: string;
  ring: string;
}> = {
  story: { label: 'Story', Icon: BookOpen,    color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30', ring: 'ring-emerald-400' },
  bug:   { label: 'Bug',   Icon: Bug,         color: 'text-red-500',     bg: 'bg-red-100 dark:bg-red-900/30',         ring: 'ring-red-400' },
  task:  { label: 'Task',  Icon: SquareCheck, color: 'text-blue-500',    bg: 'bg-blue-100 dark:bg-blue-900/30',       ring: 'ring-blue-400' },
  epic:  { label: 'Epic',  Icon: Crown,       color: 'text-violet-600',  bg: 'bg-violet-100 dark:bg-violet-900/30',   ring: 'ring-violet-400' },
};

function IssueIcon({ type, className }: { type: IssueType; className?: string }) {
  const cfg = ISSUE_TYPES[type] ?? ISSUE_TYPES.task;
  return (
    <span className={cn('inline-flex items-center justify-center rounded-sm p-0.5', cfg.bg)}>
      <cfg.Icon className={cn('h-3 w-3', cfg.color, className)} />
    </span>
  );
}

const PRIORITY_DOT: Record<string, string> = {
  critical: 'bg-red-500',
  high:     'bg-orange-400',
  medium:   'bg-yellow-400',
  low:      'bg-slate-300',
};

/* ── Edit issue modal ────────────────────────────────────────────── */
function EditIssueModal({ task, open, onClose, statusOptions, onSave, loading }: {
  task: Task;
  open: boolean;
  onClose: () => void;
  statusOptions: { value: string; label: string }[];
  onSave: (data: Record<string, unknown>) => void;
  loading?: boolean;
}) {
  const [title, setTitle]   = useState(task.title);
  const [status, setStatus] = useState<string>(task.status);
  const [priority, setPriority] = useState<string>(task.priority ?? 'medium');

  const priorityOptions = [
    { value: 'low',      label: 'Low' },
    { value: 'medium',   label: 'Medium' },
    { value: 'high',     label: 'High' },
    { value: 'critical', label: 'Critical' },
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit Issue"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" loading={loading} onClick={() => onSave({ title, status, priority })}>
            Save
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Input
          label="Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Status"
            options={statusOptions}
            value={status}
            onChange={e => setStatus(e.target.value)}
          />
          <Select
            label="Priority"
            options={priorityOptions}
            value={priority}
            onChange={e => setPriority(e.target.value)}
          />
        </div>
      </div>
    </Modal>
  );
}

/* ── Jira-style Kanban card ───────────────────────────────────────── */
function SprintCard({ task, onOpen, overlay, viewOnly, onEdit, onDelete }: {
  task: Task;
  onOpen: (t: Task) => void;
  overlay?: boolean;
  viewOnly?: boolean;
  onEdit?: (t: Task) => void;
  onDelete?: (t: Task) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id, disabled: viewOnly });

  const issueType = (task.issue_type ?? 'task') as IssueType;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'group rounded-lg border bg-white p-3 shadow-sm dark:bg-slate-900 dark:border-slate-700',
        'cursor-pointer hover:shadow-md transition-shadow',
        isDragging ? 'opacity-30' : '',
        overlay ? 'rotate-1 scale-105 shadow-2xl cursor-grabbing' : '',
      )}
      onClick={() => !overlay && onOpen(task)}
    >
      {/* Top row: issue type + actions + drag */}
      <div className="flex items-center justify-between mb-2">
        <IssueIcon type={issueType} />
        <div className="flex items-center gap-0.5">
          {!viewOnly && onEdit && (
            <button
              onClick={e => { e.stopPropagation(); onEdit(task); }}
              className="rounded p-0.5 opacity-0 group-hover:opacity-60 text-slate-400 hover:opacity-100 hover:text-primary-500 transition-opacity"
              title="Edit issue"
            >
              <Pencil className="h-3 w-3" />
            </button>
          )}
          {!viewOnly && onDelete && (
            <button
              onClick={e => { e.stopPropagation(); onDelete(task); }}
              className="rounded p-0.5 opacity-0 group-hover:opacity-60 text-slate-400 hover:opacity-100 hover:text-red-500 transition-opacity"
              title="Delete issue"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
          {!viewOnly && (
            <button
              {...attributes}
              {...listeners}
              onClick={e => e.stopPropagation()}
              className="cursor-grab opacity-0 group-hover:opacity-60 text-slate-400 hover:opacity-100 ml-0.5"
            >
              <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 16 16">
                <circle cx="5" cy="4" r="1.2"/><circle cx="11" cy="4" r="1.2"/>
                <circle cx="5" cy="8" r="1.2"/><circle cx="11" cy="8" r="1.2"/>
                <circle cx="5" cy="12" r="1.2"/><circle cx="11" cy="12" r="1.2"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Title */}
      <p className="text-sm font-medium leading-snug text-slate-800 dark:text-slate-100 mb-2 line-clamp-2">
        {task.title}
      </p>

      {/* Bottom meta row */}
      <div className="flex items-center justify-between gap-1 flex-wrap">
        <div className="flex items-center gap-1.5">
          {/* Priority dot */}
          <span
            title={task.priority}
            className={cn('h-2 w-2 rounded-full flex-shrink-0', PRIORITY_DOT[task.priority] ?? 'bg-slate-300')}
          />
          {/* Story points */}
          {task.story_points != null && (
            <span className="rounded bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-300">
              {task.story_points}
            </span>
          )}
          {/* Subtask count */}
          {task.subtask_total > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] text-slate-400">
              <CheckSquare className="h-3 w-3" />
              {task.subtask_done}/{task.subtask_total}
            </span>
          )}
          {/* Time */}
          {task.hours_spent > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] text-slate-400">
              <Clock className="h-3 w-3" />{task.hours_spent}h
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {/* Due date */}
          {task.due_date && (
            <span className="text-[10px] text-slate-400">{formatDate(task.due_date)}</span>
          )}
          {/* Assignee avatar */}
          {task.assignee_name ? (
            <span
              title={task.assignee_name}
              className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-500 text-[9px] font-bold text-white flex-shrink-0"
            >
              {task.assignee_name.charAt(0).toUpperCase()}
            </span>
          ) : (
            <span className="flex h-5 w-5 items-center justify-center rounded-full border border-dashed border-slate-300 dark:border-slate-600 text-[9px] text-slate-300" />
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Sprint Kanban board ──────────────────────────────────────────── */
function SprintBoard({ sprint, onOpenTask, viewOnly }: {
  sprint: Sprint;
  onOpenTask: (t: Task) => void;
  viewOnly?: boolean;
}) {
  const qc      = useQueryClient();
  const toast   = useToastStore();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: viewOnly ? { distance: 999999 } : { distance: 8 } }));
  const [active, setActive]           = useState<Task | null>(null);
  const [editTarget, setEditTarget]   = useState<Task | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);

  const { cols, options: statusOptions } = useTaskStatuses();
  const tasks = sprint.tasks ?? [];

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['sprint', sprint.id] });
    qc.invalidateQueries({ queryKey: ['sprints'] });
  };

  const updateMut = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => tasksApi.update(id, { status }),
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: ['sprint', sprint.id] });
      const prev = qc.getQueryData(['sprint', sprint.id]);
      qc.setQueryData(['sprint', sprint.id], (old: { data: Sprint } | undefined) => {
        if (!old?.data?.tasks) return old;
        return {
          ...old,
          data: {
            ...old.data,
            tasks: old.data.tasks.map(t => t.id === id ? { ...t, status: status as TaskStatus } : t),
          },
        };
      });
      return { prev };
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) qc.setQueryData(['sprint', sprint.id], ctx.prev); },
    onSettled: () => qc.invalidateQueries({ queryKey: ['sprint', sprint.id] }),
  });

  const editMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) => tasksApi.update(id, data),
    onSuccess: () => { toast.push('Issue updated', 'success'); setEditTarget(null); invalidate(); },
    onError:   (e: Error) => toast.push(e.message, 'error'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => tasksApi.delete(id),
    onSuccess: () => { toast.push('Issue deleted', 'success'); setDeleteTarget(null); invalidate(); },
    onError:   (e: Error) => toast.push(e.message, 'error'),
  });

  const byStatus = (s: string) => tasks.filter(t => t.status === s);

  const onDragStart = (e: DragStartEvent) => setActive(tasks.find(t => t.id === e.active.id) ?? null);
  const onDragEnd   = (e: DragEndEvent) => {
    setActive(null);
    const { active: a, over } = e;
    if (!over) return;
    const dragged  = tasks.find(t => t.id === a.id);
    if (!dragged) return;
    const overTask = tasks.find(t => t.id === over.id);
    const newStatus = (overTask ? overTask.status : over.id) as TaskStatus;
    if (newStatus && newStatus !== dragged.status) {
      updateMut.mutate({ id: dragged.id, status: newStatus });
    }
  };

  return (
    <>
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {cols.map(col => (
          <div key={col.key} className="flex w-64 shrink-0 flex-col gap-2">
            {/* Column header */}
            <div className={cn(
              'flex items-center justify-between rounded-lg border-l-4 bg-slate-50 dark:bg-slate-800 px-3 py-2',
              col.color,
            )}>
              <div className="flex items-center gap-2">
                <span className={cn('h-2 w-2 rounded-full', col.dot)} />
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
                  {col.label}
                </span>
              </div>
              <span className="rounded-full bg-slate-200 dark:bg-slate-700 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                {byStatus(col.key).length}
              </span>
            </div>

            <SortableContext items={byStatus(col.key).map(t => t.id)} strategy={verticalListSortingStrategy}>
              <div className="flex min-h-[80px] flex-col gap-2 rounded-lg bg-slate-100/60 dark:bg-slate-800/30 p-1.5">
                {byStatus(col.key).map(t => (
                  <SprintCard
                    key={t.id}
                    task={t}
                    onOpen={onOpenTask}
                    viewOnly={viewOnly}
                    onEdit={!viewOnly ? setEditTarget : undefined}
                    onDelete={!viewOnly ? setDeleteTarget : undefined}
                  />
                ))}
                {byStatus(col.key).length === 0 && (
                  <p className="py-6 text-center text-[10px] text-slate-400">No issues</p>
                )}
              </div>
            </SortableContext>
          </div>
        ))}
      </div>
      <DragOverlay>
        {active && <SprintCard task={active} onOpen={() => {}} overlay />}
      </DragOverlay>
    </DndContext>

    {/* Edit issue modal */}
    {editTarget && (
      <EditIssueModal
        task={editTarget}
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        statusOptions={statusOptions}
        onSave={(data) => editMut.mutate({ id: editTarget.id, data })}
        loading={editMut.isPending}
      />
    )}

    {/* Delete confirm */}
    <ConfirmDialog
      open={!!deleteTarget}
      onClose={() => setDeleteTarget(null)}
      onConfirm={() => deleteMut.mutate(deleteTarget!.id)}
      loading={deleteMut.isPending}
      title="Delete Issue"
      message={`Delete "${deleteTarget?.title}"? This cannot be undone.`}
    />
    </>
  );
}

/* ── Create Issue Modal ───────────────────────────────────────────── */
function CreateIssueModal({
  open, onClose, sprintId, projectId, members, onCreated, statusOptions,
}: {
  open: boolean;
  onClose: () => void;
  sprintId: number;
  projectId: number;
  members: ProjectMember[];
  onCreated: () => void;
  statusOptions: { value: string; label: string }[];
}) {
  const toast = useToastStore();
  const [form, setForm] = useState({
    issue_type:   'story' as IssueType,
    title:        '',
    description:  '',
    priority:     'medium',
    story_points: '',
    assignee_id:  '',
    due_date:     '',
    status:       'pending',
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const createMut = useMutation({
    mutationFn: () => tasksApi.create({
      project_id:   projectId,
      sprint_id:    sprintId,
      issue_type:   form.issue_type,
      title:        form.title.trim(),
      description:  form.description.trim() || undefined,
      priority:     form.priority,
      status:       form.status,
      story_points: form.story_points !== '' ? Number(form.story_points) : null,
      assignee_id:  form.assignee_id ? Number(form.assignee_id) : null,
      due_date:     form.due_date || null,
      task_date:    new Date().toISOString().slice(0, 10),
    }),
    onSuccess: () => {
      toast.push('Issue created', 'success');
      setForm({ issue_type: 'story', title: '', description: '', priority: 'medium', story_points: '', assignee_id: '', due_date: '', status: 'pending' });
      onCreated();
      onClose();
    },
    onError: (e: Error) => toast.push(e.message, 'error'),
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create Issue"
      size="lg"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" loading={createMut.isPending} disabled={!form.title.trim()} onClick={() => createMut.mutate()}>
            Create Issue
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {/* Issue type selector */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Issue Type</p>
          <div className="flex gap-2 flex-wrap">
            {(Object.entries(ISSUE_TYPES) as [IssueType, typeof ISSUE_TYPES[IssueType]][]).map(([key, cfg]) => (
              <button
                key={key}
                type="button"
                onClick={() => set('issue_type', key)}
                className={cn(
                  'flex items-center gap-2 rounded-lg border-2 px-3 py-2 text-sm font-medium transition-all',
                  form.issue_type === key
                    ? `border-current ${cfg.color} ${cfg.bg}`
                    : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300 dark:hover:border-slate-600',
                )}
              >
                <cfg.Icon className={cn('h-4 w-4', form.issue_type === key ? cfg.color : 'text-slate-400')} />
                {cfg.label}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <Input
          label="Summary"
          required
          placeholder="What needs to be done?"
          value={form.title}
          onChange={e => set('title', e.target.value)}
        />

        {/* Description */}
        <Textarea
          label="Description"
          rows={3}
          placeholder="Add more detail..."
          value={form.description}
          onChange={e => set('description', e.target.value)}
        />

        {/* Row: Status + Priority */}
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Status"
            options={statusOptions}
            value={form.status}
            onChange={e => set('status', e.target.value)}
          />
          <Select
            label="Priority"
            options={[
              { value: 'low',      label: 'Low' },
              { value: 'medium',   label: 'Medium' },
              { value: 'high',     label: 'High' },
              { value: 'critical', label: 'Critical' },
            ]}
            value={form.priority}
            onChange={e => set('priority', e.target.value)}
          />
        </div>

        {/* Row: Story Points + Due Date */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Story Points"
            type="number"
            min={0}
            max={100}
            placeholder="e.g. 3"
            value={form.story_points}
            onChange={e => set('story_points', e.target.value)}
          />
          <Input
            label="Due Date"
            type="date"
            value={form.due_date}
            onChange={e => set('due_date', e.target.value)}
          />
        </div>

        {/* Assignee */}
        {members.length > 0 && (
          <div>
            <p className="mb-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">Assignee</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => set('assignee_id', '')}
                className={cn(
                  'flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition-all',
                  !form.assignee_id
                    ? 'border-primary-400 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                    : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300',
                )}
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full border border-dashed border-current text-[9px]">?</span>
                Unassigned
              </button>
              {members.map(m => (
                <button
                  key={m.user_id}
                  type="button"
                  onClick={() => set('assignee_id', String(m.user_id))}
                  className={cn(
                    'flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition-all',
                    form.assignee_id === String(m.user_id)
                      ? 'border-primary-400 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300',
                  )}
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-500 text-[9px] font-bold text-white flex-shrink-0">
                    {m.name.charAt(0).toUpperCase()}
                  </span>
                  {m.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

/* ── Sprint Row (accordion) ───────────────────────────────────────── */
function SprintRow({
  sprint, onEdit, onDelete, onStart, onComplete, onOpenTask, isManager, projectId,
}: {
  sprint: Sprint;
  onEdit: () => void;
  onDelete: () => void;
  onStart: () => void;
  onComplete: () => void;
  onOpenTask: (t: Task) => void;
  isManager: boolean;
  projectId: number;
}) {
  const qc = useQueryClient();
  const { options: statusOptions } = useTaskStatuses();
  const [open, setOpen]           = useState(sprint.status === 'active');
  const [createOpen, setCreate]   = useState(false);

  const { data: detail, isFetching } = useQuery({
    queryKey: ['sprint', sprint.id],
    queryFn:  () => sprintsApi.get(sprint.id).then(r => r.data!),
    enabled: open,
  });

  const { data: members = [] } = useQuery({
    queryKey: ['project-members-user', projectId],
    queryFn:  () => membersApi.forProject(projectId).then(r => r.data ?? []),
    enabled: open && isManager,
  });

  const pct   = sprint.total_points > 0 ? Math.round((sprint.done_points / sprint.total_points) * 100) : 0;
  const tasks = detail?.tasks ?? [];

  const statusColor =
    sprint.status === 'active'    ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400' :
    sprint.status === 'completed' ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                    'text-slate-500 bg-slate-100 dark:bg-slate-700 dark:text-slate-400';

  const typeCounts = tasks.reduce<Record<string, number>>((acc, t) => {
    const k = t.issue_type ?? 'task';
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
      {/* Sprint header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <button onClick={() => setOpen(v => !v)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors">
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
        <Zap className="h-4 w-4 shrink-0 text-primary-500" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-900 dark:text-white">{sprint.name}</span>
            <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium capitalize', statusColor)}>
              {sprint.status}
            </span>
            {/* Issue type mini counts */}
            <div className="flex items-center gap-1">
              {(Object.entries(typeCounts) as [IssueType, number][]).map(([type, count]) => (
                <span key={type} className="flex items-center gap-0.5">
                  <IssueIcon type={type} />
                  <span className="text-[10px] text-slate-400">{count}</span>
                </span>
              ))}
            </div>
            {sprint.goal && <span className="text-xs text-slate-400 truncate">· {sprint.goal}</span>}
          </div>
          <div className="mt-0.5 flex items-center gap-3 text-[10px] text-slate-400">
            <span>{sprint.task_count} issues · {sprint.done_count} done</span>
            {sprint.total_points > 0 && <span>{sprint.done_points}/{sprint.total_points} SP · {pct}%</span>}
            {sprint.start_date && <span>{formatDate(sprint.start_date)} → {sprint.end_date ? formatDate(sprint.end_date) : '?'}</span>}
          </div>
        </div>

        {/* Progress bar */}
        {sprint.total_points > 0 && (
          <div className="hidden w-24 sm:block">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
              <div className="h-full rounded-full bg-primary-500 transition-all" style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-0.5 text-right text-[9px] text-slate-400">{pct}%</p>
          </div>
        )}

        {/* Manager actions */}
        {isManager && (
          <div className="flex shrink-0 items-center gap-1">
            {sprint.status === 'planning' && (
              <button onClick={onStart} className="flex items-center gap-1 rounded-lg bg-blue-100 dark:bg-blue-900/30 px-2 py-1 text-[10px] font-medium text-blue-700 dark:text-blue-400 hover:bg-blue-200 transition-colors">
                <Play className="h-3 w-3" /> Start
              </button>
            )}
            {sprint.status === 'active' && (
              <button onClick={onComplete} className="flex items-center gap-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 px-2 py-1 text-[10px] font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 transition-colors">
                <CheckCheck className="h-3 w-3" /> Complete
              </button>
            )}
            <button onClick={onEdit} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-primary-600 transition-colors">
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button onClick={onDelete} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-colors">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Kanban board */}
      {open && (
        <div className="border-t border-slate-100 dark:border-slate-700 p-4">
          {isFetching && !detail ? (
            <p className="py-8 text-center text-xs text-slate-400">Loading…</p>
          ) : tasks.length === 0 && !isManager ? (
            <p className="py-8 text-center text-xs text-slate-400">No issues in this sprint yet.</p>
          ) : (
            <SprintBoard sprint={{ ...sprint, tasks }} onOpenTask={onOpenTask} viewOnly={!isManager} />
          )}

          {/* Manager: Create Issue button */}
          {isManager && (
            <div className="mt-3">
              <button
                onClick={() => setCreate(true)}
                className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-700 py-2.5 text-sm text-slate-400 hover:border-primary-400 hover:text-primary-500 dark:hover:border-primary-600 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Create Issue
              </button>
            </div>
          )}
        </div>
      )}

      {/* Create Issue modal */}
      {isManager && (
        <CreateIssueModal
          open={createOpen}
          onClose={() => setCreate(false)}
          sprintId={sprint.id}
          projectId={projectId}
          members={members as ProjectMember[]}
          statusOptions={statusOptions}
          onCreated={() => {
            qc.invalidateQueries({ queryKey: ['sprint', sprint.id] });
            qc.invalidateQueries({ queryKey: ['sprints'] });
          }}
        />
      )}
    </div>
  );
}

/* ── Backlog section ──────────────────────────────────────────────── */
function BacklogSection({ projectId, sprints, onOpenTask }: {
  projectId: number;
  sprints: Sprint[];
  onOpenTask: (t: Task) => void;
}) {
  const [open, setOpen]           = useState(false);
  const [selected, setSelected]   = useState<number[]>([]);
  const [targetSprint, setTarget] = useState('');
  const qc    = useQueryClient();
  const toast = useToastStore();

  const { data: backlog = [] } = useQuery({
    queryKey: ['backlog', projectId],
    queryFn:  () => sprintsApi.backlog(projectId).then(r => r.data ?? []),
    enabled: open,
  });

  const assignMut = useMutation({
    mutationFn: () => Promise.all(selected.map(id => sprintsApi.assignTask(Number(targetSprint), id))),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['backlog', projectId] });
      qc.invalidateQueries({ queryKey: ['sprints', projectId] });
      setSelected([]);
      toast.push(`${selected.length} issue(s) moved to sprint`, 'success');
    },
    onError: (e: Error) => toast.push(e.message, 'error'),
  });

  const toggle = (id: number) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const activeSprints = sprints.filter(s => s.status !== 'completed');

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex w-full items-center gap-3 p-4 text-left"
      >
        {open ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
        <LayoutList className="h-4 w-4 text-slate-500" />
        <span className="font-semibold text-slate-900 dark:text-white">Backlog</span>
        <span className="ml-auto text-xs text-slate-400">Issues not in any sprint</span>
      </button>

      {open && (
        <div className="border-t border-slate-100 dark:border-slate-700">
          {selected.length > 0 && activeSprints.length > 0 && (
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-700 bg-primary-50 dark:bg-primary-900/20 px-4 py-2">
              <span className="text-xs font-medium text-primary-700 dark:text-primary-400">{selected.length} selected</span>
              <select
                value={targetSprint}
                onChange={e => setTarget(e.target.value)}
                className="flex-1 rounded-lg border border-primary-200 dark:border-primary-700 bg-white dark:bg-slate-800 dark:text-white px-2 py-1 text-xs"
              >
                <option value="">— Move to sprint —</option>
                {activeSprints.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <Button size="sm" disabled={!targetSprint} loading={assignMut.isPending} onClick={() => assignMut.mutate()}>
                Move
              </Button>
            </div>
          )}
          {backlog.length === 0 ? (
            <p className="py-8 text-center text-xs text-slate-400">All issues are assigned to sprints.</p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {(backlog as Task[]).map(t => (
                <div key={t.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                  <input
                    type="checkbox"
                    checked={selected.includes(t.id)}
                    onChange={() => toggle(t.id)}
                    className="h-3.5 w-3.5 rounded border-slate-300 accent-primary-600"
                  />
                  <IssueIcon type={(t.issue_type ?? 'task') as IssueType} />
                  <button
                    onClick={() => onOpenTask(t)}
                    className="flex-1 text-left text-sm text-slate-700 dark:text-slate-300 hover:text-primary-600"
                  >
                    {t.title}
                  </button>
                  <div className="flex items-center gap-2">
                    <span className={cn('h-2 w-2 rounded-full', PRIORITY_DOT[t.priority] ?? 'bg-slate-300')} title={t.priority} />
                    {t.story_points != null && (
                      <span className="rounded bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                        {t.story_points}
                      </span>
                    )}
                    {t.due_date && <span className="text-[10px] text-slate-400">{formatDate(t.due_date)}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────────── */
export default function SprintPage() {
  const qc         = useQueryClient();
  const toast      = useToastStore();
  const { user: me } = useAuthStore();

  const { data: projects = [] } = useQuery({
    queryKey: ['user-projects'],
    queryFn:  () => projectsApi.userProjects().then(r => r.data ?? []),
  });

  const entities = Array.from(
    new Map(projects.map((p: { entity_id: number; entity_name: string }) => [p.entity_id, p.entity_name])).entries()
  ).map(([id, name]) => ({ id: id as number, name: name as string }));

  const [entityId, setEntityId]   = useState<number | null>(null);
  const [projectId, setProjectId] = useState<number | null>(null);

  const selectedEid     = entityId ?? (entities[0]?.id ?? null);
  const entityProjects  = projects.filter((p: { entity_id: number }) => p.entity_id === selectedEid);
  const selectedPid     = projectId ?? (entityProjects[0]?.id ?? null);

  const { data: sprints = [], isLoading } = useQuery({
    queryKey: ['sprints', selectedPid],
    queryFn:  () => sprintsApi.list(selectedPid!).then(r => r.data ?? []),
    enabled:  !!selectedPid,
  });

  const { data: myMembership } = useQuery({
    queryKey: ['my-membership', selectedPid],
    queryFn:  () => membersApi.forProject(selectedPid!).then(r => r.data ?? []),
    enabled:  !!selectedPid,
  });
  // True only if the logged-in user has the 'manager' role in this project
  const isManager = me?.role === 'admin' ||
    ((myMembership as ProjectMember[] | undefined)?.some(
      m => m.user_id === me?.id && m.role === 'manager'
    ) ?? false);

  const [modal, setModal]           = useState<'create' | 'edit' | null>(null);
  const [editing, setEditing]       = useState<Sprint | null>(null);
  const [form, setForm]             = useState({ name: '', goal: '', start_date: '', end_date: '' });
  const [deleteTarget, setDeleteTarget] = useState<Sprint | null>(null);
  const [dateError, setDateError]   = useState('');
  const [openTask, setOpenTask]     = useState<Task | null>(null);

  const openCreate = () => { setEditing(null); setForm({ name: '', goal: '', start_date: '', end_date: '' }); setDateError(''); setModal('create'); };
  const openEdit   = (s: Sprint) => { setEditing(s); setForm({ name: s.name, goal: s.goal ?? '', start_date: s.start_date ?? '', end_date: s.end_date ?? '' }); setDateError(''); setModal('edit'); };
  const close      = () => { setModal(null); setEditing(null); setDateError(''); };

  const handleSave = () => {
    if (form.start_date && form.end_date && form.end_date < form.start_date) {
      setDateError('End date must be on or after start date');
      return;
    }
    setDateError('');
    saveMut.mutate();
  };

  const saveMut = useMutation({
    mutationFn: async () => {
      if (editing) { await sprintsApi.update(editing.id, form); return; }
      await sprintsApi.create(selectedPid!, form);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sprints', selectedPid] }); close(); toast.push(editing ? 'Sprint updated' : 'Sprint created', 'success'); },
    onError: (e: Error) => toast.push(e.message, 'error'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => sprintsApi.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sprints', selectedPid] }); setDeleteTarget(null); toast.push('Sprint deleted', 'success'); },
    onError: (e: Error) => toast.push(e.message, 'error'),
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => sprintsApi.update(id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sprints', selectedPid] }),
    onError: (e: Error) => toast.push(e.message, 'error'),
  });

  const entityOptions  = entities.map(e => ({ value: String(e.id), label: e.name }));
  const projectOptions = entityProjects.map((p: { id: number; name: string }) => ({ value: String(p.id), label: p.name }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Sprint Board</h1>
          <p className="mt-1 text-sm text-slate-500">Plan, track and manage sprints across your project</p>
        </div>
        <div className="flex items-center gap-2">
          {entities.length > 0 && (
            <Select
              options={entityOptions}
              value={String(selectedEid ?? '')}
              onChange={e => { setEntityId(Number(e.target.value)); setProjectId(null); }}
            />
          )}
          {entityProjects.length > 0 && (
            <Select
              options={projectOptions}
              value={String(selectedPid ?? '')}
              onChange={e => setProjectId(Number(e.target.value))}
            />
          )}
          {isManager && (
            <Button size="sm" onClick={openCreate} disabled={!selectedPid}>
              <Plus className="h-4 w-4" /> New Sprint
            </Button>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Issue Types</span>
        {(Object.entries(ISSUE_TYPES) as [IssueType, typeof ISSUE_TYPES[IssueType]][]).map(([key, cfg]) => (
          <span key={key} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
            <cfg.Icon className={cn('h-3.5 w-3.5', cfg.color)} />
            {cfg.label}
          </span>
        ))}
        <span className="ml-auto flex items-center gap-3 text-xs text-slate-400">
          {(['critical','high','medium','low'] as const).map(p => (
            <span key={p} className="flex items-center gap-1 capitalize">
              <span className={cn('h-2 w-2 rounded-full', PRIORITY_DOT[p])} />{p}
            </span>
          ))}
        </span>
      </div>

      {/* Sprint list */}
      {!selectedPid ? (
        <p className="py-16 text-center text-sm text-slate-400">Select a project to view sprints</p>
      ) : isLoading ? (
        <p className="py-16 text-center text-sm text-slate-400">Loading…</p>
      ) : (
        <div className="space-y-4">
          {(sprints as Sprint[]).map(s => (
            <SprintRow
              key={s.id}
              sprint={s}
              projectId={selectedPid!}
              isManager={isManager}
              onEdit={() => openEdit(s)}
              onDelete={() => setDeleteTarget(s)}
              onStart={() => statusMut.mutate({ id: s.id, status: 'active' })}
              onComplete={() => statusMut.mutate({ id: s.id, status: 'completed' })}
              onOpenTask={setOpenTask}
            />
          ))}

          {selectedPid && (
            <BacklogSection projectId={selectedPid} sprints={sprints as Sprint[]} onOpenTask={setOpenTask} />
          )}

          {sprints.length === 0 && (
            <div className="py-16 text-center">
              <Zap className="mx-auto mb-3 h-12 w-12 text-slate-300" />
              <p className="text-slate-500">
                No sprints yet.{isManager ? ' Create one to start planning.' : ' Ask your project manager to create one.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Sprint create/edit modal */}
      <Modal
        open={modal === 'create' || modal === 'edit'}
        onClose={close}
        title={editing ? 'Edit Sprint' : 'New Sprint'}
        size="md"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={close}>Cancel</Button>
            <Button size="sm" loading={saveMut.isPending} disabled={!form.name.trim()} onClick={handleSave}>
              {editing ? 'Save Changes' : 'Create Sprint'}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Sprint Name"
            required
            placeholder="e.g. Sprint 1 – Auth & Onboarding"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          />
          <Textarea
            label="Sprint Goal"
            rows={2}
            placeholder="What should this sprint achieve?"
            value={form.goal}
            onChange={e => setForm(f => ({ ...f, goal: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Start Date" type="date" value={form.start_date} onChange={e => { setForm(f => ({ ...f, start_date: e.target.value })); setDateError(''); }} />
            <Input label="End Date"   type="date" value={form.end_date}   onChange={e => { setForm(f => ({ ...f, end_date: e.target.value })); setDateError(''); }} />
          </div>
          {dateError && <p className="text-xs text-red-500">{dateError}</p>}
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMut.mutate(deleteTarget.id)}
        loading={deleteMut.isPending}
        title="Delete Sprint"
        message={`Delete "${deleteTarget?.name}"? All issues will be moved to the backlog.`}
      />

      {/* Task detail modal */}
      {openTask && <TaskDetailModal task={openTask} onClose={() => setOpenTask(null)} />}
    </div>
  );
}
