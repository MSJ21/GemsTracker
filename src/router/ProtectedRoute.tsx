import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

interface Props { requiredRole?: 'admin' | 'user'; }

export default function ProtectedRoute({ requiredRole }: Props) {
  const { token, user } = useAuthStore();

  if (!token || !user) return <Navigate to="/login" replace />;

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/user/dashboard'} replace />;
  }

  return <Outlet />;
}
