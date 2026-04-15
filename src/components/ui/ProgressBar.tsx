import { cn } from '@/utils/helpers';

interface Props {
  value: number;
  className?: string;
  showLabel?: boolean;
  color?: 'blue' | 'green' | 'amber' | 'red';
}

const gradients: Record<string, string> = {
  blue:  'bg-gradient-to-r from-primary-600 to-primary-400',
  green: 'bg-gradient-to-r from-emerald-600 to-emerald-400',
  amber: 'bg-gradient-to-r from-amber-500 to-orange-400',
  red:   'bg-gradient-to-r from-red-600 to-rose-400',
};

const glows: Record<string, string> = {
  blue:  'shadow-[0_0_8px_0px_rgba(59,130,246,0.45)]',
  green: 'shadow-[0_0_8px_0px_rgba(16,185,129,0.45)]',
  amber: 'shadow-[0_0_8px_0px_rgba(245,158,11,0.45)]',
  red:   'shadow-[0_0_8px_0px_rgba(239,68,68,0.45)]',
};

export function ProgressBar({ value, className, showLabel, color = 'blue' }: Readonly<Props>) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-700 ease-out',
            gradients[color],
            pct > 0 && glows[color],
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span className="w-8 text-right text-xs font-semibold tabular-nums text-slate-500 dark:text-slate-400">
          {pct}%
        </span>
      )}
    </div>
  );
}
