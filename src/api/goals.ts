import { apiClient } from './client';
import type { ApiResponse } from '@/types';

export interface KeyResult {
  id: number;
  goal_id: number;
  title: string;
  target: number;
  current_val: number;
  unit: string;
}

export interface Goal {
  id: number;
  title: string;
  description: string;
  owner_id: number | null;
  owner_name: string | null;
  due_date: string | null;
  progress: number;
  status: string;
  key_results: KeyResult[];
  created_at: string;
}

export const goalsApi = {
  list: () =>
    apiClient.get<ApiResponse<Goal[]>>('/goals').then(r => r.data),

  create: (data: {
    title: string;
    description?: string;
    owner_id?: number;
    due_date?: string;
    status?: string;
    key_results?: { title: string; target: number; unit?: string }[];
  }) =>
    apiClient.post<ApiResponse<Goal>>('/goals', data).then(r => r.data),

  update: (id: number, data: Partial<Goal>) =>
    apiClient.put<ApiResponse<Goal>>(`/goals/${id}`, data).then(r => r.data),

  remove: (id: number) =>
    apiClient.delete<ApiResponse<null>>(`/goals/${id}`).then(r => r.data),

  updateKeyResult: (krId: number, data: Partial<KeyResult>) =>
    apiClient.put<ApiResponse<Goal>>(`/key-results/${krId}`, data).then(r => r.data),
};
