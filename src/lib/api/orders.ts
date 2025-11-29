import { apiClient } from './client';

/**
 * Orders API
 * Handles order management for staff
 */

export interface Order {
  id: string;
  orderNumber: string;
  customer: string;
  customerEmail: string;
  vendor: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  type: 'product' | 'service';
  createdAt: string;
}

export interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  processingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
}

export interface OrderListResponse {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
}

export interface OrderFilters {
  status?: 'pending' | 'processing' | 'completed' | 'cancelled' | 'all';
  search?: string;
  page?: number;
  limit?: number;
}

export const ordersAPI = {
  /**
   * Get order statistics
   * GET /admin/orders/stats
   */
  getStats: async (): Promise<OrderStats> => {
    return apiClient.get<OrderStats>('/admin/orders/stats');
  },

  /**
   * Get all orders
   * GET /admin/orders
   */
  getOrders: async (filters?: OrderFilters): Promise<OrderListResponse> => {
    const params = new URLSearchParams();
    if (filters?.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    return apiClient.get<OrderListResponse>(`/admin/orders${params.toString() ? `?${params.toString()}` : ''}`);
  },

  /**
   * Get order by ID
   * GET /admin/orders/:id
   */
  getOrderById: async (orderId: string): Promise<Order> => {
    return apiClient.get<Order>(`/admin/orders/${orderId}`);
  },

  /**
   * Update order status
   * PATCH /admin/orders/:id/status
   */
  updateOrderStatus: async (
    orderId: string,
    status: 'pending' | 'processing' | 'completed' | 'cancelled',
  ): Promise<{ message: string }> => {
    return apiClient.patch<{ message: string }>(`/admin/orders/${orderId}/status`, { status });
  },

  /**
   * Cancel order
   * POST /admin/orders/:id/cancel
   */
  cancelOrder: async (orderId: string, reason?: string): Promise<{ message: string }> => {
    return apiClient.post<{ message: string }>(`/admin/orders/${orderId}/cancel`, { reason });
  },
};
