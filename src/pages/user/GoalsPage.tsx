import { useQuery } from '@tanstack/react-query';
import { goalsApi, type Goal, type KeyResult } from '@/api/goals';
import { Target, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';

function ProgressBar({ value }: { value: number }) {
  const pct = Math.min(100, Math.max(0, value));
  const color = pct >= 75 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 rounded-full bg-slate-200 dark:bg-slate-700 h-2 overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-medium text-slate-600 dark:text-slate-400 w-8 text-right">{pct}%</span>
    </div>
  );
}

export default function UserGoalsPage() {
  const { data = [], isLoading } = useQuery({
    queryKey: ['goals'],
    queryFn: () => goalsApi.list().then(r => r.data ?? []),
  });

  const goals: Goal[] = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Goals & OKRs</h1>
        <p className="text-sm text-slate-500 mt-1">Track your team's objectives and key results</p>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-slate-500">Loading...</div>
      ) : goals.length === 0 ? (
        <div className="text-center py-16">
          <Target className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No goals have been set yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {goals.map(g => <GoalCard key={g.id} goal={g} />)}
        </div>
      )}
    </div>
  );
}

function GoalCard({ goal }: { goal: Goal }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden">
      <div className="p-5">
        <div className="flex items-start gap-3 mb-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900/30">
            <Target className="h-4 w-4 text-primary-600 dark:text-primary-400" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-slate-900 dark:text-white">{goal.title}</h3>
            {goal.owner_name && <p className="text-xs text-slate-500 mt-0.5">Owner: {goal.owner_name}</p>}
            {goal.description && <p className="text-sm text-slate-500 mt-1">{goal.description}</p>}
          </div>
        </div>
        <ProgressBar value={goal.progress} />
        <div className="mt-3 flex items-center justify-between">
          <div className="flex gap-2">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              goal.status === 'active'    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
              goal.status === 'completed' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
              'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
            }`}>{goal.status}</span>
            {goal.due_date && <span className="text-xs text-slate-400">Due {goal.due_date}</span>}
          </div>
          {goal.key_results.length > 0 && (
            <button onClick={() => setExpanded(e => !e)} className="flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 hover:underline">
              {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              {goal.key_results.length} Key Results
            </button>
          )}
        </div>
      </div>
      {expanded && goal.key_results.length > 0 && (
        <div className="border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 divide-y divide-slate-100 dark:divide-slate-700">
          {goal.key_results.map((kr: KeyResult) => (
            <div key={kr.id} className="px-5 py-3">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-sm text-slate-700 dark:text-slate-300">{kr.title}</span>
                <span className="text-xs text-slate-400">{kr.current_val} / {kr.target}{kr.unit ? ` ${kr.unit}` : ''}</span>
              </div>
              <ProgressBar value={kr.target > 0 ? (kr.current_val / kr.target) * 100 : 0} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
