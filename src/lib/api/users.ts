import { apiClient } from './client';

/**
 * User Management API
 * Handles all user-related operations for admin panel
 */

export interface User {
  id: string;
  username: string | null;
  email: string;
  fullName?: string;
  userRole: 'citizen' | 'vendor' | 'rider';
  isActive: boolean;
  isDeleted?: boolean;
  deletedAt?: string | null;
  deletedBy?: string | null;
  createdAt: string;
  avatarUrl?: string;
  ordersCount?: number;
}

export interface UserStats {
  totalUsers: number;
  vendors: number;
  riders: number;
  suspended: number;
}

export interface UserListResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
}

export interface UserFilters {
  role?: 'citizen' | 'vendor' | 'rider' | 'all';
  status?: 'active' | 'suspended' | 'deleted' | 'all';
  search?: string;
  page?: number;
  limit?: number;
}

export const usersAPI = {
  /**
   * Get all users with filters
   * GET /dashboard/users
   */
  getAllUsers: async (filters?: UserFilters): Promise<UserListResponse> => {
    const params = new URLSearchParams();
    if (filters?.role && filters.role !== 'all') params.append('role', filters.role);
    if (filters?.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const queryString = params.toString();
    return apiClient.get<UserListResponse>(`/admin/users${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Get user statistics
   * GET /admin/users/stats
   */
  getUserStats: async (): Promise<UserStats> => {
    return apiClient.get<UserStats>('/admin/users/stats');
  },

  /**
   * Get user by ID
   * GET /admin/users/:id
   */
  getUserById: async (id: string): Promise<User> => {
    return apiClient.get<User>(`/admin/users/${id}`);
  },

  /**
   * Suspend user account
   * POST /admin/users/:id/suspend
   */
  suspendUser: async (id: string, reason?: string): Promise<{ message: string }> => {
    return apiClient.post<{ message: string }>(`/admin/users/${id}/suspend`, { reason });
  },

  /**
   * Activate user account
   * POST /admin/users/:id/activate
   */
  activateUser: async (id: string): Promise<{ message: string }> => {
    return apiClient.post<{ message: string }>(`/admin/users/${id}/activate`, {});
  },

  /**
   * Delete user account
   * DELETE /admin/users/:id
   */
  deleteUser: async (id: string): Promise<{ message: string }> => {
    return apiClient.delete<{ message: string }>(`/admin/users/${id}`);
  },

  /**
   * Warn a user
   * POST /admin/users/:id/warn
   */
  warnUser: async (
    id: string,
    severity: 'low' | 'medium' | 'high',
    reason: string,
    relatedContentId?: string,
    relatedContentType?: 'product' | 'service' | 'chat' | 'user',
  ): Promise<{ message: string; warning: any }> => {
    return apiClient.post<{ message: string; warning: any }>(`/admin/users/${id}/warn`, {
      severity,
      reason,
      relatedContentId,
      relatedContentType,
    });
  },

  /**
   * Get user's warning history
   * GET /admin/users/:id/warnings
   */
  getUserWarnings: async (id: string): Promise<any[]> => {
    return apiClient.get<any[]>(`/admin/users/${id}/warnings`);
  },
};

