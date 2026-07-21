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

export interface DailyStat {
  date: string;
  assignments: number;
  replacements: number;
  successRate: number;
}

export interface HourlyStat {
  hour: string;
  assignments: number;
  replacements: number;
}

export interface TopPerformer {
  riderId: string;
  riderName: string;
  assignments: number;
  successRate: number;
  averageTime: number;
  rating: number;
}

export interface StatusBreakdown {
  status: string;
  count: number;
  percentage: number;
}

export interface GeographyStat {
  region: string;
  count: number;
  percentage: number;
}

export interface RiderAnalytics {
  overview: {
    totalRiders: number;
    activeRiders: number;
    totalAssignments: number;
    successfulAssignments: number;
    replacementRate: number;
    averageAssignmentTime: number;
    averageDeliveryTime: number;
    onTimeDeliveryRate: number;
  };
  dailyStats: DailyStat[];
  hourlyStats: HourlyStat[];
  topPerformers: TopPerformer[];
  statusBreakdown: StatusBreakdown[];
  geography: GeographyStat[];
}

export interface PartnerApplication {
  id: string;
  trackingId: string;
  companyName: string;
  contactPersonName: string;
  contactEmail: string;
  contactPhone?: string;
  headquartersAddress: string;
  serviceAreas: string[];
  vehicleFleet: Record<string, { count: number; photos?: string[] }>;
  totalRiders?: number;
  averageDailyDeliveries?: number;
  yearsInOperation?: number;
  serviceCategories?: string[];
  registrationDocumentUrls?: string[];
  insuranceDocumentUrls?: string[];
  fleetDocumentUrls?: string[];
  status: 'in_progress' | 'under_review' | 'verified' | 'rejected';
  rejectionReason?: string;
  adminNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VerifiedPartner {
  id: string;
  applicationId: string;
  companyName: string;
  contactEmail: string;
  contactPhone?: string;
  headquartersAddress: string;
  serviceAreas: string[];
  partnerStatus: 'active' | 'suspended' | 'terminated';
  totalRiders: number;
  activeRiders: number;
  totalDeliveries: number;
  completedDeliveries: number;
  averageDeliveryTime?: number;
  onTimeDeliveryRate?: number;
  totalRevenue: number;
  platformCommission: number;
  verifiedBy?: string;
  verifiedAt: string;
  verificationNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RiderVerification {
  id: string;
  userId: string;
  fullName: string;
  country: string;
  state: string;
  city?: string;
  vehicleType: string;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleYear?: number;
  licensePlate?: string;
  companyId?: string;
  companyName?: string;
  driverLicenseUrl?: string;
  vehicleRegistrationUrl?: string;
  insuranceDocumentUrl?: string;
  profilePhotoUrl?: string;
  yearsExperience?: number;
  previousDeliveryCompanies?: string[];
  status: 'in_progress' | 'under_review' | 'verified' | 'rejected';
  rejectionReason?: string;
  adminNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VerifiedRider {
  id: string;
  userId: string;
  verificationRequestId: string;
  fullName: string;
  vehicleType: string;
  companyId?: string;
  verificationStatus: 'active' | 'suspended' | 'terminated';
  totalDeliveries: number;
  completedDeliveries: number;
  averageDeliveryTime?: number;
  customerRating?: number;
  onTimeRate?: number;
  verifiedBy?: string;
  verifiedAt: string;
  verificationNotes?: string;
  createdAt: string;
  updatedAt: string;
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

export interface PartnerApplicationListResponse {
  applications: PartnerApplication[];
  total: number;
  page: number;
  limit: number;
}

export interface PartnerApplicationResponse {
  success?: boolean;
  message?: string;
  data?: PartnerApplicationListResponse;
}

export interface VerifiedRiderListResponse {
  riders: VerifiedRider[];
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

export interface ApplicationFilters {
  status?: 'in_progress' | 'under_review' | 'verified' | 'rejected' | 'all';
  type?: 'company' | 'rider' | 'all';
  search?: string;
  page?: number;
  limit?: number;
}

export interface PartnerFilters {
  status?: 'active' | 'suspended' | 'terminated' | 'all';
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
   * Get rider analytics for a time range
   * GET /admin/logistics/analytics?timeRange=24h|7d|30d
   */
  getLogisticsAnalytics: async (timeRange: '24h' | '7d' | '30d' = '24h'): Promise<RiderAnalytics> => {
    return apiClient.get<RiderAnalytics>(`/admin/logistics/analytics?timeRange=${timeRange}`);
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

  getPartnerApplications: async (filters?: ApplicationFilters): Promise<PartnerApplicationResponse | PartnerApplicationListResponse> => {
    const params = new URLSearchParams();
    if (filters?.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters?.type && filters.type !== 'all') params.append('type', filters.type);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    return apiClient.get(`/logistics-partners/applications${params.toString() ? `?${params.toString()}` : ''}`);
  },

  verifyPartnerApplication: async (applicationId: string, notes?: string): Promise<void> => {
    await apiClient.post(`/logistics-partners/applications/${applicationId}/verify`, { notes });
  },

  rejectPartnerApplication: async (applicationId: string, reason: string, notes?: string): Promise<void> => {
    await apiClient.post(`/logistics-partners/applications/${applicationId}/reject`, { reason, notes });
  },

  getVerifiedRiders: async (filters?: PartnerFilters): Promise<VerifiedRiderListResponse> => {
    const params = new URLSearchParams();
    if (filters?.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    return apiClient.get<VerifiedRiderListResponse>(`/admin/logistics/verified-riders${params.toString() ? `?${params.toString()}` : ''}`);
  },

  verifyRiderApplication: async (verificationId: string, notes?: string): Promise<void> => {
    await apiClient.post(`/admin/logistics/rider-verifications/${verificationId}/verify`, { notes });
  },

  rejectRiderApplication: async (verificationId: string, reason: string, notes?: string): Promise<void> => {
    await apiClient.post(`/admin/logistics/rider-verifications/${verificationId}/reject`, { reason, notes });
  },

  getPartnerMetrics: async (partnerId: string): Promise<any> => {
    return apiClient.get(`/admin/logistics/partners/${partnerId}/metrics`);
  },
};
