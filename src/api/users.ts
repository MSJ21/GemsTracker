import { apiClient, formClient } from './client';
import type { ApiResponse, User } from '@/types';

export const usersApi = {
  list: () =>
    apiClient.get<ApiResponse<{ users: User[]; deleted: User[] }>>('/admin/users').then(r => r.data),

  create: (fd: FormData) =>
    formClient.post<ApiResponse<{ id: number }>>('/admin/users', fd).then(r => r.data),

  update: (id: number, fd: FormData) =>
    formClient.post<ApiResponse<null>>(`/admin/users/${id}`, fd).then(r => r.data),

  delete: (id: number) =>
    apiClient.delete<ApiResponse<null>>(`/admin/users/${id}`).then(r => r.data),

  restore: (id: number) =>
    apiClient.post<ApiResponse<null>>(`/admin/users/${id}/restore`).then(r => r.data),

  getAssignments: (id: number) =>
    apiClient.get<ApiResponse<number[]>>(`/admin/users/${id}/assignments`).then(r => r.data),

  assign: (id: number, project_ids: number[]) =>
    apiClient.post<ApiResponse<null>>(`/admin/users/${id}/assignments`, { project_ids }).then(r => r.data),

  getEntities: (id: number) =>
    apiClient.get<ApiResponse<number[]>>(`/admin/users/${id}/entities`).then(r => r.data),

  assignEntities: (id: number, entity_ids: number[]) =>
    apiClient.post<ApiResponse<null>>(`/admin/users/${id}/entities`, { entity_ids }).then(r => r.data),
};
