import { apiClient } from './client';
import type { ApiResponse } from '@/types';

export interface AuditLog {
  id: number;
  user_id: number | null;
  user_name: string | null;
  user_email: string | null;
  action: string;
  entity: string | null;
  entity_id: number | null;
  changes: Record<string, unknown> | null;
  ip: string | null;
  created_at: string;
}

export const auditLogApi = {
  list: (params?: { entity?: string; entity_id?: number; limit?: number }) =>
    apiClient.get<ApiResponse<AuditLog[]>>('/admin/audit-log', { params }).then(r => r.data),
};
