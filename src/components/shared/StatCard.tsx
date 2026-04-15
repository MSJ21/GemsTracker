import { type LucideIcon } from 'lucide-react';
import { cn } from '@/utils/helpers';

interface Props {
  label: string;
  value: number | string;
  icon: LucideIcon;
  color?: 'blue' | 'green' | 'amber' | 'purple';
  trend?: string;
}

const palette = {
  blue: {
    card:  'bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-slate-900 border-blue-100 dark:border-blue-900/30',
    icon:  'bg-gradient-to-br from-blue-500 to-blue-600',
    glow:  'shadow-[0_4px_14px_0px_rgba(59,130,246,0.3)]',
    value: 'text-blue-700 dark:text-blue-300',
    trend: 'text-blue-500/70 dark:text-blue-400/60',
  },
  green: {
    card:  'bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/20 dark:to-slate-900 border-emerald-100 dark:border-emerald-900/30',
    icon:  'bg-gradient-to-br from-emerald-500 to-emerald-600',
    glow:  'shadow-[0_4px_14px_0px_rgba(16,185,129,0.3)]',
    value: 'text-emerald-700 dark:text-emerald-300',
    trend: 'text-emerald-500/70 dark:text-emerald-400/60',
  },
  amber: {
    card:  'bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/20 dark:to-slate-900 border-amber-100 dark:border-amber-900/30',
    icon:  'bg-gradient-to-br from-amber-500 to-orange-500',
    glow:  'shadow-[0_4px_14px_0px_rgba(245,158,11,0.3)]',
    value: 'text-amber-700 dark:text-amber-300',
    trend: 'text-amber-500/70 dark:text-amber-400/60',
  },
  purple: {
    card:  'bg-gradient-to-br from-violet-50 to-white dark:from-violet-950/20 dark:to-slate-900 border-violet-100 dark:border-violet-900/30',
    icon:  'bg-gradient-to-br from-violet-500 to-purple-600',
    glow:  'shadow-[0_4px_14px_0px_rgba(139,92,246,0.3)]',
    value: 'text-violet-700 dark:text-violet-300',
    trend: 'text-violet-500/70 dark:text-violet-400/60',
  },
};

export function StatCard({ label, value, icon: Icon, color = 'blue', trend }: Readonly<Props>) {
  const p = palette[color];
  return (
    <div className={cn(
      'group rounded-2xl border p-5',
      'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg dark:hover:shadow-black/20',
      p.card,
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {label}
          </p>
          <p className={cn('mt-2 text-2xl font-bold tabular-nums tracking-tight', p.value)}>
            {value}
          </p>
          {trend && (
            <p className={cn('mt-1.5 text-xs font-medium', p.trend)}>{trend}</p>
          )}
        </div>
        <div className={cn(
          'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
          'transition-transform duration-200 group-hover:scale-110',
          p.icon, p.glow,
        )}>
          <Icon className="h-5 w-5 text-white" strokeWidth={2} />
        </div>
      </div>
    </div>
  );
}
