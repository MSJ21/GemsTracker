import { Link } from 'react-router-dom';
import { Building2, FolderKanban, Clock, X } from 'lucide-react';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function RecentlyViewedWidget() {
  const { items, clear } = useRecentlyViewed();
  if (items.length === 0) return null;

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-slate-400" />
          Recently Viewed
        </CardTitle>
        <button
          onClick={clear}
          className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        >
          Clear
        </button>
      </CardHeader>
      <div className="grid grid-cols-1 gap-1 px-4 pb-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map(item => {
          const href = item.type === 'entity' ? `/admin/entities/${item.id}` : `/admin/projects/${item.id}`;
          const Icon = item.type === 'entity' ? Building2 : FolderKanban;
          const color = item.type === 'entity'
            ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400'
            : 'bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400';

          return (
            <Link
              key={`${item.type}-${item.id}`}
              to={href}
              className="group flex items-center gap-3 rounded-xl border border-slate-100 p-3 transition-all hover:border-primary-200 hover:bg-slate-50 dark:border-slate-700/60 dark:hover:border-primary-800/40 dark:hover:bg-slate-800/40"
            >
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900 group-hover:text-primary-600 dark:text-slate-100 dark:group-hover:text-primary-400 transition-colors">
                  {item.name}
                </p>
                <p className="text-xs text-slate-400">
                  {item.sub ? `${item.sub} · ` : ''}{timeAgo(item.viewedAt)}
                </p>
              </div>
              <X className="h-3 w-3 shrink-0 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          );
        })}
      </div>
    </Card>
  );
}
