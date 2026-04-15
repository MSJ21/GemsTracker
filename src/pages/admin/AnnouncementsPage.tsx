import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { announcementsApi, type Announcement } from '@/api/announcements';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Megaphone, Plus, Trash2 } from 'lucide-react';
import { useToastStore } from '@/store/toastStore';
import { timeAgo } from '@/utils/helpers';

export default function AnnouncementsPage() {
  const qc    = useQueryClient();
  const toast = useToastStore();

  const { data = [], isLoading } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => announcementsApi.list().then(r => r.data ?? []),
  });

  const [open, setOpen]               = useState(false);
  const [form, setForm]               = useState({ title: '', body: '' });
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null);

  const createMut = useMutation({
    mutationFn: () => announcementsApi.create(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['announcements'] });
      setOpen(false);
      setForm({ title: '', body: '' });
      toast.push('Announcement published', 'success');
    },
    onError: (e: Error) => toast.push(e.message, 'error'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => announcementsApi.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['announcements'] }); toast.push('Deleted', 'success'); setDeleteTarget(null); },
    onError: (e: Error) => toast.push(e.message, 'error'),
  });

  const announcements: Announcement[] = data;

  function renderContent() {
    if (isLoading) return <p className="py-16 text-center text-sm text-slate-400">Loading…</p>;
    if (announcements.length === 0) {
      return (
        <div className="py-20 text-center">
          <Megaphone className="mx-auto mb-3 h-12 w-12 text-slate-300" />
          <p className="text-slate-500">No announcements yet. Create one to inform your team.</p>
        </div>
      );
    }
    return (
      <div className="space-y-3">
        {announcements.map(a => (
          <div key={a.id} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-start gap-4">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
                <Megaphone className="h-4 w-4 text-amber-600" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold text-slate-900 dark:text-white">{a.title}</h3>
                  <button
                    onClick={() => setDeleteTarget(a)}
                    disabled={deleteMut.isPending && deleteTarget?.id === a.id}
                    className="shrink-0 rounded-lg p-1.5 text-slate-300 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100 disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap leading-relaxed">{a.body}</p>
                <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                  <span className="font-medium">{a.author_name}</span>
                  <span>·</span>
                  <span>{timeAgo(a.created_at)}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Announcements</h1>
          <p className="mt-1 text-sm text-slate-500">Broadcast messages to your entire team</p>
        </div>
        <Button onClick={() => setOpen(true)} size="sm">
          <Plus className="h-4 w-4" /> New Announcement
        </Button>
      </div>

      {renderContent()}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMut.mutate(deleteTarget.id)}
        loading={deleteMut.isPending}
        title="Delete Announcement"
        message={`Delete "${deleteTarget?.title}"? This cannot be undone.`}
      />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="New Announcement"
        size="md"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              size="sm"
              loading={createMut.isPending}
              disabled={!form.title.trim() || !form.body.trim()}
              onClick={() => createMut.mutate()}
            >
              Publish
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Title"
            required
            placeholder="Announcement title…"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          />
          <Textarea
            label="Message"
            required
            rows={5}
            placeholder="Write your announcement…"
            value={form.body}
            onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
          />
        </div>
      </Modal>
    </div>
  );
}
