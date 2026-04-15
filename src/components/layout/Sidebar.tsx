import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Building2, FolderKanban, Users, BarChart3,
  ClipboardList, Briefcase, FileBarChart, UserCircle, X, Zap,
  Settings, ChevronRight, PanelLeftClose, PanelLeftOpen,
  GitBranch, Megaphone, ScrollText, Target, Map,
} from 'lucide-react';
import { cn, avatarUrl } from '@/utils/helpers';
import { useSettingsStore } from '@/store/settingsStore';
import { useQuery } from '@tanstack/react-query';
import { settingsApi } from '@/api/settings';
import { useEffect } from 'react';

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  badge?: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const adminGroups: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Management',
    items: [
      { to: '/admin/entities',    label: 'Entities',    icon: Building2 },
      { to: '/admin/projects',    label: 'Projects',    icon: FolderKanban },
      { to: '/admin/users',       label: 'Users',       icon: Users },
    ],
  },
  {
    label: 'Team',
    items: [
      { to: '/admin/org-chart',  label: 'Org Chart', icon: GitBranch },
    ],
  },
  {
    label: 'Workspace',
    items: [
      { to: '/admin/goals',          label: 'Goals & OKRs',   icon: Target },
      { to: '/admin/announcements',  label: 'Announcements',  icon: Megaphone },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { to: '/admin/reports',   label: 'Reports',   icon: BarChart3 },
      { to: '/admin/audit-log', label: 'Audit Log', icon: ScrollText },
    ],
  },
  {
    label: 'System',
    items: [
      { to: '/admin/settings', label: 'Settings', icon: Settings },
    ],
  },
];

const userGroups: NavGroup[] = [
  {
    label: 'Workspace',
    items: [
      { to: '/user/dashboard', label: 'Dashboard',     icon: LayoutDashboard },
      { to: '/user/projects',  label: 'Projects',      icon: Briefcase },
      { to: '/user/tasks',     label: 'My Tasks',      icon: ClipboardList },
      { to: '/user/sprints',   label: 'Sprint Board',  icon: Zap },
      { to: '/user/roadmap',   label: 'Roadmap',       icon: Map },
      { to: '/user/reports',   label: 'Reports',       icon: FileBarChart },
    ],
  },
  {
    label: 'Team',
    items: [
      { to: '/user/announcements', label: 'Announcements', icon: Megaphone },
      { to: '/user/goals',         label: 'Goals & OKRs',  icon: Target },
    ],
  },
  {
    label: 'Account',
    items: [
      { to: '/user/profile', label: 'Profile', icon: UserCircle },
    ],
  },
];

