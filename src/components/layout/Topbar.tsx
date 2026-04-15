import { Menu, Moon, Sun, LogOut, User, ChevronDown, Search, Bell, CheckCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { Avatar } from '@/components/shared/Avatar';
import { useState } from 'react';
import { cn } from '@/utils/helpers';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi, type Notification } from '@/api/notifications';
import { timeAgo } from '@/utils/helpers';

function NotificationBell() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.list().then(r => r.data),
    refetchInterval: 30_000,
  });

  const markReadMut = useMutation({
    mutationFn: (id: number) => notificationsApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllMut = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const items: Notification[] = data?.items ?? [];
  const unread: number = data?.unread ?? 0;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(s => !s)}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <button type="button" aria-label="Close" className="fixed inset-0 z-10 cursor-default" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-20 mt-2 w-80 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-4 py-3">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                Notifications {unread > 0 && <span className="ml-1 rounded-full bg-red-100 px-1.5 text-xs font-medium text-red-600">{unread}</span>}
              </p>
              {unread > 0 && (
                <button
                  onClick={() => markAllMut.mutate()}
                  className="flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 hover:underline"
                >
                  <CheckCheck className="h-3.5 w-3.5" /> Mark all read
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800">
              {items.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-400">No notifications</p>
              ) : items.map(n => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => { if (!n.is_read) { markReadMut.mutate(n.id); } setOpen(false); }}
                  className={cn(
                    'w-full text-left px-4 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800',
                    !n.is_read && 'bg-primary-50/50 dark:bg-primary-900/10',
                  )}
                >
                  <div className="flex items-start gap-2">
                    {!n.is_read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary-500" />}
                    <div className={cn('min-w-0', n.is_read && 'ml-4')}>
                      <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">{n.title}</p>
                      {n.body && <p className="text-xs text-slate-500 mt-0.5 truncate">{n.body}</p>}
                      <p className="text-[10px] text-slate-400 mt-1">
                        {timeAgo(n.created_at)}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

interface Props { onMenuClick: () => void; title?: string; }

export function Topbar({ onMenuClick, title }: Readonly<Props>) {
  const { user, logout }        = useAuthStore();
  const { dark, toggle }        = useThemeStore();
  const navigate                = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const openSearch = () => {
    document.dispatchEvent(new CustomEvent('app:search:open'));
  };

  return (
    <header className={cn(
      'sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 px-4 lg:px-6',
      'border-b border-slate-200/80 dark:border-slate-800',
      'bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl',
    )}>
      {/* Mobile menu */}
      <button type="button" onClick={onMenuClick}
        className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 lg:hidden">
        <Menu className="h-5 w-5" />
      </button>

      {/* Title */}
      {title && (
        <h1 className="hidden text-base font-semibold text-slate-900 dark:text-slate-100 sm:block">{title}</h1>
      )}

      {/* Search bar (desktop) */}
      <button
        type="button"
        onClick={openSearch}
        className="hidden lg:flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-400 transition-colors hover:border-slate-300 hover:bg-white dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600"
      >
        <Search className="h-3.5 w-3.5" />
        <span>Search...</span>
        <kbd className="ml-6 rounded border border-slate-200 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 dark:border-slate-700">Ctrl K</kbd>
      </button>

      <div className="ml-auto flex items-center gap-1">
        {/* Mobile search */}
        <button type="button" onClick={openSearch}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors lg:hidden">
          <Search className="h-4 w-4" />
        </button>

        {/* Dark mode toggle */}
        <button type="button" onClick={toggle}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200">
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* Notification bell */}
        <NotificationBell />

        {/* User menu */}
        <div className="relative ml-1">
          <button type="button" onClick={() => setMenuOpen(s => !s)}
            className={cn(
              'flex items-center gap-2 rounded-xl px-2.5 py-1.5 transition-all',
              'hover:bg-slate-100 dark:hover:bg-slate-800',
              menuOpen && 'bg-slate-100 dark:bg-slate-800',
            )}>
            <Avatar name={user?.name ?? ''} avatar={user?.avatar} size="sm" />
            <div className="hidden text-left sm:block">
              <p className="text-xs font-semibold leading-tight text-slate-800 dark:text-slate-100">{user?.name}</p>
              <p className="text-[10px] capitalize text-slate-400">{user?.role}</p>
            </div>
            <ChevronDown className={cn('hidden h-3.5 w-3.5 text-slate-400 transition-transform duration-200 sm:block', menuOpen && 'rotate-180')} />
          </button>

          {menuOpen && (
            <>
              <button type="button" aria-label="Close menu" className="fixed inset-0 z-10 cursor-default" onClick={() => setMenuOpen(false)} />
              <div className={cn(
                'absolute right-0 top-full z-20 mt-2 w-52',
                'rounded-xl border border-slate-200 dark:border-slate-700',
                'bg-white dark:bg-slate-900 shadow-xl shadow-slate-900/10 dark:shadow-black/30',
                'animate-scale-in overflow-hidden',
              )}>
                <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">{user?.name}</p>
                  <p className="mt-0.5 truncate text-[10px] text-slate-400">{user?.email}</p>
                  <span className={cn(
                    'mt-1.5 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium',
                    user?.role === 'admin' ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  )}>
                    {user?.role}
                  </span>
                </div>
                <div className="p-1">
                  <button type="button"
                    onClick={() => { setMenuOpen(false); navigate(user?.role === 'admin' ? '/admin/dashboard' : '/user/profile'); }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors">
                    <User className="h-3.5 w-3.5 text-slate-400" />
                    Profile
                  </button>
                  <button type="button" onClick={toggle}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors">
                    {dark ? <Sun className="h-3.5 w-3.5 text-amber-500" /> : <Moon className="h-3.5 w-3.5 text-slate-400" />}
                    {dark ? 'Light mode' : 'Dark mode'}
                  </button>
                  <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                  <button type="button" onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                    <LogOut className="h-3.5 w-3.5" />
                    Sign out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
