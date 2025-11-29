import { apiClient } from './client';

/**
 * Dashboard API
 * Handles dashboard overview data
 */

export interface DashboardStats {
  totalUsers: number;
  totalOrders: number;
  activeDisputes: number;
  revenue: number;
  userChange: number;
  orderChange: number;
  disputeChange: number;
  revenueChange: number;
}

export interface RecentActivity {
  id: string;
  action: string;
  time: string;
  type: 'user' | 'order' | 'dispute' | 'content';
}

export interface DashboardOverview {
  stats: DashboardStats;
  recentActivities: RecentActivity[];
}

export const dashboardAPI = {
  /**
   * Get dashboard overview
   * GET /admin/dashboard/overview
   */
  getOverview: async (): Promise<DashboardOverview> => {
    return apiClient.get<DashboardOverview>('/admin/dashboard/overview');
  },
};