interface Props {
  role: string;
  open: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

/* ── Logo / brand ──────────────────────────────────────────────────── */
function SiteLogo({ collapsed }: Readonly<{ collapsed: boolean }>) {
  const { siteName, siteLogo, setSiteSettings } = useSettingsStore();

  const { data } = useQuery({
    queryKey: ['public-settings'],
    queryFn: () => settingsApi.public().then(r => r.data),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (data) setSiteSettings(data.site_name, data.site_logo);
  }, [data, setSiteSettings]);

  const logoSrc = siteLogo ? avatarUrl(siteLogo) : null;

  const icon = (
    <div className="relative shrink-0">
      {logoSrc ? (
        <img
          src={logoSrc}
          alt={siteName}
          className="h-9 w-9 rounded-xl object-cover shadow-lg ring-1 ring-white/10"
        />
      ) : (
        <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-lg shadow-primary-500/30">
          <Zap className="h-[18px] w-[18px] text-white" strokeWidth={2.5} />
          <span className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/20" />
        </div>
      )}
      <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-slate-900 bg-emerald-400" />
    </div>
  );

  if (collapsed) return icon;

  return (
    <div className="flex min-w-0 items-center gap-3">
      {icon}
      <div className="min-w-0 overflow-hidden">
        <p className="truncate text-[15px] font-bold leading-tight tracking-tight text-white">
          {siteName || 'Gems Tracker'}
        </p>
        <p className="text-[10px] leading-tight text-slate-500">Admin Panel</p>
      </div>
    </div>
  );
}

/* ── Main sidebar ──────────────────────────────────────────────────── */
export function Sidebar({ role, open, onClose, collapsed, onToggleCollapse }: Readonly<Props>) {
  const isAdmin = role === 'admin';

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <button
          type="button"
          aria-label="Close sidebar"
          className="fixed inset-0 z-30 w-full cursor-default bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex flex-col',
          'bg-slate-950 border-r border-white/[0.05]',
          'transition-[width] duration-300 ease-in-out',
          'lg:static lg:z-auto lg:translate-x-0',
          // mobile: always full-width overlay
          'w-64',
          // desktop: respect collapsed
          collapsed ? 'lg:w-[68px]' : 'lg:w-64',
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        {/* Brand header */}
        <div
          className={cn(
            'flex h-16 shrink-0 items-center border-b border-white/[0.06]',
            collapsed ? 'lg:justify-center lg:px-0 px-5' : 'justify-between px-5',
          )}
        >
          <SiteLogo collapsed={collapsed} />

          {/* Desktop collapse toggle — hidden on mobile */}
          <button
            type="button"
            onClick={onToggleCollapse}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={cn(
              'hidden lg:flex shrink-0 items-center justify-center rounded-lg p-1.5',
              'text-slate-500 transition-colors hover:bg-white/10 hover:text-white',
              collapsed && 'absolute right-0 top-[14px] -mr-3.5 z-10 rounded-full border border-white/10 bg-slate-800 shadow-md',
            )}
          >
            {collapsed
              ? <PanelLeftOpen  className="h-4 w-4" />
              : <PanelLeftClose className="h-4 w-4" />
            }
          </button>

          {/* Mobile close */}
          <button
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav
          className={cn(
            'flex-1 overflow-y-auto overflow-x-hidden py-4',
            collapsed ? 'lg:px-2 px-3' : 'px-3',
          )}
        >
          {isAdmin ? (
            <div className="flex flex-col gap-4">
              {adminGroups.map(group => (
                <div key={group.label}>
                  {/* Group label — hidden when collapsed on desktop */}
                  <p
                    className={cn(
                      'mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600',
                      'transition-[opacity,height] duration-200',
                      collapsed ? 'lg:h-0 lg:overflow-hidden lg:opacity-0 lg:mb-0' : '',
                    )}
                  >
                    {group.label}
                  </p>
                  <div className="flex flex-col gap-0.5">
                    {group.items.map(item => (
                      <NavItem
                        key={item.to}
                        item={item}
                        onClose={onClose}
                        collapsed={collapsed}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {userGroups.map(group => (
                <div key={group.label}>
                  <p
                    className={cn(
                      'mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600',
                      'transition-[opacity,height] duration-200',
                      collapsed ? 'lg:h-0 lg:overflow-hidden lg:opacity-0 lg:mb-0' : '',
                    )}
                  >
                    {group.label}
                  </p>
                  <div className="flex flex-col gap-0.5">
                    {group.items.map(item => (
                      <NavItem
                        key={item.to}
                        item={item}
                        onClose={onClose}
                        collapsed={collapsed}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </nav>

        {/* Footer */}
        <div
          className={cn(
            'shrink-0 border-t border-white/[0.05] px-3 py-3',
            collapsed && 'lg:px-2',
          )}
        >
          {collapsed ? (
            <div className="hidden lg:flex justify-center">
              <span className="h-2 w-2 rounded-full bg-emerald-400" title="Online" />
            </div>
          ) : (
            <div className="flex items-center justify-between px-2">
              <p className="text-[10px] text-slate-700">Gems Tracker</p>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                Online
              </span>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

/* ── Nav item ──────────────────────────────────────────────────────── */
function NavItem({
  item,
  onClose,
  collapsed,
}: Readonly<{ item: NavItem; onClose: () => void; collapsed: boolean }>) {
  return (
    <div className="relative group/tip">
      <NavLink
        to={item.to}
        onClick={onClose}
        className={({ isActive }) =>
          cn(
            'group relative flex items-center rounded-xl transition-all duration-150',
            'text-sm font-medium',
            collapsed ? 'lg:justify-center lg:px-0 lg:py-2.5 px-3 py-2.5 gap-3' : 'gap-3 px-3 py-2.5',
            isActive
              ? 'bg-primary-600/20 text-white'
              : 'text-slate-400 hover:bg-white/[0.05] hover:text-slate-100',
          )
        }
      >
        {({ isActive }) => (
          <>
            {/* Left accent bar */}
            {isActive && (
              <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary-400" />
            )}

            {/* Icon */}
            <span
              className={cn(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all duration-150',
                isActive
                  ? 'bg-primary-500/20 text-primary-400'
                  : 'text-slate-500 group-hover:bg-white/[0.06] group-hover:text-slate-300',
              )}
            >
              <item.icon className="h-4 w-4" />
            </span>

            {/* Label — hidden when collapsed on desktop */}
            <span
              className={cn(
                'flex-1 truncate transition-[opacity,width] duration-200',
                collapsed ? 'lg:hidden' : '',
              )}
            >
              {item.label}
            </span>

            {item.badge && !collapsed && (
              <span className="shrink-0 rounded-full bg-primary-500/20 px-1.5 py-0.5 text-[10px] font-medium text-primary-400">
                {item.badge}
              </span>
            )}

            {!isActive && !collapsed && (
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-700 opacity-0 transition-opacity group-hover:opacity-100" />
            )}
          </>
        )}
      </NavLink>

      {/* Tooltip — only when collapsed on desktop */}
      <div
        className={cn(
          'pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2',
          'rounded-lg bg-slate-800 px-2.5 py-1.5 shadow-xl ring-1 ring-white/10',
          'text-xs font-medium text-white whitespace-nowrap',
          'opacity-0 scale-95 transition-all duration-150',
          'hidden lg:block',
          collapsed
            ? 'group-hover/tip:opacity-100 group-hover/tip:scale-100'
            : 'lg:hidden',
        )}
      >
        {item.label}
        {/* Arrow */}
        <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-800" />
      </div>
    </div>
  );
}
