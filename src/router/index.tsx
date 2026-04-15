import { createBrowserRouter, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import RootLayout from '@/layouts/RootLayout';
import AdminLayout from '@/layouts/AdminLayout';
import UserLayout from '@/layouts/UserLayout';
import LoginPage from '@/pages/auth/LoginPage';
import AdminDashboard from '@/pages/admin/DashboardPage';
import EntitiesPage from '@/pages/admin/EntitiesPage';
import EntityViewPage from '@/pages/admin/EntityViewPage';
import ProjectsPage from '@/pages/admin/ProjectsPage';
import ProjectViewPage from '@/pages/admin/ProjectViewPage';
import UsersPage from '@/pages/admin/UsersPage';
import AdminReportsPage from '@/pages/admin/ReportsPage';
import AdminSettingsPage from '@/pages/admin/SettingsPage';
import OrgChartPage from '@/pages/admin/OrgChartPage';
import AnnouncementsAdminPage from '@/pages/admin/AnnouncementsPage';
import AuditLogPage from '@/pages/admin/AuditLogPage';
import GoalsAdminPage from '@/pages/admin/GoalsPage';
import UserDashboard from '@/pages/user/DashboardPage';
import UserProjectsPage from '@/pages/user/ProjectsPage';
import TasksPage from '@/pages/user/TasksPage';
import UserReportsPage from '@/pages/user/ReportsPage';
import ProfilePage from '@/pages/user/ProfilePage';
import UserAnnouncementsPage from '@/pages/user/AnnouncementsPage';
import UserGoalsPage from '@/pages/user/GoalsPage';
import SprintPage from '@/pages/user/SprintPage';
import RoadmapPage from '@/pages/user/RoadmapPage';
import NotFoundPage from '@/pages/NotFoundPage';

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      {
        element: <ProtectedRoute requiredRole="admin" />,
        children: [{
          element: <AdminLayout />,
          children: [
            { path: '/admin/dashboard',       element: <AdminDashboard /> },
            { path: '/admin/entities',        element: <EntitiesPage /> },
            { path: '/admin/entities/:id',    element: <EntityViewPage /> },
            { path: '/admin/projects',        element: <ProjectsPage /> },
            { path: '/admin/projects/:id',    element: <ProjectViewPage /> },
            { path: '/admin/users',           element: <UsersPage /> },
            { path: '/admin/reports',         element: <AdminReportsPage /> },
            { path: '/admin/settings',        element: <AdminSettingsPage /> },
            { path: '/admin/org-chart',       element: <OrgChartPage /> },
            { path: '/admin/announcements',   element: <AnnouncementsAdminPage /> },
            { path: '/admin/audit-log',       element: <AuditLogPage /> },
            { path: '/admin/goals',           element: <GoalsAdminPage /> },
          ],
        }],
      },
      {
        element: <ProtectedRoute />,
        children: [{
          element: <UserLayout />,
          children: [
            { path: '/user/dashboard',       element: <UserDashboard /> },
            { path: '/user/projects',        element: <UserProjectsPage /> },
            { path: '/user/tasks',           element: <TasksPage /> },
            { path: '/user/reports',         element: <UserReportsPage /> },
            { path: '/user/profile',         element: <ProfilePage /> },
            { path: '/user/announcements',   element: <UserAnnouncementsPage /> },
            { path: '/user/goals',           element: <UserGoalsPage /> },
            { path: '/user/sprints',         element: <SprintPage /> },
            { path: '/user/roadmap',         element: <RoadmapPage /> },
          ],
        }],
      },
      { path: '/', element: <Navigate to="/login" replace /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
