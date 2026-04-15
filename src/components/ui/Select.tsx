import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cn } from '@/utils/helpers';

interface Option { value: string; label: string; }

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: Option[];
  placeholder?: string;
  required?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, Props>(
  ({ className, label, error, hint, options, placeholder, id, required, ...props }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={selectId} className="flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
            {label}
            {required && <span className="text-red-500">*</span>}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            'h-9 w-full rounded-xl border bg-slate-50 px-3 text-sm text-slate-900',
            'transition-all duration-200 cursor-pointer',
            'focus:outline-none focus:ring-2 focus:bg-white',
            'disabled:cursor-not-allowed disabled:opacity-60',
            'dark:bg-slate-800/80 dark:text-slate-100 dark:focus:bg-slate-800',
            error
              ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20'
              : 'border-slate-200 hover:border-slate-300 focus:border-primary-500 focus:ring-primary-500/20 dark:border-slate-600 dark:hover:border-slate-500 dark:focus:border-primary-500',
            className
          )}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
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

Select.displayName = 'Select';
