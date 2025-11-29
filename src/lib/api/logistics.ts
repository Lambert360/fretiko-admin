import { apiClient } from './client';

/**
 * Logistics API
 * Handles rider and delivery management
 */

export interface Rider {
  id: string;
  username: string;
  email: string;
  fullName?: string;
  phone?: string;
  isActive: boolean;
  rating?: number;
  totalDeliveries: number;
  completedDeliveries: number;
  onTimeDeliveries: number;
  averageDeliveryTime?: number;
  createdAt: string;
  avatarUrl?: string;
}

export interface Delivery {
  id: string;
  orderId: string;
  orderNumber: string;
  riderId?: string;
  riderName?: string;
  deliveryType?: 'pickup' | 'delivery';
  status: 'pending' | 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled';
  pickupAddress: string;
  deliveryAddress: string;
  estimatedDeliveryTime?: string;
  actualDeliveryTime?: string;
  createdAt: string;
  updatedAt: string;
  customerName: string;
  customerPhone?: string;
  amount: number;
}

export interface LogisticsStats {
  totalRiders: number;
  activeRiders: number;
  totalDeliveries: number;
  pendingDeliveries: number;
  inTransitDeliveries: number;
  completedDeliveries: number;
  averageDeliveryTime: number;
  onTimeDeliveryRate: number;
}

export interface RiderListResponse {
  riders: Rider[];
  total: number;
  page: number;
  limit: number;
}

export interface DeliveryListResponse {
  deliveries: Delivery[];
  total: number;
  page: number;
  limit: number;
}

export interface LogisticsFilters {
  status?: 'active' | 'inactive' | 'all';
  search?: string;
  page?: number;
  limit?: number;
}

export interface DeliveryFilters {
  status?: 'pending' | 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled' | 'all';
  riderId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const logisticsAPI = {
  /**
   * Get all riders with filters
   * GET /admin/logistics/riders
   */
  getRiders: async (filters?: LogisticsFilters): Promise<RiderListResponse> => {
    const params = new URLSearchParams();
    if (filters?.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    return apiClient.get<RiderListResponse>(`/admin/logistics/riders${params.toString() ? `?${params.toString()}` : ''}`);
  },

  /**
   * Get rider by ID
   * GET /admin/logistics/riders/:id
   */
  getRiderById: async (riderId: string): Promise<Rider> => {
    return apiClient.get<Rider>(`/admin/logistics/riders/${riderId}`);
  },

  /**
   * Get all deliveries with filters
   * GET /admin/logistics/deliveries
   */
  getDeliveries: async (filters?: DeliveryFilters): Promise<DeliveryListResponse> => {
    const params = new URLSearchParams();
    if (filters?.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters?.riderId) params.append('riderId', filters.riderId);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    return apiClient.get<DeliveryListResponse>(`/admin/logistics/deliveries${params.toString() ? `?${params.toString()}` : ''}`);
  },

  /**
   * Get logistics statistics
   * GET /admin/logistics/stats
   */
  getLogisticsStats: async (): Promise<LogisticsStats> => {
    return apiClient.get<LogisticsStats>('/admin/logistics/stats');
  },

  /**
   * Assign rider to delivery
   * POST /admin/logistics/deliveries/:id/assign
   */
  assignRider: async (deliveryId: string, riderId: string): Promise<void> => {
    await apiClient.post(`/admin/logistics/deliveries/${deliveryId}/assign`, { riderId });
  },

  /**
   * Update delivery status
   * PATCH /admin/logistics/deliveries/:id/status
   */
  updateDeliveryStatus: async (deliveryId: string, status: Delivery['status']): Promise<void> => {
    await apiClient.patch(`/admin/logistics/deliveries/${deliveryId}/status`, { status });
  },
};

