import { apiClient } from './client';

/**
 * Content Reports API
 * Handles user-submitted content reports for moderation
 */

export type ReportCategory = 'product' | 'service' | 'chat' | 'user';
export type ReportType = 
  | 'inappropriate_content' | 'spam' | 'fraudulent_listing' | 'copyright_violation' | 'misleading_information'
  | 'harassment' | 'spam_messages' | 'inappropriate_language' | 'threats'
  | 'suspicious_activity' | 'fake_account' | 'scam_attempt'
  | 'other';

export interface ContentReport {
  id: string;
  reporterId: string;
  reporterName?: string;
  reportCategory: ReportCategory;
  productId?: string;
  serviceId?: string;
  postId?: string;
  chatId?: string;
  reportedUserId?: string;
  reportedUserName?: string;
  reportType: ReportType;
  status: 'pending' | 'under_review' | 'approved' | 'action_taken' | 'dismissed';
  reason: string;
  description?: string;
  evidence?: Array<{ type: 'image' | 'document'; url: string; description: string }>;
  actionTaken?: 'no_action' | 'content_removed' | 'content_hidden' | 'user_warned' | 'user_suspended' | 'user_banned';
  actionReason?: string;
  moderatedBy?: string;
  moderatedByName?: string;
  moderatedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContentReportStats {
  totalReports: number;
  pendingReports: number;
  underReviewReports: number;
  actionTakenReports: number;
  dismissedReports: number;
  byCategory: {
    product: number;
    service: number;
    chat: number;
    user: number;
  };
}

export interface ReviewContentReportRequest {
  status: 'approved' | 'action_taken' | 'dismissed';
  actionTaken?: 'no_action' | 'content_removed' | 'content_hidden' | 'user_warned' | 'user_suspended' | 'user_banned';
  actionReason: string;
}

export interface ContentReportFilters {
  status?: 'pending' | 'under_review' | 'approved' | 'action_taken' | 'dismissed' | 'all';
  category?: ReportCategory | 'all';
  search?: string;
  page?: number;
  limit?: number;
}

export const contentReportsAPI = {
  /**
   * Get content report statistics
   * GET /content-reports/admin/stats
   */
  getStats: async (): Promise<ContentReportStats> => {
    return apiClient.get<ContentReportStats>('/content-reports/admin/stats');
  },

  /**
   * Get all pending reports (moderators only)
   * GET /content-reports/admin/pending
   */
  getPendingReports: async (): Promise<ContentReport[]> => {
    return apiClient.get<ContentReport[]>('/content-reports/admin/pending');
  },

  /**
   * Get all content reports with filters
   * GET /content-reports/admin/all
   */
  getReports: async (filters?: ContentReportFilters): Promise<{ reports: ContentReport[]; total: number }> => {
    const params = new URLSearchParams();
    if (filters?.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters?.category && filters.category !== 'all') params.append('category', filters.category);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    return apiClient.get<{ reports: ContentReport[]; total: number }>(
      `/content-reports/admin/all${params.toString() ? `?${params.toString()}` : ''}`
    );
  },

  /**
   * Get content report by ID
   * GET /content-reports/:id
   */
  getReport: async (reportId: string): Promise<ContentReport> => {
    return apiClient.get<ContentReport>(`/content-reports/${reportId}`);
  },

  /**
   * Review content report (moderators only)
   * POST /content-reports/:id/review
   */
  reviewReport: async (reportId: string, review: ReviewContentReportRequest): Promise<ContentReport> => {
    return apiClient.post<ContentReport>(`/content-reports/${reportId}/review`, review);
  },
};

