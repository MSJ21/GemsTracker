import { apiClient } from './client';
import type { ApiResponse } from '@/types';

export interface ProjectMember {
  id: number;
  project_id: number;
  user_id: number;
  role: 'manager' | 'member';
  name: string;
  email: string;
  avatar: string | null;
  user_status: string;
}

export const membersApi = {
  /** Admin: list members of a project */
  list: (projectId: number) =>
    apiClient.get<ApiResponse<ProjectMember[]>>(`/admin/projects/${projectId}/members`).then(r => r.data),

  /** Admin: add/update member */
  upsert: (projectId: number, userId: number, role: 'manager' | 'member') =>
    apiClient.post<ApiResponse<null>>(`/admin/projects/${projectId}/members`, { user_id: userId, role }).then(r => r.data),

  /** Admin: remove member */
  remove: (projectId: number, userId: number) =>
    apiClient.delete<ApiResponse<null>>(`/admin/projects/${projectId}/members/${userId}`).then(r => r.data),

  /** User-facing: get project members (for assignee dropdown) */
  forProject: (projectId: number) =>
    apiClient.get<ApiResponse<ProjectMember[]>>(`/projects/${projectId}/members`).then(r => r.data),

  /** Update task assignee */
  assignTask: (taskId: number, assigneeId: number | null) =>
    apiClient.patch<ApiResponse<null>>(`/tasks/${taskId}/assignee`, { assignee_id: assigneeId ?? '' }).then(r => r.data),
};
