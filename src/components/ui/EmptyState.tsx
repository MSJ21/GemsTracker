import type { LucideIcon } from 'lucide-react';
import { cn } from '@/utils/helpers';

interface Props {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: Props) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 text-center', className)}>
      {Icon && (
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
          <Icon className="h-8 w-8 text-slate-400 dark:text-slate-500" />
        </div>
      )}
      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{title}</p>
      {description && <p className="mt-1 text-xs text-slate-400">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
