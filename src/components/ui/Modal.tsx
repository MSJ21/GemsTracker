import { type ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/utils/helpers';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  footer?: ReactNode;
}

const sizes = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-2xl' };

export function Modal({ open, onClose, title, children, size = 'md', footer }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) {
      document.addEventListener('keydown', handler);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Full-screen backdrop — blocks all background interaction */}
      <button
        type="button"
        aria-label="Close modal"
        className="absolute inset-0 w-full cursor-default bg-slate-900/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className={cn(
        'relative z-10 w-full flex flex-col',
        'rounded-2xl bg-white dark:bg-slate-900',
        'border border-slate-200 dark:border-slate-700',
        'shadow-2xl shadow-black/30',
        sizes[size],
        'max-h-[90vh]',
      )}>
        {/* Top accent line */}
        <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-2xl bg-gradient-to-r from-primary-500 via-primary-400 to-violet-500" />

        {/* Header — fixed inside the panel */}
        <div className="flex shrink-0 items-center justify-between rounded-t-2xl border-b border-slate-100 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="min-h-0 flex-1 overflow-y-auto bg-white px-6 py-5 dark:bg-slate-900">
          {children}
        </div>

        {/* Footer — fixed at bottom */}
        {footer && (
          <div className="flex shrink-0 justify-end gap-2 rounded-b-2xl border-t border-slate-100 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/50">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
