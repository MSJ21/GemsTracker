import { apiClient } from './client';
import type { ApiResponse, Task, TaskFilters, Subtask, TaskComment, TimeEntry, FilterPreset } from '@/types';

export interface TaskPayload {
  project_id?: number;
  user_id?: number;
  title?: string;
  description?: string;
  hours_spent?: number;
  status?: string;
  priority?: string;
  task_date?: string;
  due_date?: string | null;
  recur_type?: string | null;
  recur_end?: string | null;
  issue_type?: string;
  story_points?: number | null;
  sprint_id?: number | null;
  assignee_id?: number | null;
}

export const tasksApi = {
  list: (filters?: TaskFilters) =>
    apiClient.get<ApiResponse<Task[]>>('/tasks', { params: filters }).then(r => r.data),

  create: (body: TaskPayload) =>
    apiClient.post<ApiResponse<{ id: number }>>('/tasks', body).then(r => r.data),

  bulkCreate: (tasks: TaskPayload[]) =>
    apiClient.post<ApiResponse<{ created: number }>>('/tasks/bulk', { tasks }).then(r => r.data),

  update: (id: number, body: Partial<TaskPayload>) =>
    apiClient.put<ApiResponse<null>>(`/tasks/${id}`, body).then(r => r.data),

  delete: (id: number) =>
    apiClient.delete<ApiResponse<null>>(`/tasks/${id}`).then(r => r.data),

  restore: (id: number) =>
    apiClient.post<ApiResponse<null>>(`/tasks/${id}/restore`).then(r => r.data),

  spawnRecurring: () =>
    apiClient.post<ApiResponse<{ spawned: number }>>('/tasks/spawn-recurring').then(r => r.data),
};

export const subtasksApi = {
  list: (taskId: number) =>
    apiClient.get<ApiResponse<Subtask[]>>(`/tasks/${taskId}/subtasks`).then(r => r.data),

  create: (taskId: number, title: string) =>
    apiClient.post<ApiResponse<{ id: number }>>(`/tasks/${taskId}/subtasks`, { title }).then(r => r.data),

  update: (id: number, body: Partial<Subtask>) =>
    apiClient.put<ApiResponse<null>>(`/subtasks/${id}`, body).then(r => r.data),

  delete: (id: number) =>
    apiClient.delete<ApiResponse<null>>(`/subtasks/${id}`).then(r => r.data),

  reorder: (taskId: number, ids: number[]) =>
    apiClient.post<ApiResponse<null>>(`/tasks/${taskId}/subtasks/reorder`, { ids }).then(r => r.data),
};

export const commentsApi = {
  list: (taskId: number) =>
    apiClient.get<ApiResponse<TaskComment[]>>(`/tasks/${taskId}/comments`).then(r => r.data),

  create: (taskId: number, body: string) =>
    apiClient.post<ApiResponse<{ id: number }>>(`/tasks/${taskId}/comments`, { body }).then(r => r.data),

  update: (id: number, body: string) =>
    apiClient.put<ApiResponse<null>>(`/comments/${id}`, { body }).then(r => r.data),

  delete: (id: number) =>
    apiClient.delete<ApiResponse<null>>(`/comments/${id}`).then(r => r.data),
};

export const timerApi = {
  active: () =>
    apiClient.get<ApiResponse<TimeEntry | null>>('/timer/active').then(r => r.data),

  start: (taskId: number) =>
    apiClient.post<ApiResponse<TimeEntry>>(`/tasks/${taskId}/timer/start`).then(r => r.data),

  stop: () =>
    apiClient.post<ApiResponse<TimeEntry>>('/timer/stop').then(r => r.data),

  entries: (taskId: number) =>
    apiClient.get<ApiResponse<TimeEntry[]>>(`/tasks/${taskId}/timer/entries`).then(r => r.data),
};

export const filterPresetsApi = {
  list: () =>
    apiClient.get<ApiResponse<FilterPreset[]>>('/filter-presets').then(r => r.data),

  create: (name: string, filters: TaskFilters) =>
    apiClient.post<ApiResponse<{ id: number }>>('/filter-presets', { name, filters }).then(r => r.data),

  delete: (id: number) =>
    apiClient.delete<ApiResponse<null>>(`/filter-presets/${id}`).then(r => r.data),
};

export const pinnedProjectsApi = {
  list: () =>
    apiClient.get<ApiResponse<{ id: number; name: string; entity_name: string; status: string }[]>>('/pinned-projects').then(r => r.data),

  pin: (id: number) =>
    apiClient.post<ApiResponse<null>>(`/pinned-projects/${id}/pin`).then(r => r.data),

  unpin: (id: number) =>
    apiClient.delete<ApiResponse<null>>(`/pinned-projects/${id}/unpin`).then(r => r.data),
};
