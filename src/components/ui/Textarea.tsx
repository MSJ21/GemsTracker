import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/utils/helpers';

interface Props extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, Props>(
  ({ className, label, error, hint, id, rows = 3, required, ...props }, ref) => {
    const areaId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={areaId} className="flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
            {label}
            {required && <span className="text-red-500">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={areaId}
          rows={rows}
          className={cn(
            'w-full resize-y rounded-xl border bg-slate-50 px-3 py-2 text-sm text-slate-900',
            'placeholder:text-slate-400 transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:bg-white',
            'dark:bg-slate-800/80 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-800',
            error
              ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20'
              : 'border-slate-200 hover:border-slate-300 focus:border-primary-500 focus:ring-primary-500/20 dark:border-slate-600 dark:hover:border-slate-500 dark:focus:border-primary-500',
            className
          )}
          {...props}
        />
        {hint && !error && <p className="text-xs text-slate-400">{hint}</p>}
        {error && (
          <p className="flex items-center gap-1 text-xs text-red-500">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
            {error}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
