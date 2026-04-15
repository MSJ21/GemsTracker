import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  X, CheckSquare, Square, Plus, Trash2, MessageSquare,
  Clock, Play, StopCircle, RefreshCw, Send, Edit2, Check, AlertCircle,
  Eye, Link2, UserCheck, UserX,
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { subtasksApi, commentsApi, timerApi } from '@/api/tasks';
import { watchersApi, taskLinksApi, type TaskLink } from '@/api/sprints';
import { Avatar } from '@/components/shared/Avatar';
import { priorityBadge, taskStatusBadge, dueDateBadge } from '@/components/ui/Badge';
import { cn, formatDate } from '@/utils/helpers';
import { useAuthStore } from '@/store/authStore';
import { useToastStore } from '@/store/toastStore';
import type { Task } from '@/types';

function formatSeconds(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

/* ── Timer section ─────────────────────────────────────────────────── */
function TimerSection({ task }: { task: Task }) {
  const qc   = useQueryClient();
  const auth = useAuthStore(s => s.user);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: active } = useQuery({
    queryKey: ['timer-active'],
    queryFn:  () => timerApi.active().then(r => r.data),
    refetchInterval: 5000,
  });

  const isRunningHere = active?.task_id === task.id;

  useEffect(() => {
    if (isRunningHere && active?.started_at) {
      const tick = () => {
        setElapsed(Math.floor((Date.now() - new Date(active.started_at).getTime()) / 1000));
      };
      tick();
      intervalRef.current = setInterval(tick, 1000);
    } else {
      setElapsed(0);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunningHere, active?.started_at]);

  const startMutation = useMutation({
    mutationFn: () => timerApi.start(task.id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['timer-active'] }),
  });

  const stopMutation = useMutation({
    mutationFn: () => timerApi.stop(),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['timer-active'] });
      qc.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const totalTracked = task.tracked_seconds + (isRunningHere ? elapsed : 0);

  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/50">
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-slate-400" />
        <div>
          <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
            {isRunningHere ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                ● {formatSeconds(elapsed)} running
              </span>
            ) : 'Time Tracker'}
          </p>
          <p className="text-[10px] text-slate-400">
            Total tracked: {formatSeconds(totalTracked)}
          </p>
        </div>
      </div>
      {auth && (
        isRunningHere ? (
          <button
            onClick={() => stopMutation.mutate()}
            disabled={stopMutation.isPending}
            className="flex items-center gap-1.5 rounded-lg bg-red-100 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 transition-colors"
          >
            <StopCircle className="h-3.5 w-3.5" /> Stop
          </button>
        ) : (
          <button
            onClick={() => startMutation.mutate()}
            disabled={startMutation.isPending || (!!active && !isRunningHere)}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-100 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 transition-colors disabled:opacity-50"
            title={active && !isRunningHere ? 'Stop current timer first' : 'Start timer'}
          >
            <Play className="h-3.5 w-3.5" /> Start
          </button>
        )
      )}
    </div>
  );
}

