import { apiClient } from './client';

/**
 * Analytics API
 * Handles platform-wide analytics and insights
 */

export interface PlatformStats {
  totalUsers: number;
  vendors: number;
  riders: number;
  totalOrders: number;
  completionRate: number;
  totalRevenue: number;
  activeDisputes: number;
}

export interface AnalyticsData {
  period: 'daily' | 'weekly' | 'monthly';
  date: string;
  metrics: {
    orders: number;
    revenue: number;
    users: number;
    vendors: number;
  };
  trends: {
    ordersGrowth: number;
    revenueGrowth: number;
    usersGrowth: number;
  };
}

export interface AnalyticsSummary {
  totalOrders: number;
  totalRevenue: number;
  totalUsers: number;
  averageOrderValue: number;
  topCategories: Array<{
    category: string;
    orderCount: number;
    revenue: number;
  }>;
  topVendors: Array<{
    vendorId: string;
    vendorName: string;
    orderCount: number;
    revenue: number;
  }>;
}

export interface TimeSeriesData {
  date: string;
  orders: number;
  revenue: number;
  users: number;
  [key: string]: string | number;
}

export const analyticsAPI = {
  /**
   * Get platform statistics
   * GET /admin/analytics/stats
   */
  getPlatformStats: async (): Promise<PlatformStats> => {
    return apiClient.get<PlatformStats>('/admin/analytics/stats');
  },

  /**
   * Get analytics data for a period
   * GET /admin/analytics?period=daily&date=2024-01-01
   */
  getAnalytics: async (period: 'daily' | 'weekly' | 'monthly' = 'daily', date?: string): Promise<AnalyticsData> => {
    const params = new URLSearchParams();
    params.append('period', period);
    if (date) params.append('date', date);

    return apiClient.get<AnalyticsData>(`/admin/analytics${params.toString() ? `?${params.toString()}` : ''}`);
  },

  /**
   * Get analytics summary
   * GET /admin/analytics/summary
   */
  getAnalyticsSummary: async (): Promise<AnalyticsSummary> => {
    return apiClient.get<AnalyticsSummary>('/admin/analytics/summary');
  },

  /**
   * Get time series data
   * GET /admin/analytics/timeseries?start=2024-01-01&end=2024-01-31&period=daily
   */
  getTimeSeries: async (
    start: string,
    end: string,
    period: 'daily' | 'weekly' | 'monthly' = 'daily',
    timezoneOffset?: number,
  ): Promise<TimeSeriesData[]> => {
    const params = new URLSearchParams();
    params.append('start', start);
    params.append('end', end);
    params.append('period', period);
    if (timezoneOffset !== undefined) {
      params.append('timezoneOffset', timezoneOffset.toString());
    }

    return apiClient.get<TimeSeriesData[]>(`/admin/analytics/timeseries${params.toString() ? `?${params.toString()}` : ''}`);
  },
};
