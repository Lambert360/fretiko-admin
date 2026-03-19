import { apiClient } from './client';

/**
 * Monitoring API
 * Handles system health monitoring and background task management
 */

export interface HealthMetrics {
  uptime: number;
  memory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
  lastRateUpdate?: {
    timestamp: string;
    successful: number;
    failed: number;
    total: number;
    duration: number;
  };
  lastReconciliation?: {
    timestamp: string;
    result: any;
    duration: number;
  };
  providerHealth: Record<string, {
    healthy: boolean;
    responseTime: number | null;
    error: string | null;
    lastChecked: string;
  }>;
  recentAlerts: Array<{
    type: string;
    data: any;
    timestamp: string;
  }>;
  successfulUpdates: number;
  failedUpdates: number;
}

export interface CachedAnalytics {
  timestamp: string;
  period: string;
  startDate: string;
  endDate: string;
  generated: string;
  data: any;
}

export interface Alert {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  data: any;
  timestamp: string;
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
}

export const monitoringAPI = {
  /**
   * Get system health metrics
   * GET /admin/monitoring/health
   */
  getHealthMetrics: async (): Promise<HealthMetrics> => {
    return apiClient.get<HealthMetrics>('/admin/monitoring/health');
  },

  /**
   * Get cached analytics reports
   * GET /admin/monitoring/analytics/:type
   */
  getCachedAnalytics: async (type: 'weekly' | 'daily' | 'hourly'): Promise<CachedAnalytics | null> => {
    return apiClient.get<CachedAnalytics>(`/admin/monitoring/analytics/${type}`);
  },

  /**
   * Manual trigger for exchange rate update
   * POST /admin/monitoring/update-rates
   */
  manualRateUpdate: async (): Promise<{ success: boolean; message: string }> => {
    return apiClient.post<{ success: boolean; message: string }>('/admin/monitoring/update-rates');
  },

  /**
   * Manual trigger for wallet reconciliation
   * POST /admin/monitoring/reconcile
   */
  manualReconciliation: async (): Promise<{ success: boolean; message: string; result?: any }> => {
    return apiClient.post<{ success: boolean; message: string; result?: any }>('/admin/monitoring/reconcile');
  },

  /**
   * Get recent alerts
   * GET /admin/monitoring/alerts?limit=50
   */
  getAlerts: async (limit: number = 50): Promise<Alert[]> => {
    return apiClient.get<Alert[]>(`/admin/monitoring/alerts?limit=${limit}`);
  },

  /**
   * Dismiss alert
   * POST /admin/monitoring/alerts/:id/dismiss
   */
  dismissAlert: async (alertId: string): Promise<{ success: boolean; message: string }> => {
    return apiClient.post<{ success: boolean; message: string }>(`/admin/monitoring/alerts/${alertId}/dismiss`);
  },

  /**
   * Resolve alert
   * POST /admin/monitoring/alerts/:id/resolve
   */
  resolveAlert: async (alertId: string, notes?: string): Promise<{ success: boolean; message: string }> => {
    return apiClient.post<{ success: boolean; message: string }>(`/admin/monitoring/alerts/${alertId}/resolve`, { notes });
  },
};
