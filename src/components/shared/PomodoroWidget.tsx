import { useState, useEffect, useRef, useCallback } from 'react';
import { Timer, Play, Pause, RotateCcw, Coffee, Brain } from 'lucide-react';
import { cn } from '@/utils/helpers';

type Mode = 'work' | 'short' | 'long';

const MODES: Record<Mode, { label: string; minutes: number; color: string; bg: string; ring: string }> = {
  work:  { label: 'Focus',       minutes: 25, color: 'text-primary-600 dark:text-primary-400',   bg: 'bg-primary-50 dark:bg-primary-900/20',   ring: 'stroke-primary-500' },
  short: { label: 'Short Break', minutes: 5,  color: 'text-emerald-600 dark:text-emerald-400',   bg: 'bg-emerald-50 dark:bg-emerald-900/20',   ring: 'stroke-emerald-500' },
  long:  { label: 'Long Break',  minutes: 15, color: 'text-blue-600 dark:text-blue-400',         bg: 'bg-blue-50 dark:bg-blue-900/20',         ring: 'stroke-blue-500' },
};

function pad(n: number) { return String(n).padStart(2, '0'); }

export function PomodoroWidget() {
  const [mode, setMode]       = useState<Mode>('work');
  const [seconds, setSeconds] = useState(MODES.work.minutes * 60);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef    = useRef<HTMLAudioElement | null>(null);

  const total  = MODES[mode].minutes * 60;
  const mins   = Math.floor(seconds / 60);
  const secs   = seconds % 60;
  const pct    = ((total - seconds) / total) * 100;

  // SVG circle progress
  const r = 52; const circ = 2 * Math.PI * r;
  const dash = circ - (pct / 100) * circ;

  const reset = useCallback((m: Mode = mode) => {
    setRunning(false);
    setSeconds(MODES[m].minutes * 60);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, [mode]);

  const switchMode = (m: Mode) => { setMode(m); reset(m); setSeconds(MODES[m].minutes * 60); };

  const onFinish = useCallback(() => {
    setRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    // Beep via AudioContext
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sine'; osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1);
      osc.start(); osc.stop(ctx.currentTime + 1);
    } catch { /* noop */ }
    if (mode === 'work') {
      setSessions(s => s + 1);
      const next: Mode = sessions > 0 && (sessions + 1) % 4 === 0 ? 'long' : 'short';
      switchMode(next);
    } else {
      switchMode('work');
    }
  }, [mode, sessions]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds(s => {
          if (s <= 1) { onFinish(); return 0; }
          return s - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, onFinish]);

  // Update tab title when running
  useEffect(() => {
    if (running) {
      document.title = `${pad(mins)}:${pad(secs)} — ${MODES[mode].label} | Gems Tracker`;
    } else {
      document.title = 'Gems Tracker';
    }
    return () => { document.title = 'Gems Tracker'; };
  }, [running, mins, secs, mode]);

  const cfg = MODES[mode];

  return (
    <div className={cn('flex flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900', cfg.bg)}>
      {/* Header */}
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-2">
          <Timer className={cn('h-4 w-4', cfg.color)} />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Pomodoro</h3>
        </div>
        {sessions > 0 && (
          <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-slate-800">
            {sessions} {sessions === 1 ? 'session' : 'sessions'}
          </span>
        )}
      </div>

      {/* Mode tabs */}
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
        {(Object.entries(MODES) as [Mode, typeof MODES[Mode]][]).map(([key, m]) => (
          <button key={key} onClick={() => switchMode(key)}
            className={cn('flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
              mode === key ? 'bg-white text-slate-800 shadow dark:bg-slate-700 dark:text-slate-100' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400')}>
            {key === 'work' ? <Brain className="h-3 w-3" /> : <Coffee className="h-3 w-3" />}
            {m.label}
          </button>
        ))}
      </div>

      {/* Circular timer */}
      <div className="relative flex items-center justify-center">
        <svg width="140" height="140" className="-rotate-90">
          <circle cx="70" cy="70" r={r} fill="none" strokeWidth="8" className="stroke-slate-200 dark:stroke-slate-700" />
          <circle
            cx="70" cy="70" r={r} fill="none" strokeWidth="8"
            strokeLinecap="round"
            className={cn('transition-all duration-1000', cfg.ring)}
            strokeDasharray={circ}
            strokeDashoffset={dash}
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className={cn('text-3xl font-bold tabular-nums', cfg.color)}>
            {pad(mins)}:{pad(secs)}
          </span>
          <span className="text-[10px] text-slate-400">{cfg.label}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <button onClick={() => reset()}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600 dark:border-slate-700 dark:hover:border-slate-600 transition-colors">
          <RotateCcw className="h-4 w-4" />
        </button>
        <button onClick={() => setRunning(r => !r)}
          className={cn('flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all hover:scale-105 active:scale-95',
            running ? 'bg-amber-500 text-white shadow-amber-500/30' : 'bg-primary-600 text-white shadow-primary-600/30')}>
          {running ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 translate-x-0.5" />}
        </button>
      </div>

      <audio ref={audioRef} className="hidden" />
    </div>
  );
}
