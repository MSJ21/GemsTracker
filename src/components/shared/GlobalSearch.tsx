import { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Search, Building2, FolderKanban, Users, ClipboardList,
  X, ArrowRight, LayoutDashboard, FileBarChart2, Target,
  Zap, Bell,
} from 'lucide-react';
import { entitiesApi } from '@/api/entities';
import { projectsApi } from '@/api/projects';
import { usersApi } from '@/api/users';
import { tasksApi } from '@/api/tasks';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/utils/helpers';

interface Result {
  id:    string;
  type:  'entity' | 'project' | 'user' | 'task';
  label: string;
  sub?:  string;
  href:  string;
}

const ADMIN_QUICK_LINKS = [
  { label: 'Dashboard',   href: '/admin/dashboard',      icon: LayoutDashboard },
  { label: 'Entities',    href: '/admin/entities',        icon: Building2 },
  { label: 'Projects',    href: '/admin/projects',        icon: FolderKanban },
  { label: 'Users',       href: '/admin/users',           icon: Users },
  { label: 'Reports',     href: '/admin/reports',         icon: FileBarChart2 },
  { label: 'Org Chart',   href: '/admin/org-chart',       icon: Users },
];

const USER_QUICK_LINKS = [
  { label: 'Dashboard',     href: '/user/dashboard',      icon: LayoutDashboard },
  { label: 'My Tasks',      href: '/user/tasks',          icon: ClipboardList },
  { label: 'Sprint Board',  href: '/user/sprints',        icon: Zap },
  { label: 'Goals & OKRs',  href: '/user/goals',          icon: Target },
  { label: 'Reports',       href: '/user/reports',        icon: FileBarChart2 },
  { label: 'Announcements', href: '/user/announcements',  icon: Bell },
];

const ICONS = {
  entity:  Building2,
  project: FolderKanban,
  user:    Users,
  task:    ClipboardList,
};

