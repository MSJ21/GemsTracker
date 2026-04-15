import { useQuery } from '@tanstack/react-query';
import { settingsApi } from '@/api/settings';

const DEFAULT_STATUSES = ['pending', 'in-progress', 'done'];

const LABEL_MAP: Record<string, string> = {
  'pending':     'To Do',
  'in-progress': 'In Progress',
  'done':        'Done',
};

/** Column colors for sprint kanban — cycles through palette for custom statuses */
const COL_PALETTE = [
  { color: 'border-slate-400',   dot: 'bg-slate-400' },
  { color: 'border-blue-400',    dot: 'bg-blue-400' },
  { color: 'border-emerald-400', dot: 'bg-emerald-400' },
  { color: 'border-violet-400',  dot: 'bg-violet-400' },
  { color: 'border-amber-400',   dot: 'bg-amber-400' },
  { color: 'border-pink-400',    dot: 'bg-pink-400' },
  { color: 'border-cyan-400',    dot: 'bg-cyan-400' },
  { color: 'border-rose-400',    dot: 'bg-rose-400' },
];

const COL_COLOR_MAP: Record<string, { color: string; dot: string }> = {
  'pending':     COL_PALETTE[0],
  'in-progress': COL_PALETTE[1],
  'done':        COL_PALETTE[2],
};

function toLabel(key: string): string {
  return LABEL_MAP[key] ?? key.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export interface StatusOption {
  value: string;
  label: string;
}

export interface StatusCol {
  key: string;
  label: string;
  color: string;
  dot: string;
}

export function useTaskStatuses() {
  const { data } = useQuery({
    queryKey: ['public-settings'],
    queryFn:  () => settingsApi.public().then(r => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const keys: string[] = (() => {
    try {
      const raw = (data as Record<string, string> | undefined)?.task_statuses;
      const parsed = raw ? JSON.parse(raw) : DEFAULT_STATUSES;
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_STATUSES;
    } catch {
      return DEFAULT_STATUSES;
    }
  })();

  const options: StatusOption[] = keys.map(k => ({ value: k, label: toLabel(k) }));

  const cols: StatusCol[] = keys.map((k, i) => ({
    key:   k,
    label: toLabel(k),
    ...(COL_COLOR_MAP[k] ?? COL_PALETTE[i % COL_PALETTE.length]),
  }));

  return { options, cols, keys };
}
