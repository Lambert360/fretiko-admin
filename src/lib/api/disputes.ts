import { apiClient } from './client';

/**
 * Disputes API
 * Handles dispute management for staff
 */

export interface Dispute {
  id: string;
  disputeId: string;
  orderNumber: string;
  complainant: string;
  respondent: string;
  type: string;
  status: 'open' | 'under_review' | 'resolved' | 'escalated';
  priority?: 'urgent' | 'high' | 'medium' | 'low';
  createdAt: string;
  description?: string;
}

export interface DisputeDetail extends Dispute {
  orderId: string;
  complainant: {
    id: string;
    name: string;
  };
  respondent: {
    id: string;
    name: string;
  };
  reason?: string;
  evidence?: any;
  resolution?: string;
  resolutionReason?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  adminNotes?: string;
  updatedAt: string;
  messages?: Array<{
    id: string;
    message: string;
    senderId: string;
    senderName?: string;
    isAdminMessage: boolean;
    isStaffMessage?: boolean;
    attachments?: Array<{ type: string; url: string }>;
    createdAt: string;
  }>;
  order?: any;
}

export interface DisputeStats {
  totalDisputes: number;
  openDisputes: number;
  underReviewDisputes: number;
  resolvedDisputes: number;
  escalatedDisputes: number;
}

export interface DisputeListResponse {
  disputes: Dispute[];
  total: number;
  page: number;
  limit: number;
}

export interface DisputeFilters {
  status?: 'open' | 'under_review' | 'resolved' | 'escalated' | 'all';
  type?: string | 'all';
  search?: string;
  page?: number;
  limit?: number;
}

export const disputesAPI = {
  /**
   * Get dispute statistics
   * GET /admin/disputes/stats
   */
  getStats: async (): Promise<DisputeStats> => {
    return apiClient.get<DisputeStats>('/admin/disputes/stats');
  },

  /**
   * Get all disputes
   * GET /admin/disputes
   */
  getDisputes: async (filters?: DisputeFilters): Promise<DisputeListResponse> => {
    const params = new URLSearchParams();
    if (filters?.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters?.type && filters.type !== 'all') params.append('type', filters.type);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    return apiClient.get<DisputeListResponse>(`/admin/disputes${params.toString() ? `?${params.toString()}` : ''}`);
  },

  /**
   * Get dispute by ID
   * GET /admin/disputes/:id
   */
  getDisputeById: async (disputeId: string): Promise<DisputeDetail> => {
    return apiClient.get<DisputeDetail>(`/admin/disputes/${disputeId}`);
  },

  /**
   * Resolve dispute
   * POST /admin/disputes/:id/resolve
   */
  resolveDispute: async (
    disputeId: string,
    resolution: string,
    outcome: 'favor_complainant' | 'favor_respondent' | 'partial',
  ): Promise<void> => {
    await apiClient.post(`/admin/disputes/${disputeId}/resolve`, { resolution, outcome });
  },

  /**
   * Escalate dispute
   * POST /admin/disputes/:id/escalate
   */
  escalateDispute: async (
    disputeId: string, 
    reason: string,
    options?: {
      departmentId?: string;
      createReport?: boolean;
      attachments?: Array<{ type: string; url: string; name: string; size?: string }>;
    }
  ): Promise<{ message: string; reportCreated?: boolean; reportNumber?: string }> => {
    return apiClient.post(`/admin/disputes/${disputeId}/escalate`, { 
      reason,
      departmentId: options?.departmentId,
      createReport: options?.createReport,
      attachments: options?.attachments,
    });
  },

  /**
   * Add admin note to dispute
   * POST /admin/disputes/:id/notes
   */
  addAdminNote: async (disputeId: string, note: string): Promise<void> => {
    await apiClient.post(`/admin/disputes/${disputeId}/notes`, { note });
  },

  /**
   * Send message to dispute thread as staff
   * POST /admin/disputes/:id/messages
   */
  sendMessage: async (
    disputeId: string,
    message: string,
    attachments?: Array<{ type: string; url: string }>,
  ): Promise<void> => {
    await apiClient.post(`/admin/disputes/${disputeId}/messages`, { message, attachments });
  },
};
