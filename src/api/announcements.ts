import { apiClient } from './client';
import type { ApiResponse } from '@/types';

export interface Announcement {
  id: number;
  title: string;
  body: string;
  author_name: string;
  is_read: boolean;
  created_at: string;
}

export const announcementsApi = {
  list: () =>
    apiClient.get<ApiResponse<Announcement[]>>('/announcements').then(r => r.data),

  create: (data: { title: string; body: string }) =>
    apiClient.post<ApiResponse<{ id: number }>>('/admin/announcements', data).then(r => r.data),

  remove: (id: number) =>
    apiClient.delete<ApiResponse<null>>(`/admin/announcements/${id}`).then(r => r.data),

  markRead: (id: number) =>
    apiClient.post<ApiResponse<null>>(`/announcements/${id}/read`, {}).then(r => r.data),
};
