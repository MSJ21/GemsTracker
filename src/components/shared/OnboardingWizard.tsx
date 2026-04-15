import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, Building2, FolderKanban, Users, ArrowRight, X, Sparkles } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { dashboardApi } from '@/api/dashboard';
import { cn } from '@/utils/helpers';

const STORAGE_KEY = 'pracker-onboarding-dismissed';

interface Step {
  icon: typeof Building2;
  title: string;
  desc: string;
  cta: string;
  route: string;
  check: (stats: { entities: number; projects: number; users: number }) => boolean;
}

const STEPS: Step[] = [
  {
    icon: Building2,
    title: 'Create your first Entity',
    desc: 'Entities represent organisations or departments. Group projects under them.',
    cta: 'Go to Entities',
    route: '/admin/entities',
    check: s => s.entities > 0,
  },
  {
    icon: FolderKanban,
    title: 'Create your first Project',
    desc: 'Projects live inside entities. Assign tasks and team members to a project.',
    cta: 'Go to Projects',
    route: '/admin/projects',
    check: s => s.projects > 0,
  },
  {
    icon: Users,
    title: 'Invite a team member',
    desc: 'Add users and assign them to projects so they can start logging tasks.',
    cta: 'Go to Users',
    route: '/admin/users',
    check: s => s.users > 1,
  },
];

export function OnboardingWizard() {
  const navigate   = useNavigate();
  const [dismissed, setDismissed] = useState(true); // start hidden until loaded
  const [open, setOpen]           = useState(false);

  useEffect(() => {
    const v = localStorage.getItem(STORAGE_KEY);
    if (!v) { setDismissed(false); setOpen(true); }
  }, []);

  const { data } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn:  () => dashboardApi.admin().then(r => r.data),
    enabled:  !dismissed,
  });

  const stats = data?.stats ?? { entities: 0, projects: 0, users: 0, tasks_today: 0 };
  const done  = STEPS.filter(s => s.check(stats)).length;
  const allDone = done === STEPS.length;

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setDismissed(true);
    setOpen(false);
  };

  if (dismissed || !open) return null;

  const content = (
    <div className="fixed inset-0 z-[100] flex items-end justify-end p-6">
      <div className="flex w-full max-w-sm flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 overflow-hidden">
        {/* Gradient header */}
        <div className="bg-gradient-to-r from-primary-600 to-violet-600 px-5 py-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <h3 className="text-sm font-bold">Getting Started</h3>
            </div>
            <button onClick={dismiss} className="rounded-lg p-1 hover:bg-white/20 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
          {/* Progress bar */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="opacity-80">{done}/{STEPS.length} complete</span>
              {allDone && <span className="font-bold">🎉 All done!</span>}
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-white transition-all duration-500"
                style={{ width: `${(done / STEPS.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Steps */}
        <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
          {STEPS.map((step, i) => {
            const isDone = step.check(stats);
            return (
              <div key={i} className={cn('flex items-start gap-3 px-5 py-4', isDone && 'opacity-60')}>
                <div className={cn(
                  'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                  isDone ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-400 dark:bg-slate-800',
                )}>
                  {isDone ? <CheckCircle className="h-4 w-4" /> : <step.icon className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm font-medium', isDone ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-100')}>
                    {step.title}
                  </p>
                  {!isDone && <p className="mt-0.5 text-xs text-slate-400 leading-relaxed">{step.desc}</p>}
                  {!isDone && (
                    <button
                      onClick={() => navigate(step.route)}
                      className="mt-2 flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
                    >
                      {step.cta} <ArrowRight className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="border-t border-slate-100 px-5 py-3 dark:border-slate-800">
          <button onClick={dismiss} className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
            {allDone ? 'Close — you\'re all set!' : 'Dismiss — I\'ll explore on my own'}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
