import { apiClient } from './client';
import type { ApiResponse } from '@/types';

export interface Notification {
  id: number;
  user_id: number;
  type: string;
  title: string;
  body: string;
  link: string;
  is_read: boolean;
  created_at: string;
}

export const notificationsApi = {
  list: () =>
    apiClient.get<ApiResponse<{ items: Notification[]; unread: number }>>('/notifications').then(r => r.data),

  markRead: (id: number) =>
    apiClient.post<ApiResponse<null>>(`/notifications/${id}/read`, {}).then(r => r.data),

  markAllRead: () =>
    apiClient.post<ApiResponse<null>>('/notifications/read-all', {}).then(r => r.data),
};
