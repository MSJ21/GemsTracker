import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orgApi, type OrgUser } from '@/api/org';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { GitBranch, User, ChevronDown, ChevronRight, Users } from 'lucide-react';
import { avatarUrl, cn } from '@/utils/helpers';
import { useToastStore } from '@/store/toastStore';

/* ── Flatten tree to list ───────────────────────────────────────────── */
function flattenTree(nodes: OrgUser[]): OrgUser[] {
  const result: OrgUser[] = [];
  const walk = (list: OrgUser[]) => {
    for (const n of list) {
      result.push(n);
      if (n.children?.length) walk(n.children);
    }
  };
  walk(nodes);
  return result;
}

/* ── Avatar ─────────────────────────────────────────────────────────── */
function Avatar({ node, size = 'md' }: { node: OrgUser; size?: 'sm' | 'md' | 'lg' }) {
  const sz = size === 'lg' ? 'h-14 w-14 text-lg' : size === 'sm' ? 'h-7 w-7 text-[10px]' : 'h-10 w-10 text-sm';
  if (node.avatar) {
    return <img src={avatarUrl(node.avatar)} alt={node.name} className={cn('shrink-0 rounded-full object-cover ring-2 ring-white dark:ring-slate-700', sz)} />;
  }
  const initials = node.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const colors = ['bg-violet-500','bg-blue-500','bg-emerald-500','bg-amber-500','bg-rose-500','bg-cyan-500','bg-indigo-500','bg-pink-500'];
  const color  = colors[(node.id ?? 0) % colors.length];
  return (
    <div className={cn('shrink-0 rounded-full flex items-center justify-center font-bold text-white ring-2 ring-white dark:ring-slate-700', sz, color)}>
      {initials || <User className="h-4 w-4" />}
    </div>
  );
}

/* ── Role pill ───────────────────────────────────────────────────────── */
function RolePill({ role }: { role: string }) {
  const cls = role === 'admin'
    ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300'
    : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400';
  return (
    <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide', cls)}>
      {role}
    </span>
  );
}

/* ── Single org node card ────────────────────────────────────────────── */
function OrgCard({ node, onEdit }: { node: OrgUser; onEdit: (u: OrgUser) => void }) {
  return (
    <button
      onClick={() => onEdit(node)}
      className="group flex flex-col items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm
                 transition-all hover:border-primary-300 hover:shadow-md hover:-translate-y-0.5
                 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-primary-600 w-[170px]"
    >
      <Avatar node={node} size="lg" />
      <div className="text-center mt-1 min-w-0 w-full">
        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{node.name}</p>
        {node.job_title
          ? <p className="truncate text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{node.job_title}</p>
          : <p className="text-[11px] text-slate-400 mt-0.5 italic">No title</p>
        }
      </div>
      <RolePill role={node.role} />
      {(node.children?.length ?? 0) > 0 && (
        <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
          <Users className="h-3 w-3" /> {node.children.length} direct
        </span>
      )}
    </button>
  );
}

/* ── Recursive tree level ────────────────────────────────────────────── */
function OrgLevel({ nodes, onEdit, depth = 0 }: {
  nodes: OrgUser[];
  onEdit: (u: OrgUser) => void;
  depth?: number;
}) {
  return (
    <div className="flex gap-6 justify-center">
      {nodes.map(node => (
        <OrgBranch key={node.id} node={node} onEdit={onEdit} depth={depth} />
      ))}
    </div>
  );
}

