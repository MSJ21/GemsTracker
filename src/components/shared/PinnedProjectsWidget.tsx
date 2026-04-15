import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Pin, Star, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { pinnedProjectsApi } from '@/api/tasks';
import { projectStatusBadge } from '@/components/ui/Badge';
import { cn } from '@/utils/helpers';

export function PinnedProjectsWidget() {
  const qc = useQueryClient();
  const { data: pinned = [], isLoading } = useQuery({
    queryKey: ['pinned-projects'],
    queryFn:  () => pinnedProjectsApi.list().then(r => r.data ?? []),
  });

  const unpinMut = useMutation({
    mutationFn: (id: number) => pinnedProjectsApi.unpin(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['pinned-projects'] }),
  });

  if (isLoading) return null;
  if (pinned.length === 0) return (
    <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center gap-2">
        <Pin className="h-4 w-4 text-slate-400" />
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Pinned Projects</h3>
      </div>
      <p className="text-xs text-slate-400">
        Star projects from the Projects page to pin them here for quick access.
      </p>
    </div>
  );

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center gap-2">
        <Pin className="h-4 w-4 text-amber-500" />
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Pinned Projects</h3>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500 dark:bg-slate-800">{pinned.length}</span>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {pinned.map(p => (
          <div key={p.id} className="group flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800/50 hover:border-primary-200 dark:hover:border-primary-800 transition-colors">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{p.name}</p>
              <p className="text-[10px] text-slate-400">{p.entity_name}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              {projectStatusBadge(p.status)}
              <Link to={`/admin/projects/${p.id}`}
                className="rounded-lg p-1 text-slate-400 hover:text-primary-500 transition-colors opacity-0 group-hover:opacity-100">
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
              <button
                onClick={() => unpinMut.mutate(p.id)}
                className={cn('rounded-lg p-1 transition-colors opacity-0 group-hover:opacity-100', 'text-amber-500 hover:text-amber-700')}
                title="Unpin"
              >
                <Star className="h-3.5 w-3.5 fill-current" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