const TYPE_CLS: Record<Result['type'], string> = {
  entity:  'text-primary-600 bg-primary-50 dark:bg-primary-900/30',
  project: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30',
  user:    'text-violet-600 bg-violet-50 dark:bg-violet-900/30',
  task:    'text-amber-600 bg-amber-50 dark:bg-amber-900/30',
};

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [q, setQ]       = useState('');
  const [sel, setSel]   = useState(0);
  const inputRef        = useRef<HTMLInputElement>(null);
  const navigate        = useNavigate();
  const { user }        = useAuthStore();
  const isAdmin         = user?.role === 'admin';

  /* ── Open/close listeners ─────────────────────────────────────── */
  useEffect(() => {
    // Native Ctrl+K shortcut
    const keyHandler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(o => !o);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    // Custom event fired by the Topbar search button
    const openHandler = () => setOpen(true);

    document.addEventListener('keydown', keyHandler);
    document.addEventListener('app:search:open', openHandler);
    return () => {
      document.removeEventListener('keydown', keyHandler);
      document.removeEventListener('app:search:open', openHandler);
    };
  }, []);

  /* ── Focus input when opening ─────────────────────────────────── */
  useEffect(() => {
    if (open) {
      setQ('');
      setSel(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  /* ── Data queries ─────────────────────────────────────────────── */
  // Admin-only sources (fetched once, cached)
  const { data: entityData } = useQuery({
    queryKey: ['entities'],
    queryFn:  () => entitiesApi.list().then(r => r.data),
    enabled:   isAdmin,
    staleTime: 5 * 60 * 1000,
  });
  const { data: projData } = useQuery({
    queryKey: ['admin-projects'],
    queryFn:  () => projectsApi.list().then(r => r.data),
    enabled:   isAdmin,
    staleTime: 5 * 60 * 1000,
  });
  const { data: userData } = useQuery({
    queryKey: ['admin-users'],
    queryFn:  () => usersApi.list().then(r => r.data),
    enabled:   isAdmin,
    staleTime: 5 * 60 * 1000,
  });

  // User project search (non-admin)
  const { data: userProjData } = useQuery({
    queryKey: ['user-projects-search'],
    queryFn:  () => projectsApi.userProjects().then(r => r.data ?? []),
    enabled:   !isAdmin && open,
    staleTime: 5 * 60 * 1000,
  });

  // Tasks — prefetch the moment the palette opens (not when typing),
  // so results are instant once the user starts typing.
  const { data: taskData, isFetching: tasksFetching } = useQuery({
    queryKey: ['all-tasks-search'],
    queryFn:  () => tasksApi.list().then(r => r.data ?? []),
    enabled:   open,
    staleTime: 60_000,
  });

  /* ── Build result list ────────────────────────────────────────── */
  const results: Result[] = useMemo(() => {
    if (!q.trim()) return [];
    const lq = q.toLowerCase();

    const tasks: Result[] = (taskData ?? [])
      .filter(t =>
        t.title.toLowerCase().includes(lq) ||
        (t.project_name ?? '').toLowerCase().includes(lq) ||
        (t.description ?? '').toLowerCase().includes(lq)
      )
      .slice(0, 5)
      .map(t => ({
        id:    `t-${t.id}`,
        type:  'task' as const,
        label: t.title,
        sub:   `${t.project_name} · ${t.status}`,
        href:  isAdmin ? '/admin/reports' : '/user/tasks',
      }));

    if (!isAdmin) {
      // User: also search their projects
      const projects: Result[] = (Array.isArray(userProjData) ? userProjData : [])
        .filter(p => p.name.toLowerCase().includes(lq))
        .slice(0, 3)
        .map(p => ({
          id:    `p-${p.id}`,
          type:  'project' as const,
          label: p.name,
          sub:   p.entity_name,
          href:  '/user/projects',
        }));
      return [...tasks, ...projects];
    }

    // Admin: search everything
    const entities: Result[] = (entityData?.entities ?? [])
      .filter(e => e.name.toLowerCase().includes(lq))
      .slice(0, 3)
      .map(e => ({
        id:    `e-${e.id}`,
        type:  'entity' as const,
        label: e.name,
        sub:   e.description ?? undefined,
        href:  `/admin/entities/${e.id}`,
      }));

    const projects: Result[] = (projData?.projects ?? [])
      .filter(p =>
        p.name.toLowerCase().includes(lq) ||
        p.entity_name.toLowerCase().includes(lq)
      )
      .slice(0, 3)
      .map(p => ({
        id:    `p-${p.id}`,
        type:  'project' as const,
        label: p.name,
        sub:   p.entity_name,
        href:  `/admin/projects/${p.id}`,
      }));

    const users: Result[] = (userData?.users ?? [])
      .filter(u =>
        u.name.toLowerCase().includes(lq) ||
        u.email.toLowerCase().includes(lq)
      )
      .slice(0, 3)
      .map(u => ({
        id:    `u-${u.id}`,
        type:  'user' as const,
        label: u.name,
        sub:   u.email,
        href:  '/admin/users',
      }));

    return [...tasks, ...entities, ...projects, ...users];
  }, [q, entityData, projData, userData, taskData, userProjData, isAdmin]);

  /* ── Reset selection when results change ──────────────────────── */
  useEffect(() => { setSel(0); }, [results.length]);

  /* ── Keyboard navigation inside the list ─────────────────────── */
  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel(s => Math.min(s + 1, results.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setSel(s => Math.max(s - 1, 0)); }
    if (e.key === 'Enter' && results[sel]) { navigate(results[sel].href); setOpen(false); }
  };

  const quickLinks = isAdmin ? ADMIN_QUICK_LINKS : USER_QUICK_LINKS;

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center pt-20 px-4"
      data-testid="global-search-overlay"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close search"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Panel */}
      <div
        className="relative w-full max-w-xl animate-scale-in overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
        data-testid="global-search-panel"
      >
        {/* Input row */}
        <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
          <Search className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
          <input
            ref={inputRef}
            data-testid="global-search-input"
            value={q}
            onChange={e => { setQ(e.target.value); setSel(0); }}
            onKeyDown={handleKey}
            placeholder={isAdmin ? 'Search tasks, projects, users, entities…' : 'Search tasks and projects…'}
            className="flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-slate-100"
            aria-label="Global search"
            autoComplete="off"
          />
          {tasksFetching && !q && (
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-primary-300 border-t-primary-600" />
          )}
          {q && (
            <button
              type="button"
              onClick={() => setQ('')}
              aria-label="Clear search"
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="hidden rounded-md border border-slate-200 px-1.5 py-0.5 text-xs text-slate-400 dark:border-slate-700 sm:block">
            Esc
          </kbd>
        </div>

        {/* Results / quick nav */}
        {results.length > 0 ? (
          <ul
            className="max-h-80 overflow-y-auto py-2"
            data-testid="global-search-results"
          >
            {results.map((r, i) => {
              const Icon = ICONS[r.type];
              return (
                <li key={r.id}>
                  <button
                    type="button"
                    data-testid={`search-result-${r.id}`}
                    className={cn(
                      'flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors',
                      i === sel
                        ? 'bg-primary-50 dark:bg-primary-900/20'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40',
                    )}
                    onClick={() => { navigate(r.href); setOpen(false); }}
                    onMouseEnter={() => setSel(i)}
                  >
                    <div className={cn('flex h-7 w-7 items-center justify-center rounded-lg shrink-0', TYPE_CLS[r.type])}>
                      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{r.label}</p>
                      {r.sub && <p className="text-xs text-slate-400 truncate">{r.sub}</p>}
                    </div>
                    <span className="shrink-0 rounded-full bg-slate-100 dark:bg-slate-700 px-2 py-0.5 text-[10px] font-medium text-slate-500 dark:text-slate-400 capitalize">
                      {r.type}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600 shrink-0" aria-hidden="true" />
                  </button>
                </li>
              );
            })}
          </ul>
        ) : q ? (
          <div className="px-4 py-10 text-center" data-testid="global-search-empty">
            <Search className="mx-auto mb-3 h-8 w-8 text-slate-200 dark:text-slate-700" />
            <p className="text-sm text-slate-400">
              No results for{' '}
              <span className="font-medium text-slate-600 dark:text-slate-300">"{q}"</span>
            </p>
            <p className="mt-1 text-xs text-slate-400">Try a different keyword</p>
          </div>
        ) : (
          /* Quick navigation */
          <div className="px-4 py-4" data-testid="global-search-quick-nav">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Quick Navigation
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {quickLinks.map(link => (
                <button
                  key={link.label}
                  type="button"
                  onClick={() => { navigate(link.href); setOpen(false); }}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm
                             text-slate-600 transition-colors hover:border-primary-300 hover:bg-primary-50
                             hover:text-primary-700 dark:border-slate-700 dark:text-slate-300
                             dark:hover:border-primary-700 dark:hover:bg-primary-900/20"
                >
                  <link.icon className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 shrink-0" aria-hidden="true" />
                  <span className="truncate">{link.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Footer hint */}
        <div className="border-t border-slate-100 px-4 py-2.5 dark:border-slate-800">
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span>
              <kbd className="rounded border border-slate-200 px-1 dark:border-slate-700">↑↓</kbd>{' '}
              navigate
            </span>
            <span>
              <kbd className="rounded border border-slate-200 px-1 dark:border-slate-700">↵</kbd>{' '}
              open
            </span>
            <span>
              <kbd className="rounded border border-slate-200 px-1 dark:border-slate-700">Esc</kbd>{' '}
              close
            </span>
            <span className="ml-auto">
              <kbd className="rounded border border-slate-200 px-1 dark:border-slate-700">Ctrl K</kbd>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
