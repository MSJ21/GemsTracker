import { useState, useMemo } from 'react';

export interface PaginationResult<T> {
  page: number;
  pageSize: number;
  setPage: (p: number) => void;
  setPageSize: (s: number) => void;
  totalPages: number;
  totalItems: number;
  paged: T[];
  from: number;
  to: number;
}

export function usePagination<T>(items: T[], defaultPageSize = 10): PaginationResult<T> {
  const [page, setPageRaw]         = useState(1);
  const [pageSize, setPageSizeRaw] = useState(defaultPageSize);

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const setPage = (p: number) => setPageRaw(Math.min(Math.max(1, p), Math.max(1, totalPages)));
  const setPageSize = (s: number) => { setPageSizeRaw(s); setPageRaw(1); };

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page, pageSize]);

  const from = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const to   = Math.min(page * pageSize, totalItems);

  return { page, pageSize, setPage, setPageSize, totalPages, totalItems, paged, from, to };
}
