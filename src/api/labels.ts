import { apiClient } from './client';
import type { ApiResponse } from '@/types';

export interface Label {
  id: number;
  name: string;
  color: string;
  created_at: string;
}

export const labelsApi = {
  list: () =>
    apiClient.get<ApiResponse<Label[]>>('/labels').then(r => r.data),

  create: (data: { name: string; color: string }) =>
    apiClient.post<ApiResponse<Label>>('/labels', data).then(r => r.data),

  update: (id: number, data: { name: string; color: string }) =>
    apiClient.put<ApiResponse<null>>(`/labels/${id}`, data).then(r => r.data),

  remove: (id: number) =>
    apiClient.delete<ApiResponse<null>>(`/labels/${id}`).then(r => r.data),
};
