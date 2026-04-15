import { formClient } from './client';
import type { ApiResponse, AuthUser } from '@/types';

export interface ProfileUpdateData { token: string; user: AuthUser; }

export const profileApi = {
  update: (fd: FormData) =>
    formClient.post<ApiResponse<ProfileUpdateData>>('/user/profile', fd).then(r => r.data),
};