/* ── A single branch (node + its children subtree) ───────────────────── */
function OrgBranch({ node, onEdit, depth }: {
  node: OrgUser;
  onEdit: (u: OrgUser) => void;
  depth: number;
}) {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasKids = (node.children?.length ?? 0) > 0;

  return (
    <div className="flex flex-col items-center">
      {/* Card + toggle */}
      <div className="relative flex flex-col items-center">
        <OrgCard node={node} onEdit={onEdit} />

        {hasKids && (
          <>
            {/* Down stem */}
            <div className="w-0.5 h-6 bg-slate-300 dark:bg-slate-600" />
            {/* Expand toggle */}
            <button
              onClick={() => setExpanded(v => !v)}
              className="flex items-center gap-1 rounded-full border border-slate-300 bg-white px-2 py-0.5 text-[10px] text-slate-500
                         hover:border-primary-400 hover:text-primary-600 transition-colors shadow-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400 mb-1"
            >
              {expanded
                ? <><ChevronDown className="h-3 w-3" /> Hide</>
                : <><ChevronRight className="h-3 w-3" /> {node.children.length} reports</>
              }
            </button>
          </>
        )}
      </div>

      {/* Children subtree */}
      {hasKids && expanded && (
        <div className="flex flex-col items-center">
          {/* Horizontal bar spanning all children */}
          <div className="relative flex justify-center">
            {node.children.length > 1 && (
              <div
                className="absolute top-0 h-0.5 bg-slate-300 dark:bg-slate-600"
                style={{
                  left:  `calc(${100 / (node.children.length * 2)}% )`,
                  right: `calc(${100 / (node.children.length * 2)}% )`,
                }}
              />
            )}
            <div className="flex gap-6 pt-0">
              {node.children.map(child => (
                <div key={child.id} className="flex flex-col items-center">
                  {/* vertical stem from bar to child */}
                  <div className="w-0.5 h-6 bg-slate-300 dark:bg-slate-600" />
                  <OrgBranch node={child} onEdit={onEdit} depth={depth + 1} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────────────── */
export default function OrgChartPage() {
  const qc    = useQueryClient();
  const toast = useToastStore();

  const { data: tree = [], isLoading } = useQuery({
    queryKey: ['org-chart'],
    queryFn:  () => orgApi.tree().then(r => r.data ?? []),
    staleTime: 2 * 60 * 1000,
  });

  const [editUser, setEditUser]   = useState<OrgUser | null>(null);
  const [managerId, setManagerId] = useState('');

  const flat = flattenTree(tree);

  const openEdit = (u: OrgUser) => {
    setManagerId(u.manager_id ? String(u.manager_id) : '');
    setEditUser(u);
  };
  const close = () => setEditUser(null);

  const setManagerMut = useMutation({
    mutationFn: () => orgApi.setManager(editUser!.id, managerId ? Number(managerId) : null),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['org-chart'] });
      close();
      toast.push('Reporting manager updated', 'success');
    },
    onError: (e: Error) => toast.push(e.message, 'error'),
  });

  const mgrOptions = [
    { value: '', label: '— No manager (root) —' },
    ...flat
      .filter(u => u.id !== editUser?.id)
      .map(u => ({ value: String(u.id), label: u.name })),
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Org Chart</h1>
          <p className="mt-1 text-sm text-slate-500">
            Visual reporting hierarchy across your organisation · {flat.length} member{flat.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <GitBranch className="h-4 w-4" />
          <span>Click any card to change reporting line</span>
        </div>
      </div>

      {/* Tree */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50/60 p-8 dark:border-slate-700 dark:bg-slate-900/40 min-h-[300px]">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
          </div>
        ) : tree.length === 0 ? (
          <div className="py-20 text-center">
            <GitBranch className="mx-auto mb-3 h-12 w-12 text-slate-300" />
            <p className="text-slate-500">No employees found.</p>
          </div>
        ) : (
          <OrgLevel nodes={tree} onEdit={openEdit} />
        )}
      </div>

      {/* Legend */}
      {flat.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {flat.map(u => (
            <button
              key={u.id}
              onClick={() => openEdit(u)}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5
                         text-sm text-slate-700 transition-colors hover:border-primary-300 hover:bg-primary-50
                         hover:text-primary-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300
                         dark:hover:bg-primary-900/20"
            >
              <Avatar node={u} size="sm" />
              <span className="font-medium">{u.name}</span>
              {u.manager_id && (
                <span className="text-xs text-slate-400">
                  → {flat.find(m => m.id === u.manager_id)?.name ?? '?'}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Edit modal */}
      <Modal
        open={!!editUser}
        onClose={close}
        title={`Set Reporting Manager — ${editUser?.name ?? ''}`}
        size="sm"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={close}>Cancel</Button>
            <Button size="sm" loading={setManagerMut.isPending} onClick={() => setManagerMut.mutate()}>
              Save
            </Button>
          </>
        }
      >
        <div className="flex items-center gap-3 mb-5 rounded-xl bg-slate-50 dark:bg-slate-800 px-4 py-3">
          {editUser && <Avatar node={editUser} size="md" />}
          <div>
            <p className="font-semibold text-slate-900 dark:text-white">{editUser?.name}</p>
            <p className="text-xs text-slate-500">{editUser?.job_title ?? editUser?.role}</p>
          </div>
        </div>
        <Select
          label="Reports to (Reporting Manager)"
          options={mgrOptions}
          value={managerId}
          onChange={e => setManagerId(e.target.value)}
        />
      </Modal>
    </div>
  );
}
