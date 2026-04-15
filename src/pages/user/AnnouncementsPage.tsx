import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { announcementsApi, type Announcement } from '@/api/announcements';
import { Megaphone, CheckCheck } from 'lucide-react';
import { timeAgo } from '@/utils/helpers';
import { useToastStore } from '@/store/toastStore';

function iconClass(isRead: boolean) {
  return isRead ? 'bg-slate-100 dark:bg-slate-700' : 'bg-amber-100 dark:bg-amber-900/30';
}

export default function UserAnnouncementsPage() {
  const qc = useQueryClient();
  const toast = useToastStore();

  const { data = [], isLoading } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => announcementsApi.list().then(r => r.data ?? []),
  });

  const markReadMut = useMutation({
    mutationFn: (id: number) => announcementsApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['announcements'] }),
    onError: (e: Error) => toast.push(e.message, 'error'),
  });

  const announcements: Announcement[] = data;
  const unread = announcements.filter(a => !a.is_read).length;

  function renderList() {
    if (isLoading) {
      return <div className="text-center py-12 text-slate-500">Loading...</div>;
    }
    if (announcements.length === 0) {
      return (
        <div className="text-center py-16">
          <Megaphone className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No announcements yet.</p>
        </div>
      );
    }
    return (
      <div className="space-y-4">
        {announcements.map(a => (
          <div
            key={a.id}
            className={`rounded-2xl border bg-white dark:bg-slate-800 p-5 shadow-sm transition-all ${
              a.is_read
                ? 'border-slate-200 dark:border-slate-700'
                : 'border-primary-300 dark:border-primary-700 ring-1 ring-primary-200 dark:ring-primary-800'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${iconClass(a.is_read)}`}>
                <Megaphone className={`h-4 w-4 ${a.is_read ? 'text-slate-400' : 'text-amber-600'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <h3 className={`font-semibold ${a.is_read ? 'text-slate-700 dark:text-slate-300' : 'text-slate-900 dark:text-white'}`}>
                    {a.title}
                    {!a.is_read && (
                      <span className="ml-2 inline-block h-2 w-2 rounded-full bg-primary-500 align-middle" />
                    )}
                  </h3>
                  {!a.is_read && (
                    <button
                      onClick={() => markReadMut.mutate(a.id)}
                      className="shrink-0 flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 hover:underline"
                    >
                      <CheckCheck className="h-3.5 w-3.5" /> Mark read
                    </button>
                  )}
                </div>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{a.body}</p>
                <div className="mt-2 flex items-center gap-3 text-xs text-slate-400">
                  <span>{a.author_name}</span>
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
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Announcements</h1>
        <p className="text-sm text-slate-500 mt-1">
          {unread > 0 ? `${unread} unread` : 'All caught up!'}
        </p>
      </div>
      {renderList()}
    </div>
  );
}
