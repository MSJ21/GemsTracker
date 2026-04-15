import { apiClient } from './client';
import type { ApiResponse, AuthUser } from '@/types';

export interface LoginPayload { email: string; password: string; }
export interface LoginData    { token: string; user: AuthUser; }

export const authApi = {
  login: (body: LoginPayload) =>
    apiClient.post<ApiResponse<LoginData>>('/auth/login', body).then(r => r.data),

  me: () =>
    apiClient.get<ApiResponse<AuthUser>>('/auth/me').then(r => r.data),
};
