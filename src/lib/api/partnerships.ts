import { apiClient } from './client';

export interface GeneralApplication {
  id: string;
  name: string;
  email: string;
  company?: string;
  phone?: string;
  partnership_type: 'strategic' | 'technology' | 'marketing' | 'business' | 'international' | 'innovation' | 'other';
  message: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface GeneralApplicationFilters {
  status?: 'pending' | 'under_review' | 'approved' | 'rejected' | 'all';
  partnership_type?: 'strategic' | 'technology' | 'marketing' | 'business' | 'international' | 'innovation' | 'other' | 'all';
  search?: string;
  page?: number;
  limit?: number;
}

export interface GeneralApplicationResponse {
  success: boolean;
  message?: string;
  data?: {
    applications: GeneralApplication[];
    total: number;
    page: number;
    limit: number;
  };
}

export const partnershipsAPI = {
  getGeneralApplications: async (filters?: GeneralApplicationFilters): Promise<GeneralApplicationResponse> => {
    const params = new URLSearchParams();
    if (filters?.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters?.partnership_type && filters.partnership_type !== 'all') params.append('partnership_type', filters.partnership_type);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    return apiClient.get<GeneralApplicationResponse>(`/admin/partnerships/general${params.toString() ? `?${params.toString()}` : ''}`);
  },

  getGeneralApplicationById: async (applicationId: string): Promise<GeneralApplication> => {
    return apiClient.get<GeneralApplication>(`/admin/partnerships/general/${applicationId}`);
  },

  approveGeneralApplication: async (applicationId: string, notes?: string): Promise<void> => {
    await apiClient.post(`/admin/partnerships/general/${applicationId}/approve`, { notes });
  },

  rejectGeneralApplication: async (applicationId: string, reason: string, notes?: string): Promise<void> => {
    await apiClient.post(`/admin/partnerships/general/${applicationId}/reject`, { reason, notes });
  },

  updateGeneralApplicationStatus: async (applicationId: string, status: GeneralApplication['status'], notes?: string): Promise<void> => {
    await apiClient.patch(`/admin/partnerships/general/${applicationId}/status`, { status, notes });
  },

  getGeneralPartnershipStats: async (): Promise<{
    total: number;
    pending: number;
    under_review: number;
    approved: number;
    rejected: number;
  }> => {
    return apiClient.get('/admin/partnerships/general/stats');
  },
};
