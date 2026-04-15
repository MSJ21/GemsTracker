import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/utils/helpers';
import { Loader2 } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
type Size    = 'sm' | 'md' | 'lg';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary: [
    'relative overflow-hidden',
    'bg-gradient-to-r from-primary-600 to-primary-500 text-white',
    'shadow-sm shadow-primary-500/30',
    'hover:shadow-md hover:shadow-primary-500/40 hover:from-primary-500 hover:to-primary-400',
    'focus-visible:ring-primary-500',
    'after:absolute after:inset-0 after:-translate-x-full after:skew-x-[-20deg]',
    'after:bg-white/20 after:transition-transform after:duration-500',
    'hover:after:translate-x-[120%]',
  ].join(' '),
  secondary: [
    'bg-slate-100 text-slate-800',
    'hover:bg-slate-200',
    'dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700',
    'focus-visible:ring-slate-400',
  ].join(' '),
  danger: [
    'bg-gradient-to-r from-red-600 to-red-500 text-white',
    'shadow-sm shadow-red-500/20',
    'hover:shadow-md hover:shadow-red-500/30',
    'focus-visible:ring-red-500',
  ].join(' '),
  ghost: [
    'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
    'dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100',
    'focus-visible:ring-slate-400',
  ].join(' '),
  outline: [
    'border border-slate-300 bg-transparent text-slate-700',
    'hover:bg-slate-50 hover:border-slate-400',
    'dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800',
    'focus-visible:ring-slate-400',
  ].join(' '),
};

const sizeClasses: Record<Size, string> = {
  sm:  'h-8 px-3 text-xs gap-1.5 rounded-lg',
  md:  'h-9 px-4 text-sm gap-2 rounded-xl',
  lg:  'h-11 px-5 text-sm gap-2 rounded-xl',
};

export const Button = forwardRef<HTMLButtonElement, Props>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-medium',
        'transition-all duration-200 active:scale-[0.97]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      {children}
    </button>
  )
);

Button.displayName = 'Button';
