import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus, Pencil, Trash2, RotateCcw, Building2,
  Search, Filter, ArrowUpDown, ArrowUp, ArrowDown,
  Upload, Mail, UserIcon, X, Copy, Check, Download,
  Activity,
} from 'lucide-react';
import { usersApi } from '@/api/users';
import { entitiesApi } from '@/api/entities';
import { useToastStore } from '@/store/toastStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { Avatar } from '@/components/shared/Avatar';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { PageSpinner } from '@/components/ui/Spinner';
import { usePagination } from '@/hooks/usePagination';
import { useSort } from '@/hooks/useSort';
import { formatDate, formatHours, cn } from '@/utils/helpers';
import { exportToExcel, downloadSampleExcel, parseExcelFile } from '@/utils/excelUtils';
import type { User } from '@/types';

const createSchema = z.object({
  name:     z.string().min(1, 'Name is required'),
  email:    z.string().email('Invalid email'),
  password: z.string().min(6, 'Min 6 characters'),
  role:     z.string(),
});

const editSchema = z.object({
  name:     z.string().min(1),
  email:    z.string().email(),
  password: z.string().optional(),
  role:     z.string(),
  status:   z.string(),
});

type CreateForm = z.infer<typeof createSchema>;
type EditForm   = z.infer<typeof editSchema>;
type CreateTab  = 'single' | 'multi' | 'excel';
type SortKey    = 'name' | 'email' | 'role' | 'status' | 'total_tasks' | 'total_hours';

function parseExcelRows(rows: Record<string, string>[]): { name: string; email: string; role: string }[] {
  return rows.map(r => {
    // case-insensitive column lookup
    const get = (key: string) => {
      const found = Object.keys(r).find(k => k.toLowerCase().trim() === key);
      return found ? (r[found] ?? '').trim() : '';
    };
    return { name: get('name'), email: get('email'), role: get('role') || 'user' };
  }).filter(r => r.email);
}

function exportExcel(users: User[]) {
  exportToExcel(
    [
      ['Name', 'Email', 'Role', 'Status', 'Tasks', 'Hours', 'Last Active'],
      ...users.map(u => [u.name, u.email, u.role, u.status, u.total_tasks ?? 0, formatHours(u.total_hours ?? 0), formatDate(u.last_active)]),
    ],
    `users-${new Date().toISOString().slice(0, 10)}.xlsx`,
  );
}

const roleOptions   = [{ value: 'user', label: 'User' }, { value: 'admin', label: 'Admin' }];
const statusOptions = [{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }];

const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

function EmailTagInput({
  tags, onChange,
}: { tags: string[]; onChange: (tags: string[]) => void }) {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const addTags = useCallback((raw: string) => {
    // split on whitespace, commas, semicolons, newlines
    const candidates = raw.split(/[\s,;]+/).map(s => s.trim().toLowerCase()).filter(Boolean);
    const next = [...tags];
    for (const c of candidates) {
      if (!next.includes(c)) next.push(c);
    }
    onChange(next);
    setInput('');
  }, [tags, onChange]);

  const removeTag = (idx: number) => onChange(tags.filter((_, i) => i !== idx));

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',' || e.key === ' ' || e.key === ';') && input.trim()) {
      e.preventDefault();
      addTags(input);
    }
    if (e.key === 'Backspace' && !input && tags.length) {
      removeTag(tags.length - 1);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    addTags(e.clipboardData.getData('text'));
  };

  return (
    <div
      className="min-h-[80px] cursor-text rounded-xl border border-slate-200 bg-slate-50 p-2.5 focus-within:border-primary-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-primary-400/20 dark:border-slate-700 dark:bg-slate-800 dark:focus-within:bg-slate-900"
      onClick={() => inputRef.current?.focus()}
    >
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag, i) => (
          <span
            key={i}
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium',
              isValidEmail(tag)
                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300'
                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
            )}
          >
            {tag}
            <button
              type="button"
              onClick={e => { e.stopPropagation(); removeTag(i); }}
              className="ml-0.5 rounded-full hover:text-red-500 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onBlur={() => { if (input.trim()) addTags(input); }}
          placeholder={tags.length === 0 ? 'Type or paste emails, press Enter or comma to add…' : ''}
          className="min-w-[200px] flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-slate-100"
        />
      </div>
    </div>
  );
}

