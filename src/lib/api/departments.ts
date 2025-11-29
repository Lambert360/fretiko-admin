import { apiClient } from './client';

/**
 * Departments API
 * Handles department management
 */

export interface Department {
  id: string;
  name: string;
  slug: string;
  description?: string;
  permissions: string[];
  staffCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDepartmentRequest {
  name: string;
  slug: string;
  description?: string;
  permissions?: string[];
}

export interface UpdateDepartmentRequest {
  name?: string;
  description?: string;
  permissions?: string[];
  isActive?: boolean;
}

export const departmentsAPI = {
  /**
   * Get all departments
   * GET /departments
   */
  getAllDepartments: async (): Promise<Department[]> => {
    return apiClient.get<Department[]>('/departments');
  },

  /**
   * Get department by ID
   * GET /departments/:id
   */
  getDepartmentById: async (id: string): Promise<Department> => {
    return apiClient.get<Department>(`/departments/${id}`);
  },

  /**
   * Create new department
   * POST /departments
   */
  createDepartment: async (data: CreateDepartmentRequest): Promise<Department> => {
    return apiClient.post<Department>('/departments', data);
  },

  /**
   * Update department
   * PATCH /departments/:id
   */
  updateDepartment: async (id: string, data: UpdateDepartmentRequest): Promise<Department> => {
    return apiClient.patch<Department>(`/departments/${id}`, data);
  },
};
