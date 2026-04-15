import { apiClient } from './client';
import type { ApiResponse } from '@/types';

export interface NoteDto {
  id: number;
  user_id: number;
  title: string;
  content: string;
  color: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

interface NotePayload {
  title?: string;
  content?: string;
  color?: string;
  is_pinned?: boolean;
}

export const notesApi = {
  list: () =>
    apiClient.get<ApiResponse<NoteDto[]>>('/notes').then(r => r.data),

  create: (body: NotePayload) =>
    apiClient.post<ApiResponse<NoteDto>>('/notes', body).then(r => r.data),

  update: (id: number, body: NotePayload) =>
    apiClient.put<ApiResponse<NoteDto>>(`/notes/${id}`, body).then(r => r.data),

  delete: (id: number) =>
    apiClient.delete<ApiResponse<null>>(`/notes/${id}`).then(r => r.data),
};