export default function UsersPage() {
  const qc       = useQueryClient();
  const { push } = useToastStore();

  const [modalOpen, setModalOpen]           = useState(false);
  const [editTarget, setEditTarget]         = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget]     = useState<User | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [avatarFile, setAvatarFile]         = useState<File | null>(null);
  const [createTab, setCreateTab]           = useState<CreateTab>('single');
  const [multiEmails, setMultiEmails]       = useState<string[]>([]);
  const [multiRole, setMultiRole]           = useState('user');
  const [xlsxRows, setXlsxRows]             = useState<{ name: string; email: string; role: string }[]>([]);
  const [xlsxLoading, setXlsxLoading]       = useState(false);
  const [copiedId, setCopiedId]             = useState<number | null>(null);
  const [search, setSearch]                 = useState('');
  const [roleFilter, setRoleFilter]         = useState('');
  const [statusFilter, setStatusFilter]     = useState('');
  const [showFilters, setShowFilters]       = useState(false);
  const [selected, setSelected]             = useState<Set<number>>(new Set());
  const fileRef = useRef<HTMLInputElement>(null);

  const [entityTarget, setEntityTarget]         = useState<User | null>(null);
  const [selectedEntities, setSelectedEntities] = useState<number[]>([]);
  const [importEntities, setImportEntities]     = useState<number[]>([]);

  const { data, isLoading } = useQuery({ queryKey: ['admin-users'],    queryFn: () => usersApi.list().then(r => r.data) });
  const { data: entityData } = useQuery({ queryKey: ['admin-entities'], queryFn: () => entitiesApi.list().then(r => r.data) });

  const createForm = useForm<CreateForm>({ resolver: zodResolver(createSchema), defaultValues: { role: 'user' } });
  const editForm   = useForm<EditForm>({ resolver: zodResolver(editSchema), defaultValues: { role: 'user', status: 'active' } });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin-users'] });
  const apiErr     = (e: unknown) => push((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed', 'error');

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

  const createMutation = useMutation({
    mutationFn: (d: CreateForm) => {
      const fd = new FormData();
      Object.entries(d).forEach(([k, v]) => fd.append(k, v as string));
      if (avatarFile) fd.append('avatar', avatarFile);
      return usersApi.create(fd);
    },
    onSuccess: (res) => {
      invalidate();
      const sent = (res as { data?: { invite_sent?: boolean } })?.data?.invite_sent;
      push(sent ? 'User created — invite email sent' : 'User created', 'success');
      closeModal();
    },
    onError:   apiErr,
  });

  const updateMutation = useMutation({
    mutationFn: (args: { id: number; d: EditForm }) => {
      const fd = new FormData();
      Object.entries(args.d).forEach(([k, v]) => { if (v) fd.append(k, v as string); });
      if (avatarFile) fd.append('avatar', avatarFile);
      return usersApi.update(args.id, fd);
    },
    onSuccess: () => { invalidate(); push('User updated', 'success'); closeModal(); },
    onError:   apiErr,
  });

  const deleteMutation  = useMutation({ mutationFn: (id: number) => usersApi.delete(id),  onSuccess: () => { invalidate(); push('User deleted', 'success'); setDeleteTarget(null); } });
  const restoreMutation = useMutation({ mutationFn: (id: number) => usersApi.restore(id), onSuccess: () => { invalidate(); push('User restored', 'success'); } });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      for (const id of ids) await usersApi.delete(id);
    },
    onSuccess: () => {
      invalidate();
      push(`Deleted ${selected.size} users`, 'success');
      setSelected(new Set());
      setBulkDeleteOpen(false);
    },
    onError: apiErr,
  });

  const entityAssignMutation = useMutation({
    mutationFn: () => usersApi.assignEntities(entityTarget!.id, selectedEntities),
    onSuccess:  () => { invalidate(); push('Entity assignments saved', 'success'); setEntityTarget(null); },
    onError:    apiErr,
  });

  const openEntityAssign = async (u: User) => {
    setEntityTarget(u);
    const res = await usersApi.getEntities(u.id);
    setSelectedEntities(res.data ?? []);
  };

  const toggleEntity = (id: number) =>
    setSelectedEntities(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  const closeModal = () => {
    setModalOpen(false); setEditTarget(null); setAvatarFile(null);
    setCreateTab('single'); setMultiEmails([]); setXlsxRows([]);
    setImportEntities([]);
    createForm.reset({ role: 'user' }); editForm.reset();
  };
  const openCreate = () => { createForm.reset({ role: 'user' }); setEditTarget(null); setModalOpen(true); };
  const openEdit   = (u: User) => { editForm.reset({ name: u.name, email: u.email, role: u.role, status: u.status }); setEditTarget(u); setModalOpen(true); };

  const onSingleSubmit = () => createForm.handleSubmit(d => createMutation.mutate(d))();
  const onEditSubmit   = () => editForm.handleSubmit(d => updateMutation.mutate({ id: editTarget!.id, d }))();

  const onMultiInvite = async () => {
    const emails = multiEmails.filter(e => isValidEmail(e));
    if (!emails.length) { push('No valid emails found', 'error'); return; }
    let ok = 0; let mailed = 0;
    for (const email of emails) {
      try {
        const fd = new FormData();
        const name = email.split('@')[0] ?? email;
        fd.append('name', name); fd.append('email', email);
        fd.append('password', Math.random().toString(36).slice(-10));
        fd.append('role', multiRole);
        const res = await usersApi.create(fd);
        const newId = (res as { data?: { id?: number } })?.data?.id;
        if (newId && importEntities.length) { await usersApi.assignEntities(newId, importEntities); }
        ok++;
        if ((res as { data?: { invite_sent?: boolean } })?.data?.invite_sent) mailed++;
      } catch { /* skip */ }
    }
    invalidate();
    push(mailed > 0 ? `Invited ${ok} users — ${mailed} invite email${mailed !== 1 ? 's' : ''} sent` : `Invited ${ok} of ${emails.length} users`, 'success');
    closeModal();
  };

  const onExcelImport = async () => {
    if (!xlsxRows.length) { push('No rows to import', 'error'); return; }
    setXlsxLoading(true); let ok = 0; let mailed = 0;
    for (const row of xlsxRows) {
      try {
        const fd = new FormData();
        fd.append('name', row.name || row.email.split('@')[0] || 'User');
        fd.append('email', row.email);
        fd.append('password', Math.random().toString(36).slice(-10));
        fd.append('role', row.role || 'user');
        const res = await usersApi.create(fd);
        const newId = (res as { data?: { id?: number } })?.data?.id;
        if (newId && importEntities.length) { await usersApi.assignEntities(newId, importEntities); }
        ok++;
        if ((res as { data?: { invite_sent?: boolean } })?.data?.invite_sent) mailed++;
      } catch { /* skip */ }
    }
    invalidate();
    push(mailed > 0 ? `Imported ${ok} users — ${mailed} invite email${mailed !== 1 ? 's' : ''} sent` : `Imported ${ok} of ${xlsxRows.length} users`, 'success');
    setXlsxLoading(false); closeModal();
  };

  const handleExcelFile = async (file: File) => {
    const raw = await parseExcelFile(file);
    setXlsxRows(parseExcelRows(raw));
  };

  const copyEmail = (u: User) => {
    navigator.clipboard.writeText(u.email);
    setCopiedId(u.id); setTimeout(() => setCopiedId(null), 1500);
  };

const toggleSelect = (id: number) =>
    setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const filtered = useMemo(() => {
    const users = data?.users ?? [];
    return users.filter(u => {
      const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
      const matchRole   = !roleFilter   || u.role === roleFilter;
      const matchStatus = !statusFilter || u.status === statusFilter;
      return matchSearch && matchRole && matchStatus;
    });
  }, [data?.users, search, roleFilter, statusFilter]);

  const { sort, setSort, sorted } = useSort<User & Record<string, unknown>>(
    filtered as (User & Record<string, unknown>)[],
    'name'
  );
  const pg = usePagination(sorted);

  // Workload: max tasks in current page for relative bar
  const maxTasks = useMemo(() => Math.max(1, ...sorted.map(u => u.total_tasks ?? 0)), [sorted]);

  const activeFilters = [search, roleFilter, statusFilter].filter(Boolean).length;

  const allPageSelected = pg.paged.length > 0 && pg.paged.every(u => selected.has(u.id));
  const toggleAllPage = () => {
    if (allPageSelected) setSelected(s => { const n = new Set(s); pg.paged.forEach(u => n.delete(u.id)); return n; });
    else setSelected(s => { const n = new Set(s); pg.paged.forEach(u => n.add(u.id)); return n; });
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sort?.key !== col) return <ArrowUpDown className="h-3 w-3 opacity-40" />;
    return sort.dir === 'asc' ? <ArrowUp className="h-3 w-3 text-primary-500" /> : <ArrowDown className="h-3 w-3 text-primary-500" />;
  };

  if (isLoading || !data) return <PageSpinner />;
  const allEntities = entityData?.entities ?? [];
  const tabCls = (t: CreateTab) => cn(
    'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
    createTab === t ? 'bg-primary-600 text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Users</h2>
          <p className="text-sm text-slate-500">{data.users.length} members</p>
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
          <Button onClick={openCreate} size="sm"><Plus className="h-4 w-4" /> Add User</Button>
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
                  placeholder="Search users..."
                  className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
              <Select options={roleOptions}   placeholder="All roles"    value={roleFilter}   onChange={e => { setRoleFilter(e.target.value); pg.setPage(1); }} />
              <Select options={statusOptions} placeholder="All statuses" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); pg.setPage(1); }} />
              {activeFilters > 0 && (
                <Button variant="outline" size="sm" onClick={() => { setSearch(''); setRoleFilter(''); setStatusFilter(''); }}>
                  <X className="h-3.5 w-3.5" /> Clear
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      {selected.size > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-primary-200 bg-primary-50 px-4 py-2.5 dark:border-primary-800/40 dark:bg-primary-900/20">
          <span className="text-sm font-medium text-primary-700 dark:text-primary-300">{selected.size} user{selected.size !== 1 ? 's' : ''} selected</span>
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
                {([['name', 'User'], ['role', 'Role'], ['status', 'Status']] as [SortKey, string][]).map(([key, label]) => (
                  <th key={key} className="px-5 py-3 text-left">
                    <button onClick={() => setSort(key)} className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                      {label} <SortIcon col={key} />
                    </button>
                  </th>
                ))}
                <th className="px-5 py-3 text-left">
                  <button onClick={() => setSort('total_tasks')} className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                    Workload <SortIcon col="total_tasks" />
                  </button>
                </th>
                <th className="px-5 py-3 text-left">
                  <button onClick={() => setSort('total_hours')} className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                    Hours <SortIcon col="total_hours" />
                  </button>
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Last Active</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Entities</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {pg.paged.map(u => {
                const taskPct = maxTasks > 0 ? Math.round(((u.total_tasks ?? 0) / maxTasks) * 100) : 0;
                const workloadColor = taskPct >= 80 ? 'bg-red-500' : taskPct >= 50 ? 'bg-amber-500' : 'bg-emerald-500';
                return (
                  <tr key={u.id} className={cn('hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors', selected.has(u.id) && 'bg-primary-50/50 dark:bg-primary-900/10')}>
                    <td className="w-10 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(u.id)}
                        onChange={() => toggleSelect(u.id)}
                        className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                      />
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={u.name} avatar={u.avatar} size="sm" />
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-slate-100">{u.name}</p>
                          <button
                            onClick={() => copyEmail(u)}
                            className="flex items-center gap-1 text-xs text-slate-400 hover:text-primary-600 transition-colors"
                          >
                            {copiedId === u.id ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                            {u.email}
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant={u.role === 'admin' ? 'purple' : 'blue'}>{u.role}</Badge>
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant={u.status === 'active' ? 'green' : 'gray'}>{u.status}</Badge>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <Activity className="h-3 w-3 text-slate-400 shrink-0" />
                        <div className="flex flex-col gap-0.5 min-w-[80px]">
                          <div className="flex items-center gap-1.5">
                            <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                              <div className={cn('h-full rounded-full transition-all', workloadColor)} style={{ width: `${taskPct}%` }} />
                            </div>
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{u.total_tasks ?? 0}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{formatHours(u.total_hours ?? 0)}</td>
                    <td className="px-5 py-3 text-xs text-slate-400">{formatDate(u.last_active)}</td>
                    <td className="px-5 py-3 text-xs text-slate-500 dark:text-slate-400 max-w-[160px]">
                      {u.entity_names ? (
                        <div className="flex flex-wrap gap-1">
                          {u.entity_names.split(', ').map(name => (
                            <span key={name} className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-medium text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
                              {name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(u)}><Pencil className="h-3.5 w-3.5" /></Button>
                        {u.role !== 'admin' && (
                          <Button variant="ghost" size="sm" title="Assign Entities" onClick={() => openEntityAssign(u)}>
                            <Building2 className="h-3.5 w-3.5 text-violet-400" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(u)}><Trash2 className="h-3.5 w-3.5 text-red-400" /></Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {pg.totalItems === 0 && (
            <EmptyState
              icon={UserIcon}
              title={activeFilters > 0 ? 'No users match your filters' : 'No users yet'}
              description={activeFilters > 0 ? 'Try adjusting your filters' : 'Add your first user'}
              action={activeFilters === 0 ? <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4" /> Add User</Button> : undefined}
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
            <p className="text-sm font-semibold text-slate-400">Deleted Users ({data.deleted.length})</p>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {data.deleted.map(u => (
              <div key={u.id} className="flex items-center justify-between px-5 py-3 opacity-60">
                <div className="flex items-center gap-3">
                  <Avatar name={u.name} avatar={u.avatar} size="sm" />
                  <span className="text-sm line-through">{u.name} ({u.email})</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => restoreMutation.mutate(u.id)}><RotateCcw className="h-3.5 w-3.5" /> Restore</Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editTarget ? 'Edit User' : 'Add User'}
        size={!editTarget && createTab === 'excel' ? 'lg' : undefined}
        footer={
          <>
            <Button variant="outline" size="sm" onClick={closeModal}>Cancel</Button>
            {editTarget ? (
              <Button size="sm" loading={updateMutation.isPending} onClick={onEditSubmit}>Save</Button>
            ) : createTab === 'single' ? (
              <Button size="sm" loading={createMutation.isPending} onClick={onSingleSubmit}>Create</Button>
            ) : createTab === 'multi' ? (
              <Button size="sm" loading={createMutation.isPending} onClick={onMultiInvite} disabled={!multiEmails.filter(e => isValidEmail(e)).length}><Mail className="h-3.5 w-3.5" /> Send Invites ({multiEmails.filter(e => isValidEmail(e)).length})</Button>
            ) : (
              <Button size="sm" loading={xlsxLoading} onClick={onExcelImport} disabled={!xlsxRows.length}><Upload className="h-3.5 w-3.5" /> Import ({xlsxRows.length})</Button>
            )}
          </>
        }
      >
        {editTarget ? (
          <form className="flex flex-col gap-4">
            <Input label="Name"  error={editForm.formState.errors.name?.message}  {...editForm.register('name')} />
            <Input label="Email" type="email" error={editForm.formState.errors.email?.message} {...editForm.register('email')} />
            <Input label="New Password (leave blank to keep)" type="password" {...editForm.register('password')} />
            <Select label="Role"   options={roleOptions}   {...editForm.register('role')} />
            <Select label="Status" options={statusOptions} {...editForm.register('status')} />
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Avatar</label>
              <input type="file" accept="image/*" onChange={e => setAvatarFile(e.target.files?.[0] ?? null)}
                className="text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-primary-50 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-primary-700 dark:file:bg-primary-900/30 dark:file:text-primary-300" />
            </div>
          </form>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
              <button className={tabCls('single')} onClick={() => setCreateTab('single')}><UserIcon className="h-3.5 w-3.5" /> Single</button>
              <button className={tabCls('multi')}  onClick={() => setCreateTab('multi')}><Mail className="h-3.5 w-3.5" /> Multi-Invite</button>
              <button className={tabCls('excel')}  onClick={() => setCreateTab('excel')}><Upload className="h-3.5 w-3.5" /> Excel Import</button>
            </div>

            {createTab === 'single' && (
              <form className="flex flex-col gap-4">
                <Input label="Name"     error={createForm.formState.errors.name?.message}     {...createForm.register('name')} />
                <Input label="Email"    type="email" error={createForm.formState.errors.email?.message} {...createForm.register('email')} />
                <Input label="Password" type="password" error={createForm.formState.errors.password?.message} {...createForm.register('password')} />
                <Select label="Role" options={roleOptions} {...createForm.register('role')} />
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Avatar (optional)</label>
                  <input type="file" accept="image/*" onChange={e => setAvatarFile(e.target.files?.[0] ?? null)}
                    className="text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-primary-50 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-primary-700 dark:file:bg-primary-900/30 dark:file:text-primary-300" />
                </div>
              </form>
            )}

            {createTab === 'multi' && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Email Addresses
                  </label>
                  <EmailTagInput tags={multiEmails} onChange={setMultiEmails} />
                  <p className="text-xs text-slate-400">
                    Type an email and press <kbd className="rounded border border-slate-200 px-1 dark:border-slate-700">Enter</kbd> or <kbd className="rounded border border-slate-200 px-1 dark:border-slate-700">,</kbd> to add · or paste multiple at once
                  </p>
                </div>
                <Select label="Default Role" options={roleOptions} value={multiRole} onChange={e => setMultiRole(e.target.value)} />
                {allEntities.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">Assign to Entities (optional)</p>
                    <div className="grid grid-cols-2 gap-2">
                      {allEntities.map(e => (
                        <label key={e.id} className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 p-2 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-700/30">
                          <input type="checkbox" checked={importEntities.includes(e.id)} onChange={() => setImportEntities(s => s.includes(e.id) ? s.filter(x => x !== e.id) : [...s, e.id])}
                            className="h-3.5 w-3.5 rounded border-slate-300 text-primary-600" />
                          <span className="truncate text-xs text-slate-700 dark:text-slate-300">{e.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                <p className="text-xs text-slate-400">A random password will be generated for each user.</p>
                {multiEmails.length > 0 && (
                  <p className="text-xs font-medium text-primary-600">
                    {multiEmails.filter(e => isValidEmail(e)).length} valid · {multiEmails.filter(e => !isValidEmail(e)).length > 0 && <span className="text-amber-600">{multiEmails.filter(e => !isValidEmail(e)).length} invalid (shown in amber)</span>}
                  </p>
                )}
              </div>
            )}

            {createTab === 'excel' && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500">Required columns: <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">name, email</code> — Optional: <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">role</code></p>
                  <button
                    type="button"
                    onClick={() => downloadSampleExcel(
                      ['name', 'email', 'role'],
                      ['John Smith', 'john@example.com', 'user'],
                      'users-sample.xlsx',
                    )}
                    className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400"
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
                  <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleExcelFile(f); }} />
                </div>
                {xlsxRows.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-semibold text-slate-600 dark:text-slate-300">{xlsxRows.length} rows detected — Preview:</p>
                    <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-800">
                          <tr>{['Name', 'Email', 'Role'].map(h => <th key={h} className="px-3 py-2 text-left font-semibold text-slate-500">{h}</th>)}</tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                          {xlsxRows.slice(0, 20).map((r, i) => (
                            <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                              <td className="px-3 py-1.5 text-slate-700 dark:text-slate-300">{r.name || '—'}</td>
                              <td className="px-3 py-1.5 text-slate-700 dark:text-slate-300">{r.email}</td>
                              <td className="px-3 py-1.5 text-slate-400">{r.role}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {xlsxRows.length > 20 && <p className="mt-1 text-xs text-slate-400">+{xlsxRows.length - 20} more rows</p>}
                  </div>
                )}
                {allEntities.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">Assign to Entities (optional)</p>
                    <div className="grid grid-cols-2 gap-2">
                      {allEntities.map(e => (
                        <label key={e.id} className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 p-2 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-700/30">
                          <input type="checkbox" checked={importEntities.includes(e.id)} onChange={() => setImportEntities(s => s.includes(e.id) ? s.filter(x => x !== e.id) : [...s, e.id])}
                            className="h-3.5 w-3.5 rounded border-slate-300 text-primary-600" />
                          <span className="truncate text-xs text-slate-700 dark:text-slate-300">{e.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Assign Entities Modal */}
      <Modal
        open={!!entityTarget}
        onClose={() => setEntityTarget(null)}
        title={`Assign Entities — ${entityTarget?.name}`}
        size="md"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setEntityTarget(null)}>Cancel</Button>
            <Button size="sm" loading={entityAssignMutation.isPending} onClick={() => entityAssignMutation.mutate()}>Save</Button>
          </>
        }
      >
        {allEntities.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">No entities found.</p>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {allEntities.map(e => (
              <label key={e.id} className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-3 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-700/30 transition-colors">
                <input
                  type="checkbox"
                  checked={selectedEntities.includes(e.id)}
                  onChange={() => toggleEntity(e.id)}
                  className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{e.name}</p>
                  {e.description && <p className="truncate text-xs text-slate-400">{e.description}</p>}
                </div>
              </label>
            ))}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget!.id)}
        loading={deleteMutation.isPending}
        message={`Delete user "${deleteTarget?.name}"?`}
      />

      <ConfirmDialog
        open={bulkDeleteOpen}
        onClose={() => setBulkDeleteOpen(false)}
        onConfirm={() => bulkDeleteMutation.mutate(Array.from(selected))}
        loading={bulkDeleteMutation.isPending}
        message={`Delete ${selected.size} selected user${selected.size !== 1 ? 's' : ''}? This cannot be undone.`}
      />
    </div>
  );
}
