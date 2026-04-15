import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { goalsApi, type Goal, type KeyResult } from '@/api/goals';
import { usersApi } from '@/api/users';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Target, Plus, Pencil, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { useToastStore } from '@/store/toastStore';
import { cn } from '@/utils/helpers';

const STATUS_OPTIONS = [
  { value: 'active',    label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'paused',    label: 'Paused' },
];

function statusColor(s: string) {
  if (s === 'active')    return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
  if (s === 'completed') return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
  return 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400';
}

/* ─── Goal card ─────────────────────────────────────────────── */
function GoalCard({ goal, onEdit, onDelete, deleteLoading }: { goal: Goal; onEdit: () => void; onDelete: () => void; deleteLoading?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const qc    = useQueryClient();
  const toast = useToastStore();

  const updateKr = useMutation({
    mutationFn: ({ id, val }: { id: number; val: number }) =>
      goalsApi.updateKeyResult(id, { current_val: val }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
    onError: (e: Error) => toast.push(e.message, 'error'),
  });

  const pct = Math.min(100, Math.max(0, goal.progress));

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
      {/* Card header */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-900/20">
              <Target className="h-4 w-4 text-primary-600 dark:text-primary-400" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-slate-900 dark:text-white">{goal.title}</p>
              {goal.owner_name && <p className="mt-0.5 text-xs text-slate-500">Owner: {goal.owner_name}</p>}
              {goal.description && <p className="mt-1 text-sm text-slate-500 leading-relaxed">{goal.description}</p>}
            </div>
          </div>
          <div className="flex shrink-0 gap-1">
            <button onClick={onEdit} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-primary-600 dark:hover:bg-slate-700">
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button onClick={onDelete} disabled={deleteLoading} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 disabled:opacity-50">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <ProgressBar value={pct} />
        </div>

        {/* Status + due date + KR toggle */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', statusColor(goal.status))}>
              {goal.status}
            </span>
            {goal.due_date && <span className="text-xs text-slate-400">Due {goal.due_date}</span>}
          </div>
          {goal.key_results.length > 0 && (
            <button
              onClick={() => setExpanded(v => !v)}
              className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:underline dark:text-primary-400"
            >
              {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              {goal.key_results.length} Key Result{goal.key_results.length !== 1 ? 's' : ''}
            </button>
          )}
        </div>
      </div>

      {/* Key results */}
      {expanded && goal.key_results.length > 0 && (
        <div className="divide-y divide-slate-100 border-t border-slate-100 bg-slate-50 dark:divide-slate-700 dark:border-slate-700 dark:bg-slate-900/40">
          {goal.key_results.map((kr: KeyResult) => {
            const krPct = kr.target > 0 ? (kr.current_val / kr.target) * 100 : 0;
            return (
              <div key={kr.id} className="px-5 py-3">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="text-sm text-slate-700 dark:text-slate-300">{kr.title}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <input
                      type="number"
                      defaultValue={kr.current_val}
                      className="w-20 rounded-lg border border-slate-300 bg-white px-2 py-1 text-center text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                      onBlur={e => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val) && val !== kr.current_val) {
                          updateKr.mutate({ id: kr.id, val });
                        }
                      }}
                    />
                    <span className="text-xs text-slate-400">/ {kr.target}{kr.unit ? ` ${kr.unit}` : ''}</span>
                  </div>
                </div>
                <ProgressBar value={krPct} className="mt-0" />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── KR form row ────────────────────────────────────────────── */
interface KrRow { title: string; target: string; unit: string; }

function KrRow({ row, idx, onChange, onRemove, showRemove }: {
  row: KrRow; idx: number;
  onChange: (idx: number, field: keyof KrRow, val: string) => void;
  onRemove: (idx: number) => void;
  showRemove: boolean;
}) {
  return (
    <div className="flex items-end gap-2">
      <div className="flex-1">
        <Input
          label={idx === 0 ? 'Key Result' : undefined}
          placeholder="Key result title"
          value={row.title}
          onChange={e => onChange(idx, 'title', e.target.value)}
        />
      </div>
      <div className="w-20">
        <Input
          label={idx === 0 ? 'Target' : undefined}
          type="number"
          placeholder="100"
          value={row.target}
          onChange={e => onChange(idx, 'target', e.target.value)}
        />
      </div>
      <div className="w-20">
        <Input
          label={idx === 0 ? 'Unit' : undefined}
          placeholder="%"
          value={row.unit}
          onChange={e => onChange(idx, 'unit', e.target.value)}
        />
      </div>
      {showRemove && (
        <button
          type="button"
          onClick={() => onRemove(idx)}
          className="mb-0.5 rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-500"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────── */
export default function GoalsPage() {
  const qc    = useQueryClient();
  const toast = useToastStore();

  const { data = [], isLoading } = useQuery({
    queryKey: ['goals'],
    queryFn: () => goalsApi.list().then(r => r.data ?? []),
  });
  const { data: usersData } = useQuery({
    queryKey: ['users-list'],
    queryFn: () => usersApi.list().then(r => r.data?.users ?? []),
  });

  const goals: Goal[] = data;
  const userOptions = [
    { value: '', label: '— No owner —' },
    ...(usersData ?? []).map((u: { id: number; name: string }) => ({ value: String(u.id), label: u.name })),
  ];

  const [modal, setModal]     = useState<'create' | 'edit' | null>(null);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Goal | null>(null);
  const [form, setForm]       = useState({ title: '', description: '', owner_id: '', due_date: '', status: 'active' });
  const [krs, setKrs]         = useState<KrRow[]>([{ title: '', target: '100', unit: '' }]);

  const openCreate = () => {
    setEditing(null);
    setForm({ title: '', description: '', owner_id: '', due_date: '', status: 'active' });
    setKrs([{ title: '', target: '100', unit: '' }]);
    setModal('create');
  };

  const openEdit = (g: Goal) => {
    setEditing(g);
    setForm({ title: g.title, description: g.description, owner_id: g.owner_id ? String(g.owner_id) : '', due_date: g.due_date ?? '', status: g.status });
    setKrs(g.key_results.map(kr => ({ title: kr.title, target: String(kr.target), unit: kr.unit })));
    setModal('edit');
  };

  const close = () => { setModal(null); setEditing(null); };

  const saveMut = useMutation({
    mutationFn: () => {
      const base = {
        title: form.title,
        description: form.description,
        status: form.status,
        owner_id:  form.owner_id  ? Number(form.owner_id)  : undefined,
        due_date:  form.due_date  || undefined,
      };
      if (editing) return goalsApi.update(editing.id, base);
      return goalsApi.create({
        ...base,
        key_results: krs.filter(k => k.title.trim()).map(k => ({
          title: k.title, target: parseFloat(k.target) || 100, unit: k.unit,
        })),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['goals'] });
      close();
      toast.push(editing ? 'Goal updated' : 'Goal created', 'success');
    },
    onError: (e: Error) => toast.push(e.message, 'error'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => goalsApi.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['goals'] }); toast.push('Goal deleted', 'success'); setDeleteTarget(null); },
    onError: (e: Error) => toast.push(e.message, 'error'),
  });

  const updateKr = (i: number, f: keyof KrRow, v: string) =>
    setKrs(rows => rows.map((r, j) => j === i ? { ...r, [f]: v } : r));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Goals & OKRs</h1>
          <p className="mt-1 text-sm text-slate-500">Track objectives and key results across your organisation</p>
        </div>
        <Button onClick={openCreate} size="sm"><Plus className="h-4 w-4" /> New Goal</Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <p className="py-16 text-center text-sm text-slate-400">Loading…</p>
      ) : goals.length === 0 ? (
        <div className="py-20 text-center">
          <Target className="mx-auto mb-3 h-12 w-12 text-slate-300" />
          <p className="text-slate-500">No goals yet. Create one to start tracking OKRs.</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {goals.map(g => (
            <GoalCard key={g.id} goal={g} onEdit={() => openEdit(g)} onDelete={() => setDeleteTarget(g)} deleteLoading={deleteMut.isPending && deleteTarget?.id === g.id} />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMut.mutate(deleteTarget.id)}
        loading={deleteMut.isPending}
        title="Delete Goal"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This cannot be undone.`}
      />

      {/* Create / Edit modal */}
      <Modal
        open={modal === 'create' || modal === 'edit'}
        onClose={close}
        title={editing ? 'Edit Goal' : 'New Goal'}
        size="lg"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={close}>Cancel</Button>
            <Button size="sm" loading={saveMut.isPending} disabled={!form.title.trim()} onClick={() => saveMut.mutate()}>
              {editing ? 'Save Changes' : 'Create Goal'}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Goal Title"
            required
            placeholder="e.g. Increase customer retention by 20%"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          />
          <Textarea
            label="Description"
            rows={2}
            placeholder="Optional context…"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          />
          <div className="grid grid-cols-3 gap-3">
            <Select
              label="Owner"
              options={userOptions}
              value={form.owner_id}
              onChange={e => setForm(f => ({ ...f, owner_id: e.target.value }))}
            />
            <Input
              label="Due Date"
              type="date"
              value={form.due_date}
              onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
            />
            <Select
              label="Status"
              options={STATUS_OPTIONS}
              value={form.status}
              onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
            />
          </div>

          {/* Key results — only for new goals */}
          {!editing && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Key Results</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setKrs(r => [...r, { title: '', target: '100', unit: '' }])}
                >
                  <Plus className="h-3.5 w-3.5" /> Add KR
                </Button>
              </div>
              <div className="flex flex-col gap-2">
                {krs.map((row, i) => (
                  <KrRow
                    key={i}
                    row={row}
                    idx={i}
                    onChange={updateKr}
                    onRemove={idx => setKrs(r => r.filter((_, j) => j !== idx))}
                    showRemove={krs.length > 1}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
