import { apiClient, formClient } from './client';
import type { ApiResponse } from '@/types';

export interface SiteSettings {
  site_name: string;
  site_logo: string;
}

export interface MailSettings {
  mail_host: string;
  mail_port: string;
  mail_user: string;
  mail_from: string;
  mail_from_name: string;
  app_url: string;
  mail_configured: boolean;
}

export const settingsApi = {
  get: () =>
    apiClient.get<ApiResponse<SiteSettings>>('/admin/settings').then(r => r.data),

  update: (form: FormData) =>
    formClient.post<ApiResponse<SiteSettings>>('/admin/settings', form).then(r => r.data),

  public: () =>
    apiClient.get<ApiResponse<SiteSettings>>('/settings').then(r => r.data),

  getMail: () =>
    apiClient.get<ApiResponse<MailSettings>>('/admin/mail-settings').then(r => r.data),

  updateMail: (data: Partial<MailSettings> & { mail_pass?: string }) =>
    apiClient.post<ApiResponse<{ mail_configured: boolean }>>('/admin/mail-settings', data).then(r => r.data),

  testMail: () =>
    apiClient.post<ApiResponse<null>>('/admin/mail-settings/test', {}).then(r => r.data),
};
