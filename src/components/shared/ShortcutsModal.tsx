import { useEffect, useState } from 'react';
import { Keyboard, X } from 'lucide-react';
import { cn } from '@/utils/helpers';

interface Shortcut { keys: string[]; description: string; }

const SHORTCUTS: { section: string; items: Shortcut[] }[] = [
  {
    section: 'Global',
    items: [
      { keys: ['Ctrl', 'K'], description: 'Open global search' },
      { keys: ['?'],         description: 'Show keyboard shortcuts' },
      { keys: ['Esc'],       description: 'Close modal / dialog' },
    ],
  },
  {
    section: 'Tasks',
    items: [
      { keys: ['Ctrl', 'N'], description: 'New task (on Tasks page)' },
    ],
  },
  {
    section: 'Admin Pages',
    items: [
      { keys: ['Ctrl', 'N'], description: 'New entity / project / user' },
    ],
  },
  {
    section: 'Tables',
    items: [
      { keys: ['Click header'], description: 'Sort column' },
      { keys: ['Click status'], description: 'Cycle status inline' },
      { keys: ['Click priority'], description: 'Cycle task priority' },
    ],
  },
];

function Key({ label }: { label: string }) {
  return (
    <kbd className={cn(
      'inline-flex items-center justify-center rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5',
      'text-[11px] font-mono font-semibold text-slate-600 shadow-sm',
      'dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300',
    )}>
      {label}
    </kbd>
  );
}

export function ShortcutsModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // '?' key — only when not in an input/textarea
      if (e.key === '?' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        setOpen(o => !o);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl dark:bg-slate-900 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <Keyboard className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            <h2 className="font-semibold text-slate-900 dark:text-slate-100">Keyboard Shortcuts</h2>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[60vh] overflow-y-auto px-5 py-4">
          <div className="flex flex-col gap-5">
            {SHORTCUTS.map(section => (
              <div key={section.section}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">{section.section}</p>
                <div className="flex flex-col gap-2">
                  {section.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <span className="text-sm text-slate-700 dark:text-slate-300">{item.description}</span>
                      <div className="flex items-center gap-1">
                        {item.keys.map((k, ki) => (
                          <span key={ki} className="flex items-center gap-1">
                            {ki > 0 && <span className="text-xs text-slate-300">+</span>}
                            <Key label={k} />
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer hint */}
        <div className="border-t border-slate-100 px-5 py-3 dark:border-slate-700">
          <p className="text-center text-xs text-slate-400">Press <Key label="?" /> again or <Key label="Esc" /> to close</p>
        </div>
      </div>
    </div>
  );
}
