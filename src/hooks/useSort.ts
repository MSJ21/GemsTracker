import { useState, useMemo } from 'react';

export type SortDir = 'asc' | 'desc';

export interface SortState {
  key: string;
  dir: SortDir;
}

export interface SortResult<T> {
  sort: SortState | null;
  setSort: (key: string) => void;
  sorted: T[];
}

export function useSort<T extends Record<string, unknown>>(items: T[], defaultKey?: string, defaultDir: SortDir = 'asc'): SortResult<T> {
  const [sort, setRaw] = useState<SortState | null>(defaultKey ? { key: defaultKey, dir: defaultDir } : null);

  const setSort = (key: string) => {
    setRaw(prev => {
      if (prev?.key === key) return { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' };
      return { key, dir: 'asc' };
    });
  };

  const sorted = useMemo(() => {
    if (!sort) return items;
    return [...items].sort((a, b) => {
      const av = a[sort.key];
      const bv = b[sort.key];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
      return sort.dir === 'asc' ? cmp : -cmp;
    });
  }, [items, sort]);

  return { sort, setSort, sorted };
}
