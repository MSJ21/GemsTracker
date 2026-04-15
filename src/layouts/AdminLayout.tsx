import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';

const staticTitles: Record<string, string> = {
  '/admin/dashboard':    'Dashboard',
  '/admin/entities':     'Entities',
  '/admin/projects':     'Projects',
  '/admin/users':        'User Management',
  '/admin/reports':      'Reports',
  '/admin/settings':     'Master Settings',
  '/admin/org-chart':    'Org Chart',
  '/admin/announcements':'Announcements',
  '/admin/audit-log':    'Audit Log',
  '/admin/goals':        'Goals & OKRs',
};

function getTitle(pathname: string): string {
  if (staticTitles[pathname]) return staticTitles[pathname];
  if (/^\/admin\/entities\/\d+/.exec(pathname)) return 'Entity Details';
  if (/^\/admin\/projects\/\d+/.exec(pathname)) return 'Project Details';
  return '';
}

function useSidebarCollapsed() {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try { return localStorage.getItem('sidebar-collapsed') === '1'; } catch { return false; }
  });

  const toggle = () => {
    setCollapsed(c => {
      const next = !c;
      try { localStorage.setItem('sidebar-collapsed', next ? '1' : '0'); } catch { /* noop */ }
      return next;
    });
  };

  return { collapsed, toggle };
}

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { collapsed, toggle }         = useSidebarCollapsed();
  const { pathname }                  = useLocation();

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      <Sidebar
        role="admin"
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={toggle}
      />
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Topbar onMenuClick={() => setSidebarOpen(true)} title={getTitle(pathname)} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="page-enter">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
