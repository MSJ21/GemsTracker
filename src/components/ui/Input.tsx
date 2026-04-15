import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/utils/helpers';

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: ReactNode;
  required?: boolean;
}

export const Input = forwardRef<HTMLInputElement, Props>(
  ({ className, label, error, hint, id, icon, required, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
            {label}
            {required && <span className="text-red-500">*</span>}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'h-9 w-full rounded-xl border bg-slate-50 text-sm text-slate-900',
              'placeholder:text-slate-400 transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:bg-white',
              'disabled:cursor-not-allowed disabled:opacity-60',
              'dark:bg-slate-800/80 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-800',
              icon ? 'pl-9 pr-3' : 'px-3',
              error
                ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20 dark:border-red-500'
                : 'border-slate-200 hover:border-slate-300 focus:border-primary-500 focus:ring-primary-500/20 dark:border-slate-600 dark:hover:border-slate-500 dark:focus:border-primary-500',
              className
            )}
            {...props}
          />
        </div>
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

Input.displayName = 'Input';
