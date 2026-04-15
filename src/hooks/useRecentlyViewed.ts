import { useState, useCallback } from 'react';

const KEY = 'pracker-recently-viewed';
const MAX  = 8;

export interface RecentItem {
  type: 'entity' | 'project';
  id: number;
  name: string;
  sub?: string; // entity_name for project
  viewedAt: number;
}

function load(): RecentItem[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]'); }
  catch { return []; }
}

export function useRecentlyViewed() {
  const [items, setItems] = useState<RecentItem[]>(load);

  const track = useCallback((item: Omit<RecentItem, 'viewedAt'>) => {
    setItems(prev => {
      const filtered = prev.filter(i => !(i.type === item.type && i.id === item.id));
      const next = [{ ...item, viewedAt: Date.now() }, ...filtered].slice(0, MAX);
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    localStorage.removeItem(KEY);
    setItems([]);
  }, []);

  return { items, track, clear };
}
