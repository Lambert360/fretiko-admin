import { apiClient } from './client';
import type { Staff, LoginRequest, LoginResponse, ChangePasswordRequest, StaffRole } from '@/types/staff';

export interface CreateStaffRequest {
  email: string;
  password: string;
  fullName: string;
  departmentId?: string;
  role: StaffRole;
}

export const staffAPI = {
  /**
   * Staff login
   */
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    return apiClient.post<LoginResponse>('/staff/login', data);
  },

  /**
   * Get current staff profile
   */
  getMe: async (): Promise<Staff> => {
    return apiClient.get<Staff>('/staff/me');
  },

  /**
   * Update own profile
   */
  updateProfile: async (data: { fullName?: string; email?: string }): Promise<Staff> => {
    return apiClient.patch<Staff>('/staff/me', data);
  },

  /**
   * Change own password
   */
  changePassword: async (data: ChangePasswordRequest): Promise<{ message: string }> => {
    return apiClient.patch<{ message: string }>('/staff/me/password', data);
  },

  /**
   * Get all staff
   */
  getAllStaff: async (): Promise<Staff[]> => {
    return apiClient.get<Staff[]>('/staff');
  },

  /**
   * Get staff by ID
   */
  getStaffById: async (id: string): Promise<Staff> => {
    return apiClient.get<Staff>(`/staff/${id}`);
  },

  /**
   * Create new staff
   */
  createStaff: async (data: CreateStaffRequest): Promise<Staff> => {
    return apiClient.post<Staff>('/staff', data);
  },

  /**
   * Suspend staff account
   */
  suspendStaff: async (id: string, reason?: string): Promise<{ message: string }> => {
    return apiClient.post<{ message: string }>(`/staff/${id}/suspend`, { reason });
  },

  /**
   * Unsuspend staff account
   */
  unsuspendStaff: async (id: string): Promise<{ message: string }> => {
    return apiClient.post<{ message: string }>(`/staff/${id}/unsuspend`, {});
  },

  /**
   * Delete staff account (permanent removal)
   */
  deleteStaff: async (id: string, reason?: string): Promise<{ message: string }> => {
    return apiClient.delete<{ message: string }>(`/staff/${id}`, { data: { reason } });
  },

  /**
   * Upload profile picture
   * POST /staff/me/avatar
   */
  uploadAvatar: async (file: File): Promise<Staff> => {
    const formData = new FormData();
    formData.append('avatar', file);
    
    // Axios will automatically set Content-Type with boundary for FormData
    return apiClient.post<Staff>('/staff/me/avatar', formData);
  },
};
