import { apiClient, formClient } from './client';
import type { ApiResponse, Entity } from '@/types';

export const entitiesApi = {
  list: () =>
    apiClient.get<ApiResponse<{ entities: Entity[]; deleted: Entity[] }>>('/admin/entities').then(r => r.data),

  create: (fd: FormData) =>
    formClient.post<ApiResponse<{ id: number }>>('/admin/entities', fd).then(r => r.data),

  update: (id: number, fd: FormData) =>
    formClient.post<ApiResponse<null>>(`/admin/entities/${id}`, fd).then(r => r.data),

  delete: (id: number) =>
    apiClient.delete<ApiResponse<null>>(`/admin/entities/${id}`).then(r => r.data),

  restore: (id: number) =>
    apiClient.post<ApiResponse<null>>(`/admin/entities/${id}/restore`).then(r => r.data),
};
