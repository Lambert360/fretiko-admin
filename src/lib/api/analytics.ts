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

export interface AuctionAnalyticsSummary {
  totalAuctions: number;
  soldAuctions: number;
  sellThroughRate: number;
  totalAuctionRevenue: number;
  averageBidsPerAuction: number;
  averageUniqueBiddersPerAuction: number;
  topCategories: Array<{
    categoryId: string;
    categoryName: string;
    totalRevenue: number;
    totalBids: number;
  }>;
  topAuctions: Array<{
    auctionId: string;
    title: string;
    categoryName: string;
    revenue: number;
    totalBids: number;
    uniqueBidders: number;
    status: string;
  }>;
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

  /**
   * Get auction analytics summary
   * GET /admin/analytics/auctions/summary
   */
  getAuctionAnalyticsSummary: async (start?: string, end?: string): Promise<AuctionAnalyticsSummary> => {
    const params = new URLSearchParams();
    if (start) params.append('start', start);
    if (end) params.append('end', end);

    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get<AuctionAnalyticsSummary>(`/admin/analytics/auctions/summary${query}`);
  },
};
