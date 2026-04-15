import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import {
  Plus, Pencil, Trash2, RotateCcw, Building2, FolderKanban,
  Search, Filter, ArrowUpDown, ArrowUp, ArrowDown, Eye, X, Download,
} from 'lucide-react';
import { entitiesApi } from '@/api/entities';
import { useToastStore } from '@/store/toastStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { PageSpinner } from '@/components/ui/Spinner';
import { usePagination } from '@/hooks/usePagination';
import { useSort } from '@/hooks/useSort';
import { cn } from '@/utils/helpers';
import { exportToExcel } from '@/utils/excelUtils';
import type { Entity } from '@/types';

const schema = z.object({
  name:        z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  status:      z.string(),
});

type FormData = z.infer<typeof schema>;
type SortKey  = 'name' | 'project_count' | 'status';

function exportExcel(entities: Entity[]) {
  exportToExcel(
    [
      ['Name', 'Description', 'Status', 'Projects', 'Created'],
      ...entities.map(e => [e.name, e.description ?? '', e.status, e.project_count ?? 0, e.created_at.slice(0, 10)]),
    ],
    `entities-${new Date().toISOString().slice(0, 10)}.xlsx`,
  );
}

export default function EntitiesPage() {
  const qc       = useQueryClient();
  const { push } = useToastStore();

  const [modalOpen, setModalOpen]         = useState(false);
  const [editTarget, setEditTarget]       = useState<Entity | null>(null);
  const [deleteTarget, setDeleteTarget]   = useState<Entity | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [logoFile, setLogoFile]           = useState<File | null>(null);
  const [search, setSearch]               = useState('');
  const [statusFilter, setStatusFilter]   = useState('');
  const [showFilters, setShowFilters]     = useState(false);
  const [selected, setSelected]           = useState<Set<number>>(new Set());

  const { data, isLoading } = useQuery({
    queryKey: ['entities'],
    queryFn:  () => entitiesApi.list().then(r => r.data),
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { status: 'active' },
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['entities'] });
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
    mutationFn: (fd: FormData & { logo?: File }) => {
      const form = new FormData();
      form.append('name', fd.name);
      form.append('description', fd.description ?? '');
      form.append('status', fd.status);
      if (fd.logo) form.append('logo', fd.logo);
      return entitiesApi.create(form);
    },
    onSuccess: () => { invalidate(); push('Entity created', 'success'); closeModal(); },
    onError:   apiErr,
  });

  const updateMutation = useMutation({
    mutationFn: (args: { id: number; data: FormData & { logo?: File } }) => {
      const form = new FormData();
      form.append('name', args.data.name);
      form.append('description', args.data.description ?? '');
      form.append('status', args.data.status);
      if (args.data.logo) form.append('logo', args.data.logo);
      return entitiesApi.update(args.id, form);
    },
    onSuccess: () => { invalidate(); push('Entity updated', 'success'); closeModal(); },
    onError:   apiErr,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => entitiesApi.delete(id),
    onSuccess:  () => { invalidate(); push('Entity deleted', 'success'); setDeleteTarget(null); },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      for (const id of ids) await entitiesApi.delete(id);
    },
    onSuccess: () => {
      invalidate(); push(`Deleted ${selected.size} entities`, 'success');
      setSelected(new Set()); setBulkDeleteOpen(false);
    },
    onError: apiErr,
  });

  const restoreMutation = useMutation({
    mutationFn: (id: number) => entitiesApi.restore(id),
    onSuccess:  () => { invalidate(); push('Entity restored', 'success'); },
  });

  const closeModal = () => { setModalOpen(false); setEditTarget(null); setLogoFile(null); reset({ status: 'active' }); };
  const openCreate = () => { reset({ status: 'active' }); setEditTarget(null); setModalOpen(true); };
  const openEdit   = (e: Entity) => { reset({ name: e.name, description: e.description ?? '', status: e.status }); setEditTarget(e); setModalOpen(true); };

  const onSubmit = (fd: FormData) => {
    const payload = { ...fd, logo: logoFile ?? undefined };
    editTarget ? updateMutation.mutate({ id: editTarget.id, data: payload }) : createMutation.mutate(payload);
  };

  const toggleSelect = (id: number) =>
    setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const filtered = useMemo(() => {
    const entities = data?.entities ?? [];
    return entities.filter(e => {
      const matchSearch = !search || e.name.toLowerCase().includes(search.toLowerCase()) || e.description?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = !statusFilter || e.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [data?.entities, search, statusFilter]);

  const { sort, setSort, sorted } = useSort<Entity & Record<string, unknown>>(
    filtered as (Entity & Record<string, unknown>)[],
    'name'
  );

  const pg = usePagination(sorted);

  const activeFilters = [search, statusFilter].filter(Boolean).length;

  const allPageSelected = pg.paged.length > 0 && pg.paged.every(e => selected.has(e.id));
  const toggleAllPage = () => {
    if (allPageSelected) setSelected(s => { const n = new Set(s); pg.paged.forEach(e => n.delete(e.id)); return n; });
    else setSelected(s => { const n = new Set(s); pg.paged.forEach(e => n.add(e.id)); return n; });
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sort?.key !== col) return <ArrowUpDown className="h-3 w-3 opacity-40" />;
    return sort.dir === 'asc' ? <ArrowUp className="h-3 w-3 text-primary-500" /> : <ArrowDown className="h-3 w-3 text-primary-500" />;
  };

  if (isLoading || !data) return <PageSpinner />;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Entities</h2>
          <p className="text-sm text-slate-500">{data.entities.length} total</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => exportExcel(sorted)}>
            <Download className="h-4 w-4" /> Export Excel
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(f => !f)}
            className={cn(activeFilters > 0 && 'border-primary-400 text-primary-600')}
          >
            <Filter className="h-4 w-4" />
            Filters
            {activeFilters > 0 && (
              <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary-600 text-[10px] font-bold text-white">{activeFilters}</span>
            )}
          </Button>
          <Button onClick={openCreate} size="sm"><Plus className="h-4 w-4" /> Add Entity</Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <div className="p-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={e => { setSearch(e.target.value); pg.setPage(1); }}
                  placeholder="Search entities..."
                  className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
              <Select
                options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]}
                placeholder="All statuses"
                value={statusFilter}
                onChange={e => { setStatusFilter(e.target.value); pg.setPage(1); }}
              />
              {activeFilters > 0 && (
                <Button variant="outline" size="sm" onClick={() => { setSearch(''); setStatusFilter(''); }}>
                  <X className="h-3.5 w-3.5" /> Clear filters
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Bulk actions bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-primary-200 bg-primary-50 px-4 py-2.5 dark:border-primary-800/40 dark:bg-primary-900/20">
          <span className="text-sm font-medium text-primary-700 dark:text-primary-300">{selected.size} entit{selected.size !== 1 ? 'ies' : 'y'} selected</span>
          <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => setBulkDeleteOpen(true)}>
            <Trash2 className="h-3.5 w-3.5" /> Delete selected
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}><X className="h-3.5 w-3.5" /> Clear</Button>
        </div>
      )}

      {/* Table */}
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
                <th className="px-5 py-3 text-left">
                  <button onClick={() => setSort('name')} className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                    Entity <SortIcon col="name" />
                  </button>
                </th>
                <th className="px-5 py-3 text-left">
                  <button onClick={() => setSort('project_count')} className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                    Projects <SortIcon col="project_count" />
                  </button>
                </th>
                <th className="px-5 py-3 text-left">
                  <button onClick={() => setSort('status')} className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                    Status <SortIcon col="status" />
                  </button>
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {pg.paged.map(e => (
                <tr key={e.id} className={cn('hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors', selected.has(e.id) && 'bg-primary-50/50 dark:bg-primary-900/10')}>
                  <td className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(e.id)}
                      onChange={() => toggleSelect(e.id)}
                      className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                    />
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      {e.logo ? (
                        <img src={e.logo} alt={e.name} className="h-9 w-9 rounded-xl object-cover" />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/40 dark:to-primary-800/40">
                          <Building2 className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-slate-100">{e.name}</p>
                        {e.description && <p className="text-xs text-slate-400 truncate max-w-[220px]">{e.description}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                      <FolderKanban className="h-3.5 w-3.5 text-slate-400" />
                      <span className="font-medium">{e.project_count ?? 0}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <Badge variant={e.status === 'active' ? 'green' : 'gray'}>{e.status}</Badge>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1">
                      <Link to={`/admin/entities/${e.id}`}>
                        <Button variant="ghost" size="sm" title="View details">
                          <Eye className="h-3.5 w-3.5 text-slate-400" />
                        </Button>
                      </Link>
                      <Button variant="ghost" size="sm" onClick={() => openEdit(e)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(e)}>
                        <Trash2 className="h-3.5 w-3.5 text-red-400" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {pg.totalItems === 0 && (
            <EmptyState
              icon={Building2}
              title={activeFilters > 0 ? 'No entities match your filters' : 'No entities yet'}
              description={activeFilters > 0 ? 'Try adjusting your search or filters' : 'Create your first entity to get started'}
              action={activeFilters === 0 ? <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4" /> Add Entity</Button> : undefined}
            />
          )}
        </div>

        {pg.totalItems > 0 && (
          <div className="border-t border-slate-100 px-4 dark:border-slate-700">
            <Pagination {...pg} />
          </div>
        )}
      </Card>

      {/* Deleted */}
      {data.deleted.length > 0 && (
        <Card>
          <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-700">
            <p className="text-sm font-semibold text-slate-400">Deleted Entities ({data.deleted.length})</p>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {data.deleted.map(e => (
              <div key={e.id} className="flex items-center justify-between px-5 py-3 opacity-60">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700">
                    <Building2 className="h-3.5 w-3.5 text-slate-400" />
                  </div>
                  <span className="text-sm line-through text-slate-600 dark:text-slate-300">{e.name}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => restoreMutation.mutate(e.id)}>
                  <RotateCcw className="h-3.5 w-3.5" /> Restore
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editTarget ? 'Edit Entity' : 'New Entity'}
        footer={
          <>
            <Button variant="outline" size="sm" onClick={closeModal}>Cancel</Button>
            <Button size="sm" loading={isSubmitting || createMutation.isPending || updateMutation.isPending} onClick={handleSubmit(onSubmit)}>
              {editTarget ? 'Save changes' : 'Create'}
            </Button>
          </>
        }
      >
        <form className="flex flex-col gap-4">
          <Input label="Name" required error={errors.name?.message} {...register('name')} />
          <Textarea label="Description" rows={2} {...register('description')} />
          <Select
            label="Status"
            options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]}
            {...register('status')}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Logo (optional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={e => setLogoFile(e.target.files?.[0] ?? null)}
              className="text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-primary-50 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-primary-700 dark:file:bg-primary-900/30 dark:file:text-primary-300"
            />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget!.id)}
        loading={deleteMutation.isPending}
        message={`Delete "${deleteTarget?.name}"? This can be restored later.`}
      />

      <ConfirmDialog
        open={bulkDeleteOpen}
        onClose={() => setBulkDeleteOpen(false)}
        onConfirm={() => bulkDeleteMutation.mutate(Array.from(selected))}
        loading={bulkDeleteMutation.isPending}
        message={`Delete ${selected.size} selected entit${selected.size !== 1 ? 'ies' : 'y'}?`}
      />
    </div>
  );
}
