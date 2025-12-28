import { apiClient } from './client';

/**
 * Appeals API
 * Handles suspension appeal operations for admin panel
 */

export interface Appeal {
  id: string;
  userId: string;
  suspensionReason?: string | null;
  appealReason: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  reviewNotes?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  reviewedByStaff?: {
    id: string;
    fullName: string;
    email: string;
  };
}

export interface AppealsListResponse {
  appeals: Appeal[];
  total: number;
  page: number;
  limit: number;
}

export interface AppealsFilters {
  status?: 'pending' | 'under_review' | 'approved' | 'rejected' | 'all';
  page?: number;
  limit?: number;
}

export const appealsAPI = {
  /**
   * Get all appeals with filters
   * GET /admin/appeals
   */
  getAppeals: async (filters?: AppealsFilters): Promise<AppealsListResponse> => {
    const params = new URLSearchParams();
    if (filters?.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const queryString = params.toString();
    return apiClient.get<AppealsListResponse>(`/admin/appeals${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Review an appeal
   * POST /admin/appeals/:id/review
   */
  reviewAppeal: async (
    appealId: string,
    decision: 'approved' | 'rejected',
    notes?: string,
  ): Promise<{ message: string; appeal: { id: string; status: string } }> => {
    return apiClient.post<{ message: string; appeal: { id: string; status: string } }>(
      `/admin/appeals/${appealId}/review`,
      { decision, notes },
    );
  },
};

