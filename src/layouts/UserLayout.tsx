import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';

const titles: Record<string, string> = {
  '/user/dashboard':     'My Dashboard',
  '/user/projects':      'My Projects',
  '/user/tasks':         'My Tasks',
  '/user/reports':       'Reports',
  '/user/profile':       'Profile',
  '/user/announcements': 'Announcements',
  '/user/goals':         'Goals & OKRs',
  '/user/sprints':       'Sprint Board',
  '/user/roadmap':       'Roadmap',
};

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

export default function UserLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { collapsed, toggle }         = useSidebarCollapsed();
  const { pathname }                  = useLocation();

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      <Sidebar
        role="user"
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={toggle}
      />
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Topbar onMenuClick={() => setSidebarOpen(true)} title={titles[pathname]} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="page-enter">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
