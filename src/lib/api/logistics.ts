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

  /**
   * List verified partner companies (admin moderation)
   * GET /logistics-partners/verified
   */
  getPartners: async (filters?: PartnerFilters): Promise<{ partners: PartnerRow[]; total: number; page: number; limit: number }> => {
    const params = new URLSearchParams();
    if (filters?.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const res: any = await apiClient.get(`/logistics-partners/verified${params.toString() ? `?${params.toString()}` : ''}`);
    return res.data || { partners: [], total: 0, page: 1, limit: 20 };
  },

  /**
   * Change partner status — suspend / reactivate / terminate
   * PATCH /logistics-partners/verified/:id/status
   */
  updatePartnerStatus: async (partnerId: string, status: 'active' | 'suspended' | 'terminated', reason?: string): Promise<any> => {
    return apiClient.patch(`/logistics-partners/verified/${partnerId}/status`, { status, reason });
  },

  /**
   * Warn a partner — notification + email + audit event
   * POST /logistics-partners/verified/:id/warn
   */
  warnPartner: async (partnerId: string, message: string): Promise<any> => {
    return apiClient.post(`/logistics-partners/verified/${partnerId}/warn`, { message });
  },

  /**
   * Add/remove territory bans
   * PATCH /logistics-partners/verified/:id/banned-areas
   */
  setPartnerBannedAreas: async (partnerId: string, payload: { add?: string[]; remove?: string[]; reason?: string }): Promise<any> => {
    return apiClient.patch(`/logistics-partners/verified/${partnerId}/banned-areas`, payload);
  },

  /**
   * Broadcast a message to all partners (or specific ids)
   * POST /logistics-partners/broadcast
   */
  broadcastToPartners: async (payload: { title: string; message: string; partnerIds?: string[] }): Promise<any> => {
    return apiClient.post('/logistics-partners/broadcast', payload);
  },

  /**
   * Review a partner's service-area expansion request
   * POST /logistics-partners/verified/:id/area-expansion
   */
  reviewAreaExpansion: async (partnerId: string, payload: { approve?: string[]; reject?: string[]; reason?: string }): Promise<any> => {
    return apiClient.post(`/logistics-partners/verified/${partnerId}/area-expansion`, payload);
  },

  /**
   * Moderation history for one partner
   * GET /logistics-partners/verified/:id/moderation-history
   */
  getPartnerModerationHistory: async (partnerId: string): Promise<ModerationEvent[]> => {
    const res: any = await apiClient.get(`/logistics-partners/verified/${partnerId}/moderation-history`);
    return res.data || [];
  },

  /**
   * Partner wallet withdrawals (monitoring)
   * GET /logistics-partners/withdrawals
   */
  getPartnerWithdrawals: async (filters?: { status?: string; search?: string; page?: number; limit?: number }): Promise<{ withdrawals: PartnerWithdrawalRow[]; total: number; page: number; limit: number }> => {
    const params = new URLSearchParams();
    if (filters?.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const res: any = await apiClient.get(`/logistics-partners/withdrawals${params.toString() ? `?${params.toString()}` : ''}`);
    return res.data || { withdrawals: [], total: 0, page: 1, limit: 20 };
  },

  /**
   * Partners using the Partner API (keys / webhooks) with health signals
   * GET /logistics-partners/integrations
   */
  getIntegrations: async (): Promise<PartnerIntegrationRow[]> => {
    const res: any = await apiClient.get('/logistics-partners/integrations');
    return res.data || [];
  },

  /**
   * Kill switch: disable/enable a partner's API keys and webhooks
   * PATCH /logistics-partners/verified/:id/integration
   */
  setIntegrationEnabled: async (partnerId: string, enabled: boolean, reason?: string): Promise<any> => {
    return apiClient.patch(`/logistics-partners/verified/${partnerId}/integration`, { enabled, reason });
  },

  /**
   * Clear a delivery-PIN lockout on an order
   * POST /logistics-partners/orders/:orderId/unlock-pin
   */
  unlockDeliveryPin: async (orderId: string): Promise<any> => {
    return apiClient.post(`/logistics-partners/orders/${orderId}/unlock-pin`);
  },

  /**
   * External carrier (AAJ, GIGL…) API health — per-adapter up/degraded/down
   * GET /admin/carrier-adapters/health
   */
  getCarrierAdapterHealth: async (): Promise<CarrierAdapterHealthRow[]> => {
    const res: any = await apiClient.get('/admin/carrier-adapters/health');
    return res.health || [];
  },

  /**
   * In-flight/failed carrier shipments for ops reconciliation
   * GET /admin/carrier-adapters/shipments
   */
  getCarrierShipments: async (filters?: { partnerId?: string; status?: string }): Promise<CarrierShipmentRow[]> => {
    const params = new URLSearchParams();
    if (filters?.partnerId) params.append('partnerId', filters.partnerId);
    if (filters?.status) params.append('status', filters.status);
    const res: any = await apiClient.get(`/admin/carrier-adapters/shipments${params.toString() ? `?${params.toString()}` : ''}`);
    return res.shipments || [];
  },
};

export interface CarrierAdapterHealthRow {
  partner_id: string;
  adapter_key: string;
  company_name?: string | null;
  status: 'up' | 'degraded' | 'down';
  consecutive_failures: number;
  last_success_at: string | null;
  last_failure_at: string | null;
  last_error: string | null;
  last_latency_ms: number | null;
  last_operation: 'quote' | 'book' | 'track' | 'cancel' | null;
  updated_at: string;
}

export interface CarrierShipmentRow {
  id: string;
  order_id: string;
  partner_id: string;
  adapter_key: string;
  carrier_booking_id: string | null;
  tracking_ref: string | null;
  status: string;
  status_description: string | null;
  quote_cost_freti: number | null;
  buyer_price_freti: number | null;
  booking_attempts: number;
  last_booking_error: string | null;
  last_polled_at: string | null;
  booked_at: string | null;
  delivered_at: string | null;
  created_at: string;
}

export interface PartnerIntegrationRow {
  partnerId: string;
  companyName: string;
  contactEmail?: string | null;
  partnerStatus: 'active' | 'suspended' | 'terminated';
  integrationEnabled: boolean;
  managedGroups: string[];
  activeKeys: number;
  liveKeys: number;
  webhookEndpoints: number;
  lastApiUseAt: string | null;
  failedEvents7d: number;
  pendingEvents: number;
}

/** Raw verified_logistics_partners row (snake_case from backend) */
export interface PartnerRow {
  id: string;
  company_name: string;
  partner_username?: string;
  contact_email?: string;
  contact_phone?: string;
  company_logo_url?: string;
  service_areas?: string[];
  banned_service_areas?: string[];
  pending_service_areas?: string[];
  partner_status: 'active' | 'suspended' | 'terminated';
  total_riders?: number;
  total_deliveries?: number;
  total_revenue?: number;
  verified_at?: string;
  created_at?: string;
}

export interface ModerationEvent {
  id: string;
  partner_id: string;
  action: 'warn' | 'suspend' | 'reactivate' | 'terminate' | 'ban_area' | 'unban_area' | 'broadcast'
        | 'area_request' | 'area_approved' | 'area_rejected';
  reason?: string;
  areas: string[];
  performed_by?: string;
  created_at: string;
}

export interface PartnerWithdrawalRow {
  id: string;
  partnerId: string;
  companyName: string;
  contactEmail?: string | null;
  amount: number;
  currency: string;
  localAmount: number | null;
  exchangeRate: number | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  reference?: string;
  externalTransferId?: string | null;
  failureReason?: string | null;
  requestedAt: string;
  processedAt?: string | null;
  bankAccount?: { accountName: string; bankName: string; accountNumber: string } | null;
}
