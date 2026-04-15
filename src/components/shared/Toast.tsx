import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useToastStore } from '@/store/toastStore';
import { cn } from '@/utils/helpers';
import type { ToastVariant } from '@/types';

const config: Record<ToastVariant, { icon: typeof CheckCircle2; wrap: string; iconCls: string }> = {
  success: {
    icon:    CheckCircle2,
    wrap:    'bg-white border-emerald-200 dark:bg-slate-900 dark:border-emerald-800',
    iconCls: 'text-emerald-500',
  },
  error: {
    icon:    XCircle,
    wrap:    'bg-white border-red-200 dark:bg-slate-900 dark:border-red-800',
    iconCls: 'text-red-500',
  },
  warning: {
    icon:    AlertTriangle,
    wrap:    'bg-white border-amber-200 dark:bg-slate-900 dark:border-amber-800',
    iconCls: 'text-amber-500',
  },
  info: {
    icon:    Info,
    wrap:    'bg-white border-blue-200 dark:bg-slate-900 dark:border-blue-800',
    iconCls: 'text-blue-500',
  },
};

export function ToastContainer() {
  const { toasts, remove } = useToastStore();

  return (
    <section className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2.5" aria-label="Notifications">
      {toasts.map(toast => {
        const { icon: Icon, wrap, iconCls } = config[toast.variant];
        return (
          <div
            key={toast.id}
            className={cn(
              'flex items-start gap-3 rounded-xl border px-4 py-3.5',
              'shadow-lg shadow-slate-900/10 dark:shadow-black/30',
              'min-w-[280px] max-w-sm',
              'animate-slide-in-right',
              wrap,
            )}
          >
            <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', iconCls)} />
            <p className="flex-1 text-sm font-medium text-slate-800 dark:text-slate-100">
              {toast.message}
            </p>
            <button
              type="button"
              onClick={() => remove(toast.id)}
              className="shrink-0 rounded-md p-0.5 text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </section>
  );
}
