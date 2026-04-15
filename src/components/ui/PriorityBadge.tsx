import { ArrowDown, ArrowRight, ArrowUp } from 'lucide-react';
import { cn } from '@/utils/helpers';
import type { TaskPriority } from '@/types';

const config: Record<TaskPriority, { label: string; cls: string; Icon: typeof ArrowUp }> = {
  critical: { label: 'Critical', cls: 'bg-violet-50 text-violet-600 ring-violet-200 dark:bg-violet-900/20 dark:text-violet-400 dark:ring-violet-800/40', Icon: ArrowUp },
  high:     { label: 'High',     cls: 'bg-red-50 text-red-600 ring-red-200 dark:bg-red-900/20 dark:text-red-400 dark:ring-red-800/40',                    Icon: ArrowUp },
  medium:   { label: 'Medium',   cls: 'bg-amber-50 text-amber-600 ring-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:ring-amber-800/40',        Icon: ArrowRight },
  low:      { label: 'Low',      cls: 'bg-slate-50 text-slate-500 ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700',              Icon: ArrowDown },
};

interface Props {
  priority: TaskPriority | null;
  onClick?: (next: TaskPriority) => void;
  className?: string;
}

const CYCLE: Record<TaskPriority, TaskPriority> = { low: 'medium', medium: 'high', high: 'critical', critical: 'low' };

export function PriorityBadge({ priority, onClick, className }: Props) {
  if (!priority) {
    return onClick ? (
      <button
        onClick={() => onClick('medium')}
        title="Set priority"
        className={cn('rounded-full px-2 py-0.5 text-xs text-slate-300 ring-1 ring-slate-200 hover:text-slate-500 dark:ring-slate-700 dark:text-slate-600 dark:hover:text-slate-400 transition-colors', className)}
      >
        —
      </button>
    ) : null;
  }

  const { label, cls, Icon } = config[priority];

  return (
    <button
      onClick={() => onClick?.(CYCLE[priority])}
      title={`Priority: ${label}${onClick ? ' (click to change)' : ''}`}
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 transition-all',
        cls,
        onClick && 'cursor-pointer hover:opacity-80',
        className,
      )}
    >
      <Icon className="h-2.5 w-2.5" />
      {label}
    </button>
  );
}
