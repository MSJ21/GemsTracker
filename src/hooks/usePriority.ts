import { useState, useCallback } from 'react';
import type { TaskPriority } from '@/types';

const KEY = 'pracker-task-priorities';

function load(): Record<number, TaskPriority> {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '{}'); }
  catch { return {}; }
}

export function usePriority() {
  const [priorities, setPriorities] = useState<Record<number, TaskPriority>>(load);

  const setPriority = useCallback((taskId: number, priority: TaskPriority | null) => {
    setPriorities(prev => {
      const next = { ...prev };
      if (priority === null) { delete next[taskId]; }
      else { next[taskId] = priority; }
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const getPriority = useCallback((taskId: number): TaskPriority | null => {
    return priorities[taskId] ?? null;
  }, [priorities]);

  return { getPriority, setPriority };
}
