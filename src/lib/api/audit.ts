import { apiClient } from './client';

/**
 * Audit Logs API
 * Handles audit log viewing for staff
 */

export type AuditAction =
  | 'suspend_user'
  | 'unsuspend_user'
  | 'delete_user'
  | 'edit_user'
  | 'approve_product'
  | 'reject_product'
  | 'remove_product'
  | 'approve_service'
  | 'reject_service'
  | 'remove_service'
  | 'remove_story'
  | 'end_live_stream'
  | 'resolve_dispute'
  | 'escalate_dispute'
  | 'process_payout'
  | 'manage_escrow'
  | 'process_refund'
  | 'assign_delivery'
  | 'manage_rider'
  | 'create_staff'
  | 'edit_staff'
  | 'delete_staff'
  | 'change_password'
  | 'create_department'
  | 'edit_department'
  | 'send_memo'
  | 'create_report'
  | 'review_report'
  | 'login'
  | 'logout'
  | 'export_data';

export type AuditEntityType =
  | 'user'
  | 'product'
  | 'service'
  | 'story'
  | 'live_stream'
  | 'order'
  | 'dispute'
  | 'wallet'
  | 'escrow'
  | 'rider'
  | 'delivery'
  | 'staff'
  | 'department'
  | 'memo'
  | 'report';

export type AuditStatus = 'success' | 'failed' | 'pending';

export interface AuditLog {
  id: string;
  staffId: string;
  staffName: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string | null;
  details: any;
  ipAddress: string | null;
  userAgent: string | null;
  status: AuditStatus;
  errorMessage: string | null;
  createdAt: string;
}

export interface AuditStats {
  totalActions: number;
  successfulActions: number;
  failedActions: number;
  byAction: Record<string, number>;
  byEntityType: Record<string, number>;
  topStaff: Array<{
    staffId: string;
    staffName: string;
    actionCount: number;
  }>;
  recentActions: AuditLog[];
}

export interface AuditFilters {
  staffId?: string;
  action?: AuditAction;
  entityType?: AuditEntityType;
  entityId?: string;
  status?: AuditStatus;
  startDate?: string;
  endDate?: string;
}

export const auditAPI = {
  /**
   * Get audit statistics
   * GET /audit/stats
   */
  getStats: async (): Promise<AuditStats> => {
    return apiClient.get<AuditStats>('/audit/stats');
  },

  /**
   * Get audit logs
   * GET /audit/logs
   */
  getLogs: async (filters?: AuditFilters): Promise<AuditLog[]> => {
    const params = new URLSearchParams();
    if (filters?.staffId) params.append('staffId', filters.staffId);
    if (filters?.action) params.append('action', filters.action);
    if (filters?.entityType) params.append('entityType', filters.entityType);
    if (filters?.entityId) params.append('entityId', filters.entityId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    return apiClient.get<AuditLog[]>(`/audit/logs${params.toString() ? `?${params.toString()}` : ''}`);
  },

  /**
   * Get audit logs for a specific staff member
   * GET /audit/staff/:staffId
   */
  getStaffLogs: async (staffId: string): Promise<AuditLog[]> => {
    return apiClient.get<AuditLog[]>(`/audit/staff/${staffId}`);
  },

  /**
   * Get audit logs for a specific entity
   * GET /audit/entity/:entityType/:entityId
   */
  getEntityLogs: async (entityType: AuditEntityType, entityId: string): Promise<AuditLog[]> => {
    return apiClient.get<AuditLog[]>(`/audit/entity/${entityType}/${entityId}`);
  },
};
