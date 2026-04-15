import { apiClient } from './client';
import type { ApiResponse, AdminReport, UserReport, TaskFilters } from '@/types';

export const reportsApi = {
  admin: (filters?: TaskFilters) =>
    apiClient.get<ApiResponse<AdminReport>>('/admin/reports', { params: filters }).then(r => r.data),

  exportCsv: (filters?: TaskFilters) => {
    const params = new URLSearchParams(filters as Record<string, string>).toString();
    const token  = localStorage.getItem('pracker-auth')
      ? JSON.parse(localStorage.getItem('pracker-auth')!).state?.token
      : '';
    window.open(`/api/admin/reports/export?${params}&_token=${token}`);
  },

  user: (filters?: TaskFilters) =>
    apiClient.get<ApiResponse<UserReport>>('/user/reports', { params: filters }).then(r => r.data),
};
