import { apiClient } from './client';

/**
 * Reports API
 * Handles internal report management for staff
 */

export type ReportType = 'incident' | 'performance' | 'financial' | 'user_activity' | 'operational' | 'other';
export type ReportVisibility = 'department' | 'escalated' | 'all';
export type ReportStatus = 'draft' | 'submitted' | 'under_review' | 'reviewed' | 'archived';
export type ReportPriority = 'low' | 'normal' | 'high' | 'critical';

export interface ReportAttachment {
  type: string;
  url: string;
  name: string;
  size?: string;
}

export interface Report {
  id: string;
  reportNumber: string;
  title: string;
  reportType: ReportType;
  content: string;
  data: any;
  createdBy: string;
  createdByName: string;
  departmentId: string | null;
  departmentName: string | null;
  visibility: ReportVisibility;
  status: ReportStatus;
  priority: ReportPriority;
  reviewedBy: string | null;
  reviewedByName: string | null;
  reviewedAt: Date | null;
  reviewNotes: string | null;
  attachments: ReportAttachment[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
  submittedAt: string | null;
}

export interface ReportStats {
  total: number;
  byStatus: {
    draft: number;
    submitted: number;
    under_review: number;
    reviewed: number;
    archived: number;
  };
  byType: {
    incident: number;
    performance: number;
    financial: number;
    user_activity: number;
    operational: number;
    other: number;
  };
  byPriority: {
    low: number;
    normal: number;
    high: number;
    critical: number;
  };
  pendingReview: number;
}

export interface ReportFilters {
  reportType?: ReportType;
  status?: ReportStatus;
  visibility?: ReportVisibility;
  priority?: ReportPriority;
  createdBy?: string;
  departmentId?: string;
  search?: string;
  tag?: string;
}

export interface CreateReportRequest {
  title: string;
  reportType: ReportType;
  content: string;
  data?: any;
  visibility?: ReportVisibility;
  priority?: ReportPriority;
  attachments?: ReportAttachment[];
  tags?: string[];
}

export interface UpdateReportRequest {
  title?: string;
  reportType?: ReportType;
  content?: string;
  data?: any;
  visibility?: ReportVisibility;
  priority?: ReportPriority;
  attachments?: ReportAttachment[];
  tags?: string[];
}

export interface ReviewReportRequest {
  status: 'under_review' | 'reviewed';
  reviewNotes?: string;
}

export const reportsAPI = {
  /**
   * Get report statistics
   * GET /reports/stats
   */
  getStats: async (): Promise<ReportStats> => {
    return apiClient.get<ReportStats>('/reports/stats');
  },

  /**
   * Get all reports
   * GET /reports
   */
  getReports: async (filters?: ReportFilters): Promise<Report[]> => {
    const params = new URLSearchParams();
    if (filters?.reportType) params.append('reportType', filters.reportType);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.visibility) params.append('visibility', filters.visibility);
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.createdBy) params.append('createdBy', filters.createdBy);
    if (filters?.departmentId) params.append('departmentId', filters.departmentId);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.tag) params.append('tag', filters.tag);

    return apiClient.get<Report[]>(`/reports${params.toString() ? `?${params.toString()}` : ''}`);
  },

  /**
   * Get report by ID
   * GET /reports/:id
   */
  getReportById: async (reportId: string): Promise<Report> => {
    return apiClient.get<Report>(`/reports/${reportId}`);
  },

  /**
   * Create a new report
   * POST /reports
   */
  createReport: async (report: CreateReportRequest): Promise<Report> => {
    return apiClient.post<Report>('/reports', report);
  },

  /**
   * Update report (only draft reports)
   * PATCH /reports/:id
   */
  updateReport: async (reportId: string, updates: UpdateReportRequest): Promise<Report> => {
    return apiClient.patch<Report>(`/reports/${reportId}`, updates);
  },

  /**
   * Submit report
   * POST /reports/:id/submit
   */
  submitReport: async (reportId: string): Promise<Report> => {
    return apiClient.post<Report>(`/reports/${reportId}/submit`, {});
  },

  /**
   * Review report
   * POST /reports/:id/review
   */
  reviewReport: async (reportId: string, review: ReviewReportRequest): Promise<Report> => {
    return apiClient.post<Report>(`/reports/${reportId}/review`, review);
  },

  /**
   * Escalate report
   * POST /reports/:id/escalate
   */
  escalateReport: async (reportId: string): Promise<Report> => {
    return apiClient.post<Report>(`/reports/${reportId}/escalate`, {});
  },
};
