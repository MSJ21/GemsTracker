import { apiClient } from './client';
import type { ApiResponse, AdminDashboard, UserDashboard } from '@/types';

export const dashboardApi = {
  admin: () =>
    apiClient.get<ApiResponse<AdminDashboard>>('/admin/dashboard').then(r => r.data),

  user: () =>
    apiClient.get<ApiResponse<UserDashboard>>('/user/dashboard').then(r => r.data),
};