/* ── Subtasks section ──────────────────────────────────────────────── */
function SubtasksSection({ task }: { task: Task }) {
  const qc  = useQueryClient();
  const key = ['subtasks', task.id];
  const [newTitle, setNewTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: subtasks = [] } = useQuery({
    queryKey: key,
    queryFn:  () => subtasksApi.list(task.id).then(r => r.data ?? []),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: key });

  const createMut = useMutation({
    mutationFn: (title: string) => subtasksApi.create(task.id, title),
    onSuccess:  () => { invalidate(); setNewTitle(''); },
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, done }: { id: number; done: boolean }) =>
      subtasksApi.update(id, { is_done: done } as never),
    onSuccess: invalidate,
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => subtasksApi.delete(id),
    onSuccess:  invalidate,
  });

  const done  = subtasks.filter(s => s.is_done).length;
  const total = subtasks.length;
  const pct   = total ? Math.round((done / total) * 100) : 0;

  const handleAdd = () => {
    const t = newTitle.trim();
    if (!t) return;
    createMut.mutate(t);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Subtasks {total > 0 && <span className="ml-1 font-bold text-slate-700 dark:text-slate-300">{done}/{total}</span>}
        </h4>
      </div>

      {total > 0 && (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      <div className="flex flex-col gap-1">
        {subtasks.map(s => (
          <div key={s.id} className="group flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-slate-50 dark:hover:bg-slate-800/50">
            <button
              onClick={() => toggleMut.mutate({ id: s.id, done: !s.is_done })}
              className={cn('shrink-0 transition-colors', s.is_done ? 'text-emerald-500' : 'text-slate-300 hover:text-emerald-400')}
            >
              {s.is_done ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
            </button>
            <span className={cn('flex-1 text-sm', s.is_done && 'line-through text-slate-400')}>
              {s.title}
            </span>
            <button
              onClick={() => deleteMut.mutate(s.id)}
              className="shrink-0 text-slate-300 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-500"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          ref={inputRef}
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder="Add subtask…"
          className="h-8 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-400/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
        />
        <button
          onClick={handleAdd}
          disabled={!newTitle.trim() || createMut.isPending}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-40 transition-colors"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/* ── Comments section ──────────────────────────────────────────────── */
function CommentsSection({ task }: { task: Task }) {
  const qc   = useQueryClient();
  const auth = useAuthStore(s => s.user);
  const key  = ['comments', task.id];
  const [body, setBody]           = useState('');
  const [editing, setEditing]     = useState<number | null>(null);
  const [editBody, setEditBody]   = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: comments = [] } = useQuery({
    queryKey: key,
    queryFn:  () => commentsApi.list(task.id).then(r => r.data ?? []),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: key });

  const createMut = useMutation({
    mutationFn: (b: string) => commentsApi.create(task.id, b),
    onSuccess:  () => { invalidate(); setBody(''); setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, b }: { id: number; b: string }) => commentsApi.update(id, b),
    onSuccess:  () => { invalidate(); setEditing(null); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => commentsApi.delete(id),
    onSuccess:  invalidate,
  });

  return (
    <div className="flex flex-col gap-3">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        Comments <span className="ml-1 font-bold text-slate-700 dark:text-slate-300">{comments.length}</span>
      </h4>

      <div className="flex max-h-64 flex-col gap-3 overflow-y-auto pr-1">
        {comments.length === 0 && (
          <p className="py-4 text-center text-xs text-slate-400">No comments yet</p>
        )}
        {comments.map(c => (
          <div key={c.id} className="flex gap-2.5">
            <Avatar name={c.user_name} avatar={c.user_avatar} size="sm" />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-100">{c.user_name}</span>
                <span className="text-[10px] text-slate-400">{formatDate(c.created_at)}</span>
              </div>
              {editing === c.id ? (
                <div className="mt-1 flex gap-1.5">
                  <textarea
                    autoFocus
                    value={editBody}
                    onChange={e => setEditBody(e.target.value)}
                    rows={2}
                    className="flex-1 resize-none rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs focus:border-primary-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  />
                  <div className="flex flex-col gap-1">
                    <button onClick={() => updateMut.mutate({ id: c.id, b: editBody })}
                      className="rounded-lg bg-primary-600 p-1 text-white hover:bg-primary-700">
                      <Check className="h-3 w-3" />
                    </button>
                    <button onClick={() => setEditing(null)}
                      className="rounded-lg bg-slate-200 p-1 text-slate-600 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ) : (
                <p className="mt-0.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
                  {c.body}
                </p>
              )}
            </div>
            {auth && (Number(auth.id) === c.user_id || auth.role === 'admin') && editing !== c.id && (
              <div className="flex shrink-0 gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => { setEditing(c.id); setEditBody(c.body); }}
                  className="rounded p-0.5 text-slate-400 hover:text-primary-500">
                  <Edit2 className="h-3 w-3" />
                </button>
                <button onClick={() => deleteMut.mutate(c.id)}
                  className="rounded p-0.5 text-slate-400 hover:text-red-500">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2">
        <Avatar name={auth?.name ?? ''} avatar={auth?.avatar} size="sm" />
        <div className="flex flex-1 gap-1.5">
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            onKeyDown={e => { if (e.ctrlKey && e.key === 'Enter') { e.preventDefault(); if (body.trim()) createMut.mutate(body.trim()); } }}
            rows={2}
            placeholder="Write a comment… (Ctrl+Enter to send)"
            className="flex-1 resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-400/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          />
          <button
            onClick={() => body.trim() && createMut.mutate(body.trim())}
            disabled={!body.trim() || createMut.isPending}
            className="flex h-9 w-9 shrink-0 items-center justify-center self-end rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-40 transition-colors"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Watchers section ──────────────────────────────────────────────── */
function WatchersSection({ task }: { task: Task }) {
  const qc   = useQueryClient();
  const auth = useAuthStore(s => s.user);
  const toast = useToastStore();

  const { data: watchers = [] } = useQuery({
    queryKey: ['watchers', task.id],
    queryFn: () => watchersApi.list(task.id).then(r => r.data ?? []),
  });

  const { data: watchingData } = useQuery({
    queryKey: ['watching', task.id],
    queryFn: () => watchersApi.isWatching(task.id).then(r => r.data),
  });

  const toggleMut = useMutation({
    mutationFn: () => watchersApi.toggle(task.id),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['watchers', task.id] });
      qc.invalidateQueries({ queryKey: ['watching', task.id] });
      toast.push(res.data?.watching ? 'Now watching this task' : 'Stopped watching', 'success');
    },
    onError: (e: Error) => toast.push(e.message, 'error'),
  });

  const isWatching = watchingData?.watching ?? false;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Watchers <span className="ml-1 font-bold text-slate-700 dark:text-slate-300">{watchers.length}</span>
        </h4>
        {auth && (
          <button
            onClick={() => toggleMut.mutate()}
            disabled={toggleMut.isPending}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors',
              isWatching
                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400',
            )}
          >
            {isWatching ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
            {isWatching ? 'Unwatch' : 'Watch'}
          </button>
        )}
      </div>

      {watchers.length === 0 ? (
        <p className="py-4 text-center text-xs text-slate-400">No watchers yet.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {watchers.map(w => (
            <div key={w.id} className="flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 dark:bg-slate-800">
              <Avatar name={w.name} avatar={w.avatar} size="sm" />
              <span className="text-xs text-slate-700 dark:text-slate-300">{w.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Linked tasks section ──────────────────────────────────────────── */
const LINK_TYPES = [
  { value: 'relates_to', label: 'Relates to' },
  { value: 'blocks',     label: 'Blocks' },
  { value: 'blocked_by', label: 'Blocked by' },
  { value: 'duplicates', label: 'Duplicates' },
];

const LINK_COLORS: Record<string, string> = {
  blocks:     'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  blocked_by: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  duplicates: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
  relates_to: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
};

function LinkedTasksSection({ task }: { task: Task }) {
  const qc    = useQueryClient();
  const toast = useToastStore();
  const [searchId, setSearchId] = useState('');
  const [linkType, setLinkType] = useState('relates_to');

  const { data: links = [] } = useQuery({
    queryKey: ['links', task.id],
    queryFn: () => taskLinksApi.list(task.id).then(r => r.data ?? []),
  });

  const addMut = useMutation({
    mutationFn: () => taskLinksApi.create(task.id, Number(searchId), linkType),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['links', task.id] });
      setSearchId('');
      toast.push('Link added', 'success');
    },
    onError: (e: Error) => toast.push(e.message, 'error'),
  });

  const removeMut = useMutation({
    mutationFn: (id: number) => taskLinksApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['links', task.id] }),
    onError: (e: Error) => toast.push(e.message, 'error'),
  });

  return (
    <div className="flex flex-col gap-3">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        Linked Tasks <span className="ml-1 font-bold text-slate-700 dark:text-slate-300">{links.length}</span>
      </h4>

      {(links as TaskLink[]).map(l => (
        <div key={l.id} className="group flex items-center gap-2 rounded-lg border border-slate-100 px-3 py-2 dark:border-slate-700">
          <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium', LINK_COLORS[l.link_type] ?? LINK_COLORS.relates_to)}>
            {LINK_TYPES.find(t => t.value === l.link_type)?.label ?? l.link_type}
          </span>
          <span className="flex-1 truncate text-sm text-slate-700 dark:text-slate-300">
            #{l.linked_id} {l.linked_title}
          </span>
          {taskStatusBadge(l.linked_status as never)}
          <button
            onClick={() => removeMut.mutate(l.id)}
            className="shrink-0 text-slate-300 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-500"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}

      <div className="flex gap-2">
        <select
          value={linkType}
          onChange={e => setLinkType(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        >
          {LINK_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <input
          type="number"
          value={searchId}
          onChange={e => setSearchId(e.target.value)}
          placeholder="Task ID…"
          className="w-24 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        />
        <button
          onClick={() => addMut.mutate()}
          disabled={!searchId || addMut.isPending}
          className="flex items-center gap-1 rounded-lg bg-primary-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-primary-700 disabled:opacity-40 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" /> Link
        </button>
      </div>
    </div>
  );
}

/* ── Recurrence badge ──────────────────────────────────────────────── */
function RecurrenceBadge({ task }: { task: Task }) {
  if (!task.recur_type) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-medium text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
      <RefreshCw className="h-2.5 w-2.5" />
      {task.recur_type}
      {task.recur_end && ` until ${task.recur_end}`}
    </span>
  );
}

/* ── Main modal ────────────────────────────────────────────────────── */
interface Props {
  task: Task;
  onClose: () => void;
  onEdit?: (task: Task) => void;
}

type Tab = 'subtasks' | 'comments' | 'timer' | 'watchers' | 'links';

export function TaskDetailModal({ task, onClose, onEdit }: Readonly<Props>) {
  const [tab, setTab] = useState<Tab>('subtasks');

  useEffect(() => {
    const down = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [onClose]);

  const tabs: { key: Tab; label: string; icon: typeof MessageSquare }[] = [
    { key: 'subtasks', label: 'Subtasks', icon: CheckSquare },
    { key: 'comments', label: 'Comments', icon: MessageSquare },
    { key: 'timer',    label: 'Timer',    icon: Clock },
    { key: 'watchers', label: 'Watchers', icon: Eye },
    { key: 'links',    label: 'Links',    icon: Link2 },
  ];

  const dueDiff = task.due_date
    ? Math.round((new Date(task.due_date).setHours(0,0,0,0) - new Date().setHours(0,0,0,0)) / 86400000)
    : null;

  const content = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm"
      />

      <div className="relative z-10 flex w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl dark:bg-slate-900 max-h-[90vh]">
        {/* Header gradient */}
        <div className="h-1 w-full rounded-t-2xl bg-gradient-to-r from-primary-500 via-violet-500 to-primary-400" />

        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-6 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {taskStatusBadge(task.status)}
              {priorityBadge(task.priority ?? 'medium')}
              {dueDateBadge(task.due_date)}
              <RecurrenceBadge task={task} />
              {(task as Task & { story_points?: number | null }).story_points != null && (
                <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-medium text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
                  {(task as Task & { story_points: number }).story_points} SP
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50 leading-snug">
              {task.title}
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-400">
              <span>{task.project_name}</span>
              {task.user_name && <span>· {task.user_name}</span>}
              <span>· {formatDate(task.task_date)}</span>
              {task.hours_spent > 0 && <span>· {task.hours_spent}h logged</span>}
              {dueDiff !== null && dueDiff < 0 && (
                <span className="flex items-center gap-1 text-red-500">
                  <AlertCircle className="h-3 w-3" /> Overdue by {Math.abs(dueDiff)} day{Math.abs(dueDiff) !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {onEdit && (
              <button onClick={() => onEdit(task)}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors">
                <Edit2 className="h-3 w-3" /> Edit
              </button>
            )}
            <button onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Description */}
        {task.description && (
          <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800">
            <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
              {task.description}
            </p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 px-6">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'flex items-center gap-1.5 border-b-2 px-4 py-3 text-xs font-medium transition-colors',
                tab === t.key
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              )}
            >
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
              {t.key === 'subtasks' && task.subtask_total > 0 && (
                <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] dark:bg-slate-800">
                  {task.subtask_done}/{task.subtask_total}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {tab === 'subtasks' && <SubtasksSection task={task} />}
          {tab === 'comments' && <CommentsSection task={task} />}
          {tab === 'timer'    && <TimerSection task={task} />}
          {tab === 'watchers' && <WatchersSection task={task} />}
          {tab === 'links'    && <LinkedTasksSection task={task} />}
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
