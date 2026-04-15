import { apiClient } from './client';
import type { ApiResponse, Task } from '@/types';

export interface Sprint {
  id: number;
  project_id: number;
  name: string;
  goal: string | null;
  start_date: string | null;
  end_date: string | null;
  status: 'planning' | 'active' | 'completed';
  task_count: number;
  done_count: number;
  total_points: number;
  done_points: number;
  created_at: string;
  tasks?: Task[];
}

export interface SprintPayload {
  name: string;
  goal?: string;
  start_date?: string;
  end_date?: string;
  status?: string;
}

export const sprintsApi = {
  list: (projectId: number) =>
    apiClient.get<ApiResponse<Sprint[]>>(`/projects/${projectId}/sprints`).then(r => r.data),

  get: (id: number) =>
    apiClient.get<ApiResponse<Sprint>>(`/sprints/${id}`).then(r => r.data),

  backlog: (projectId: number) =>
    apiClient.get<ApiResponse<Task[]>>(`/projects/${projectId}/backlog`).then(r => r.data),

  create: (projectId: number, body: SprintPayload) =>
    apiClient.post<ApiResponse<{ id: number }>>(`/projects/${projectId}/sprints`, body).then(r => r.data),

  update: (id: number, body: Partial<SprintPayload>) =>
    apiClient.put<ApiResponse<null>>(`/sprints/${id}`, body).then(r => r.data),

  remove: (id: number) =>
    apiClient.delete<ApiResponse<null>>(`/sprints/${id}`).then(r => r.data),

  assignTask: (sprintId: number, taskId: number) =>
    apiClient.post<ApiResponse<null>>(`/sprints/${sprintId}/tasks`, { task_id: taskId }).then(r => r.data),

  removeTask: (sprintId: number, taskId: number) =>
    apiClient.delete<ApiResponse<null>>(`/sprints/${sprintId}/tasks/${taskId}`).then(r => r.data),
};

export const watchersApi = {
  list: (taskId: number) =>
    apiClient.get<ApiResponse<{ id: number; name: string; avatar: string | null }[]>>(`/tasks/${taskId}/watchers`).then(r => r.data),

  isWatching: (taskId: number) =>
    apiClient.get<ApiResponse<{ watching: boolean }>>(`/tasks/${taskId}/watching`).then(r => r.data),

  toggle: (taskId: number) =>
    apiClient.post<ApiResponse<{ watching: boolean }>>(`/tasks/${taskId}/watch`).then(r => r.data),
};

export const taskLinksApi = {
  list: (taskId: number) =>
    apiClient.get<ApiResponse<TaskLink[]>>(`/tasks/${taskId}/links`).then(r => r.data),

  create: (taskId: number, linkedTaskId: number, linkType: string) =>
    apiClient.post<ApiResponse<null>>(`/tasks/${taskId}/links`, { linked_task_id: linkedTaskId, link_type: linkType }).then(r => r.data),

  remove: (linkId: number) =>
    apiClient.delete<ApiResponse<null>>(`/task-links/${linkId}`).then(r => r.data),
};

export interface TaskLink {
  id: number;
  link_type: string;
  linked_id: number;
  linked_title: string;
  linked_status: string;
  linked_priority: string;
}
