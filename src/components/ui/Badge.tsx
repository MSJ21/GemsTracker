import { type HTMLAttributes } from 'react';
import { cn } from '@/utils/helpers';

type Variant = 'green' | 'amber' | 'blue' | 'red' | 'gray' | 'purple';

interface Props extends HTMLAttributes<HTMLSpanElement> { variant?: Variant; }

const variants: Record<Variant, { wrap: string; dot: string }> = {
  green:  { wrap: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20',  dot: 'bg-emerald-500' },
  amber:  { wrap: 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20',             dot: 'bg-amber-500' },
  blue:   { wrap: 'bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/20',                   dot: 'bg-blue-500' },
  red:    { wrap: 'bg-red-50 text-red-700 ring-red-200 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/20',                         dot: 'bg-red-500' },
  gray:   { wrap: 'bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:ring-slate-600',                  dot: 'bg-slate-400' },
  purple: { wrap: 'bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-500/10 dark:text-violet-400 dark:ring-violet-500/20',       dot: 'bg-violet-500' },
};

export function Badge({ variant = 'gray', className, children, ...props }: Props) {
  const v = variants[variant];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        v.wrap,
        className
      )}
      {...props}
    >
      <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', v.dot)} />
      {children}
    </span>
  );
}

export function projectStatusBadge(status: string) {
  const map: Record<string, Variant> = { active: 'green', 'on-hold': 'amber', completed: 'blue' };
  return <Badge variant={map[status] ?? 'gray'}>{status}</Badge>;
}

export function taskStatusBadge(status: string) {
  const map: Record<string, Variant> = { pending: 'amber', 'in-progress': 'blue', done: 'green' };
  return <Badge variant={map[status] ?? 'gray'}>{status}</Badge>;
}

export function priorityBadge(priority: string) {
  const map: Record<string, Variant> = { low: 'blue', medium: 'amber', high: 'red', critical: 'purple' };
  const icons: Record<string, string> = { low: '↓', medium: '→', high: '↑', critical: '⚡' };
  return (
    <Badge variant={map[priority] ?? 'gray'}>
      <span className="mr-0.5 font-bold">{icons[priority] ?? ''}</span>
      {priority}
    </Badge>
  );
}

export function dueDateBadge(dueDate: string | null | undefined) {
  if (!dueDate) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const due   = new Date(dueDate); due.setHours(0, 0, 0, 0);
  const diff  = Math.round((due.getTime() - today.getTime()) / 86400000);

  if (diff < 0)  return <Badge variant="red">Overdue {Math.abs(diff)}d</Badge>;
  if (diff === 0) return <Badge variant="amber">Due today</Badge>;
  if (diff <= 3)  return <Badge variant="amber">Due in {diff}d</Badge>;
  return <Badge variant="gray">Due {dueDate}</Badge>;
}
