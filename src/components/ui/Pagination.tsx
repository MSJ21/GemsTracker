import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '@/utils/helpers';

interface Props {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  from: number;
  to: number;
  setPage: (p: number) => void;
  setPageSize: (s: number) => void;
  pageSizeOptions?: number[];
}

export function Pagination({
  page, totalPages, totalItems, pageSize,
  from, to, setPage, setPageSize,
  pageSizeOptions = [10, 20, 50, 100],
}: Props) {
  const pages = buildPages(page, totalPages);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-1 py-2">
      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <span>Show</span>
        <select
          value={pageSize}
          onChange={e => setPageSize(Number(e.target.value))}
          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
        >
          {pageSizeOptions.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <span>entries</span>
        {totalItems > 0 && (
          <span className="ml-2 text-slate-400">
            {from}–{to} of {totalItems}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1">
        <NavBtn onClick={() => setPage(1)} disabled={page === 1} title="First">
          <ChevronsLeft className="h-3.5 w-3.5" />
        </NavBtn>
        <NavBtn onClick={() => setPage(page - 1)} disabled={page === 1} title="Previous">
          <ChevronLeft className="h-3.5 w-3.5" />
        </NavBtn>

        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`dot-${i}`} className="px-1 text-xs text-slate-400">…</span>
          ) : (
            <button
              key={p}
              onClick={() => setPage(p as number)}
              className={cn(
                'flex h-7 min-w-[28px] items-center justify-center rounded-lg px-2 text-xs font-medium transition-colors',
                page === p
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700',
              )}
            >
              {p}
            </button>
          )
        )}

        <NavBtn onClick={() => setPage(page + 1)} disabled={page === totalPages} title="Next">
          <ChevronRight className="h-3.5 w-3.5" />
        </NavBtn>
        <NavBtn onClick={() => setPage(totalPages)} disabled={page === totalPages} title="Last">
          <ChevronsRight className="h-3.5 w-3.5" />
        </NavBtn>
      </div>
    </div>
  );
}

function NavBtn({ onClick, disabled, children, title }: { onClick: () => void; disabled: boolean; children: React.ReactNode; title: string }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30 dark:text-slate-400 dark:hover:bg-slate-700"
    >
      {children}
    </button>
  );
}

function buildPages(page: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | '...')[] = [1];
  if (page > 3) pages.push('...');
  for (let i = Math.max(2, page - 1); i <= Math.min(total - 1, page + 1); i++) pages.push(i);
  if (page < total - 2) pages.push('...');
  pages.push(total);
  return pages;
}
