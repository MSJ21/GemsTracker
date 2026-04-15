import { apiClient } from './client';
import type { ApiResponse, Project } from '@/types';

interface ProjectPayload {
  entity_id: number;
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  status?: string;
}

export const projectsApi = {
  list: () =>
    apiClient.get<ApiResponse<{ projects: Project[]; deleted: Project[] }>>('/admin/projects').then(r => r.data),

  userProjects: () =>
    apiClient.get<ApiResponse<Project[]>>('/user/projects').then(r => r.data),

  create: (body: ProjectPayload) =>
    apiClient.post<ApiResponse<{ id: number }>>('/admin/projects', body).then(r => r.data),

  update: (id: number, body: Partial<ProjectPayload>) =>
    apiClient.put<ApiResponse<null>>(`/admin/projects/${id}`, body).then(r => r.data),

  delete: (id: number) =>
    apiClient.delete<ApiResponse<null>>(`/admin/projects/${id}`).then(r => r.data),

  restore: (id: number) =>
    apiClient.post<ApiResponse<null>>(`/admin/projects/${id}/restore`).then(r => r.data),
};
