import { useState } from 'react';
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  type DragStartEvent, type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Clock, CheckSquare } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '@/api/tasks';
import { priorityBadge, dueDateBadge } from '@/components/ui/Badge';
import { cn, formatDate } from '@/utils/helpers';
import type { Task, TaskStatus } from '@/types';

const COLUMNS: { key: TaskStatus; label: string; color: string; bg: string }[] = [
  { key: 'pending',     label: 'Pending',     color: 'border-amber-400',   bg: 'bg-amber-50 dark:bg-amber-900/10' },
  { key: 'in-progress', label: 'In Progress', color: 'border-blue-400',    bg: 'bg-blue-50 dark:bg-blue-900/10' },
  { key: 'done',        label: 'Done',        color: 'border-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/10' },
];

/* ── Draggable card ────────────────────────────────────────────────── */
function KanbanCard({
  task,
  onOpen,
  overlay = false,
}: {
  task: Task;
  onOpen: (t: Task) => void;
  overlay?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const dueDiff = task.due_date
    ? Math.round((new Date(task.due_date).setHours(0,0,0,0) - new Date().setHours(0,0,0,0)) / 86400000)
    : null;
  const isOverdue  = dueDiff !== null && dueDiff < 0;
  const isDueToday = dueDiff === 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group flex flex-col gap-2 rounded-xl border bg-white p-3 shadow-sm transition-shadow dark:bg-slate-900',
        isOverdue  ? 'border-red-300 dark:border-red-700/50'   :
        isDueToday ? 'border-amber-300 dark:border-amber-700/50' :
                     'border-slate-200 dark:border-slate-700',
        isDragging ? 'opacity-40 shadow-lg' : 'hover:shadow-md',
        overlay    ? 'rotate-1 scale-105 cursor-grabbing shadow-2xl' : '',
      )}
    >
      {/* Drag handle + title */}
      <div className="flex items-start gap-1.5">
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 shrink-0 cursor-grab text-slate-300 opacity-0 transition-opacity group-hover:opacity-100 dark:text-slate-600 active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onOpen(task)}
          className="flex-1 text-left text-sm font-medium leading-snug text-slate-800 hover:text-primary-600 dark:text-slate-100 dark:hover:text-primary-400"
        >
          {task.title}
        </button>
      </div>

      {/* Project name */}
      <p className="truncate pl-5 text-[10px] text-slate-400">{task.project_name}</p>

      {/* Badges */}
      <div className="flex flex-wrap items-center gap-1 pl-5">
        {priorityBadge(task.priority ?? 'medium')}
        {dueDateBadge(task.due_date)}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pl-5">
        <div className="flex items-center gap-2 text-[10px] text-slate-400">
          {task.hours_spent > 0 && (
            <span className="flex items-center gap-0.5">
              <Clock className="h-3 w-3" /> {task.hours_spent}h
            </span>
          )}
          {task.subtask_total > 0 && (
            <span className="flex items-center gap-0.5">
              <CheckSquare className="h-3 w-3" />
              {task.subtask_done}/{task.subtask_total}
            </span>
          )}
        </div>
        <span className="text-[10px] text-slate-400">{formatDate(task.task_date)}</span>
      </div>
    </div>
  );
}

/* ── Column ────────────────────────────────────────────────────────── */
function KanbanColumn({
  col,
  tasks,
  onOpen,
}: {
  col: typeof COLUMNS[0];
  tasks: Task[];
  onOpen: (t: Task) => void;
}) {
  return (
    <div className="flex w-72 shrink-0 flex-col gap-2">
      {/* Column header */}
      <div className={cn('flex items-center justify-between rounded-xl border-l-4 px-3 py-2', col.color, col.bg)}>
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{col.label}</span>
        <span className="rounded-full bg-white/70 px-2 py-0.5 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {tasks.length}
        </span>
      </div>

      {/* Cards drop zone */}
      <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex min-h-[200px] flex-col gap-2 rounded-xl bg-slate-100/60 p-2 dark:bg-slate-800/30">
          {tasks.map(t => (
            <KanbanCard key={t.id} task={t} onOpen={onOpen} />
          ))}
          {tasks.length === 0 && (
            <div className="flex flex-1 items-center justify-center py-8 text-xs text-slate-400">
              Drop cards here
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

/* ── Board ─────────────────────────────────────────────────────────── */
interface Props {
  tasks: Task[];
  queryKey: unknown[];
  onOpenTask: (t: Task) => void;
}

export function KanbanBoard({ tasks, queryKey, onOpenTask }: Readonly<Props>) {
  const qc      = useQueryClient();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const updateMut = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      tasksApi.update(id, { status }),
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey });
      const prev = qc.getQueryData(queryKey);
      qc.setQueryData(queryKey, (old: { data: Task[] } | undefined) => {
        if (!old?.data) return old;
        return { ...old, data: old.data.map(t => t.id === id ? { ...t, status: status as TaskStatus } : t) };
      });
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(queryKey, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey }),
  });

  const byStatus = (status: TaskStatus) => tasks.filter(t => t.status === status);

  const onDragStart = (e: DragStartEvent) => {
    setActiveTask(tasks.find(t => t.id === e.active.id) ?? null);
  };

  const onDragEnd = (e: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = e;
    if (!over) return;

    const draggedTask = tasks.find(t => t.id === active.id);
    if (!draggedTask) return;

    // Determine target column: over could be a task id or a column placeholder
    const overTask = tasks.find(t => t.id === over.id);
    const newStatus = overTask ? overTask.status : (over.id as string) as TaskStatus;

    if (newStatus && newStatus !== draggedTask.status) {
      updateMut.mutate({ id: draggedTask.id, status: newStatus });
    }
  };

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map(col => (
          <KanbanColumn
            key={col.key}
            col={col}
            tasks={byStatus(col.key)}
            onOpen={onOpenTask}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask && (
          <KanbanCard task={activeTask} onOpen={() => {}} overlay />
        )}
      </DragOverlay>
    </DndContext>
  );
}
