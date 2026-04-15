import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/utils/helpers';

const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

interface Props {
  highlightDates?: string[]; // ISO date strings to highlight
}

export function MiniCalendar({ highlightDates = [] }: Props) {
  const today   = new Date();
  const [year,  setYear]  = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const highlighted = new Set(highlightDates.map(d => d.split('T')[0]));

  const firstDay  = new Date(year, month, 1).getDay();
  const daysInMo  = new Date(year, month + 1, 0).getDate();
  const daysInPrev= new Date(year, month, 0).getDate();

  const cells: { day: number; cur: boolean }[] = [];
  for (let i = firstDay - 1; i >= 0; i--) cells.push({ day: daysInPrev - i, cur: false });
  for (let d = 1; d <= daysInMo; d++)       cells.push({ day: d, cur: true });
  const rem = 42 - cells.length;
  for (let d = 1; d <= rem; d++)             cells.push({ day: d, cur: false });

  const prev = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const next = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const isToday   = (d: number, cur: boolean) => cur && d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  const isHighlit = (d: number, cur: boolean) => {
    if (!cur) return false;
    const pad = String(d).padStart(2, '0');
    const mo  = String(month + 1).padStart(2, '0');
    return highlighted.has(`${year}-${mo}-${pad}`);
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <button onClick={prev} className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          {MONTH_NAMES[month]} {year}
        </span>
        <button onClick={next} className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Day names */}
      <div className="mb-1 grid grid-cols-7 text-center">
        {DAY_NAMES.map(d => (
          <span key={d} className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{d}</span>
        ))}
      </div>

      {/* Cells */}
      <div className="grid grid-cols-7 gap-0.5 text-center">
        {cells.map((c, i) => (
          <div
            key={i}
            className={cn(
              'flex h-7 w-full items-center justify-center rounded-lg text-xs transition-colors',
              !c.cur && 'text-slate-300 dark:text-slate-600',
              c.cur && !isToday(c.day, c.cur) && !isHighlit(c.day, c.cur) && 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer',
              isToday(c.day, c.cur)   && 'bg-primary-600 font-bold text-white rounded-full',
              isHighlit(c.day, c.cur) && !isToday(c.day, c.cur) && 'bg-emerald-100 text-emerald-700 font-semibold dark:bg-emerald-900/40 dark:text-emerald-400',
            )}
          >
            {c.day}
          </div>
        ))}
      </div>

      {/* Legend */}
      {highlightDates.length > 0 && (
        <div className="mt-3 flex items-center gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-primary-600 inline-block" /> Today</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-400 inline-block" /> Activity</span>
        </div>
      )}
    </div>
  );
}
