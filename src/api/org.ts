import { apiClient } from './client';
import type { ApiResponse } from '@/types';

export interface OrgUser {
  id: number;
  name: string;
  email: string;
  job_title: string | null;
  avatar: string | null;
  role: string;
  status: string;
  manager_id: number | null;
  children: OrgUser[];
}

export const orgApi = {
  tree: () =>
    apiClient.get<ApiResponse<OrgUser[]>>('/admin/org-chart').then(r => r.data),

  setManager: (userId: number, managerId: number | null) =>
    apiClient.post<ApiResponse<null>>(`/admin/users/${userId}/set-manager`, { manager_id: managerId }).then(r => r.data),
};
