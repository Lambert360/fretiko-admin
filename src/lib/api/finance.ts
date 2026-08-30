import { apiClient } from './client';

/**
 * Finance API
 * Handles revenue tracking and financial analytics
 */

// ✅ NEW: Enhanced Analytics Interfaces

export interface RegionalRevenueResponse {
  period: string;
  startDate: string;
  endDate: string;
  regions: Array<{
    country: string;
    region: string;
    volume: number;
    users: number;
    transactions: number;
    growth: number;
  }>;
  totalVolume: number;
  totalUsers: number;
}

export interface ProviderPerformanceResponse {
  period: string;
  startDate: string;
  endDate: string;
  providers: Array<{
    name: string;
    totalTransactions: number;
    successfulTransactions: number;
    failedTransactions: number;
    totalVolume: number;
    successRate: number;
    avgResponseTime: number;
  }>;
  summary: {
    totalTransactions: number;
    totalVolume: number;
    avgSuccessRate: number;
  };
}

export interface TransactionPatternsResponse {
  period: string;
  startDate: string;
  endDate: string;
  peakHours: number[];
  avgDeposit: number;
  monthlyGrowth: number;
  hourlyDistribution: number[];
  dailyDistribution: number[];
  transactionTypes: Record<string, number>;
  preferredCurrency: string;
  summary: {
    totalTransactions: number;
    totalVolume: number;
    avgTransactionSize: number;
  };
}

export interface EnhancedRevenueSummary {
  period: string;
  startDate: string;
  endDate: string;
  revenue: {
    totalDeposits: number;
    totalWithdrawals: number;
    netRevenue: number;
    fees: number;
    netFees: number;
  };
  transactions: {
    totalDeposits: number;
    totalWithdrawals: number;
    successRate: number;
  };
  growth: {
    monthlyGrowth: number;
    userGrowth: number;
    transactionGrowth: number;
  };
  users: {
    activeUsers: number;
    newUsers: number;
    retentionRate: number;
  };
}

export interface RevenueStats {
  totalPlatformFees: number;
  realizedRevenue: number;
  pendingRevenue: number;
  lostRevenue: number;
  revenueBySource: {
    regular: number;
    live_stream: number;
    auction: number;
    service_booking: number;
    invoice: number;
    wishlist: number;
    logistics: number;
    gifts: number; // Platform revenue from gift conversions
  };
  topVendors: Array<{
    vendorId: string;
    vendorName: string;
    totalFees: number;
    orderCount: number;
  }>;
}

export interface EscrowHealth {
  totalInEscrow: number;
  overdueEscrows: number;
  disputeRate: number;
  averageHoldTime: number;
  escrowsByStatus: {
    held: number;
    released: number;
    refunded: number;
    disputed: number;
  };
}

export interface Payout {
  id: string;
  user_id: string;
  freti_amount: number;
  estimated_local_amount?: number;
  local_currency: string;
  status: 'requested' | 'pending' | 'processing' | 'completed' | 'paid' | 'failed';
  external_payout_id?: string;
  requested_at: string;
  processed_at?: string;
  paid_at?: string;
  failure_reason?: string;
  retry_count: number;
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    username: string;
    email: string;
  };
}

export interface PayoutListResponse {
  payouts: Payout[];
  total: number;
  page: number;
  limit: number;
}

export interface FinanceFilters {
  startDate?: string;
  endDate?: string;
  status?: 'pending' | 'processing' | 'completed' | 'failed' | 'all';
  page?: number;
  limit?: number;
}

export interface Deposit {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  localAmount: number;
  localCurrency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  paymentMethod: string;
  initiatedAt: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DepositListResponse {
  deposits: Deposit[];
  total: number;
  page: number;
  limit: number;
}

export interface TotalPlatformFunds {
  totalFunds: number;
  totalAvailable: number;
  totalEscrow: number;
  totalPendingWithdrawal: number;
  totalDeposited: number;
  totalDepositsCount: number;
}

export interface UserBalance {
  userId: string;
  userName: string;
  username: string;
  availableBalance: number;
  escrowBalance: number;
  pendingWithdrawal: number;
  totalBalance: number;
  walletId: string;
}

export interface UserBalanceListResponse {
  balances: UserBalance[];
  total: number;
  page: number;
  limit: number;
}

export interface PlatformWallet {
  wallet: {
    id: string;
    userId: string;
    availableBalance: number;
    escrowBalance: number;
    pendingWithdrawal: number;
    preferredCurrency: string;
    kycStatus: 'pending' | 'approved' | 'rejected';
    dailyDepositLimit: number;
    dailyWithdrawalLimit: number;
    createdAt: string;
    updatedAt: string;
    pendingVendorEarnings?: number;
    pendingRiderEarnings?: number;
    totalPendingEarnings?: number;
    totalVendorSales?: number;
    totalRiderEarnings?: number;
    lifetimeRevenue?: number;
  };
  platformUserId: string;
}

export interface BankAccount {
  id: string;
  userId: string;
  accountName: string;
  bankName: string;
  bankCode?: string;
  accountNumber: string;
  accountType: 'savings' | 'checking' | 'current';
  currency: string;
  country?: string;
  isVerified: boolean;
  verificationMethod?: string;
  verifiedAt?: string;
  isDefault: boolean;
  swiftCode?: string;
  iban?: string;
  routingNumber?: string;
  branchName?: string;
  branchCode?: string;
  isActive: boolean;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBankAccountDto {
  accountName: string;
  bankName: string;
  bankCode?: string;
  accountNumber: string;
  accountType?: 'savings' | 'checking' | 'current';
  currency?: string;
  country?: string;
  swiftCode?: string;
  iban?: string;
  routingNumber?: string;
  branchName?: string;
  branchCode?: string;
  isDefault?: boolean;
}

export interface UpdateBankAccountDto {
  accountName?: string;
  bankName?: string;
  bankCode?: string;
  accountType?: 'savings' | 'checking' | 'current';
  branchName?: string;
  branchCode?: string;
  isDefault?: boolean;
}

export interface Bank {
  id: number | string;
  code: string;
  name: string;
}

export interface AccountPreview {
  accountName: string;
  accountNumber: string;
  bankCode: string;
}

export interface WithdrawRequestDto {
  fretiAmount: number;
  bankAccountId: string;
  localCurrency?: string;
  idempotencyKey?: string;
}

export interface PayoutRequestResponse {
  id: string;
  userId: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  requestedAt: string;
  processedAt?: string;
  bankAccountId: string;
  paymentMethod: string;
}

export interface PlatformWithdrawal {
  id: string;
  freti_amount: number;
  estimated_local_amount?: number;
  local_currency: string;
  status: 'requested' | 'pending' | 'processing' | 'completed' | 'paid' | 'failed';
  external_payout_id?: string;
  requested_at: string;
  processed_at?: string;
  paid_at?: string;
  failure_reason?: string;
  retry_count: number;
  created_at: string;
  bank_account_id: string;
  bankAccount?: {
    accountName: string;
    bankName: string;
    accountNumber: string;
    currency: string;
  } | null;
}

export interface PaginatedPlatformWithdrawals {
  data: PlatformWithdrawal[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface GiftStats {
  totalGiftValue: number;
  totalGiftsInCirculation: number;
  totalUsersWithGifts: number;
  platformGiftWalletBalance: number;
  topGifts: Array<{
    gift_id: string;
    gift_name: string;
    emoji: string;
    total_quantity: number;
    total_value: number;
  }>;
}

export interface UserGiftHolding {
  user_id: string;
  total_gifts: number;
  total_value: number;
  gift_breakdown: Array<{
    gift_id: string;
    gift_name: string;
    emoji: string;
    quantity: number;
    value: number;
  }>;
}

export interface UserGiftHoldingsResponse {
  users: UserGiftHolding[];
  total: number;
  page: number;
  limit: number;
}

export interface VirtualGift {
  id: string;
  name: string;
  emoji: string;
  credit_value: number;
  is_active: boolean;
  sort_order: number;
  display_lottie_url?: string;
  lottie_config?: any;
  sound_id?: string;
  sound_url?: string;
  animation_type?: 'lottie_single' | 'lottie_combo' | 'lottie_overlap';
  created_at: string;
  updated_at: string;
}

export interface CreateGiftDto {
  name: string;
  emoji: string;
  credit_value: number;
  sort_order?: number;
  is_active?: boolean;
  display_lottie_url?: string;
  lottie_config?: any;
  sound_id?: string;
  animation_type?: 'lottie_single' | 'lottie_combo' | 'lottie_overlap';
}

export interface UpdateGiftDto {
  name?: string;
  emoji?: string;
  credit_value?: number;
  sort_order?: number;
  is_active?: boolean;
  display_lottie_url?: string;
  lottie_config?: any;
  sound_id?: string;
  animation_type?: 'lottie_single' | 'lottie_combo' | 'lottie_overlap';
}

export interface Sound {
  id: string;
  name: string;
  sound_url: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CreateSoundDto {
  name: string;
  sound_url: string;
  sort_order?: number;
  is_active?: boolean;
}

export interface UpdateSoundDto {
  name?: string;
  sound_url?: string;
  sort_order?: number;
  is_active?: boolean;
}

export const financeAPI = {
  /**
   * Get platform revenue analytics
   * GET /admin/finance/revenue
   */
  getRevenue: async (startDate?: string, endDate?: string): Promise<RevenueStats> => {
    const params = new URLSearchParams();
    if (startDate) params.append('start', startDate);
    if (endDate) params.append('end', endDate);

    return apiClient.get<RevenueStats>(`/admin/finance/revenue${params.toString() ? `?${params.toString()}` : ''}`);
  },

  /**
   * Get escrow health metrics
   * GET /admin/finance/escrow-health
   */
  getEscrowHealth: async (): Promise<EscrowHealth> => {
    return apiClient.get<EscrowHealth>('/admin/finance/escrow-health');
  },

  /**
   * Get payouts
   * GET /admin/finance/payouts
   */
  getPayouts: async (filters?: FinanceFilters): Promise<PayoutListResponse> => {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    return apiClient.get<PayoutListResponse>(`/admin/finance/payouts${params.toString() ? `?${params.toString()}` : ''}`);
  },

  /**
   * Process payout
   * POST /admin/finance/payouts/:id/process
   */
  processPayout: async (payoutId: string): Promise<void> => {
    await apiClient.post(`/admin/finance/payouts/${payoutId}/process`);
  },

  /**
   * Get total platform funds
   * GET /admin/finance/total-funds
   */
  getTotalFunds: async (): Promise<TotalPlatformFunds> => {
    return apiClient.get<TotalPlatformFunds>('/admin/finance/total-funds');
  },

  /**
   * Get deposits and transactions
   * GET /admin/finance/deposits
   */
  getDeposits: async (filters?: {
    paymentMethod?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<DepositListResponse> => {
    const params = new URLSearchParams();
    if (filters?.paymentMethod) params.append('paymentMethod', filters.paymentMethod);
    if (filters?.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    return apiClient.get<DepositListResponse>(`/admin/finance/deposits${params.toString() ? `?${params.toString()}` : ''}`);
  },

  /**
   * Get user balances sorted by available funds
   * GET /admin/finance/user-balances
   */
  getUserBalances: async (filters?: {
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<UserBalanceListResponse> => {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    return apiClient.get<UserBalanceListResponse>(`/admin/finance/user-balances${params.toString() ? `?${params.toString()}` : ''}`);
  },

  /**
   * Get platform wallet balance
   * GET /admin/platform/wallet
   */
  getPlatformWallet: async (): Promise<PlatformWallet> => {
    return apiClient.get<PlatformWallet>('/admin/platform/wallet');
  },

  /**
   * Get platform bank accounts
   * GET /admin/platform/bank-accounts
   */
  getPlatformBankAccounts: async (): Promise<BankAccount[]> => {
    return apiClient.get<BankAccount[]>('/admin/platform/bank-accounts');
  },

  getPlatformBanks: async (country: string): Promise<Bank[]> => {
    const response = await apiClient.get<{ status: string; data: Bank[]; message: string }>(`/admin/platform/banks/${country.toUpperCase()}`);
    return response.data;
  },

  previewPlatformBankAccount: async (dto: { accountNumber: string; bankCode: string }): Promise<AccountPreview> => {
    const response = await apiClient.post<{ status: string; data: AccountPreview; message: string }>('/admin/platform/bank-accounts/preview', dto);
    return response.data;
  },

  /**
   * Add bank account for platform user
   * POST /admin/platform/bank-accounts
   */
  addPlatformBankAccount: async (dto: CreateBankAccountDto): Promise<BankAccount> => {
    return apiClient.post<BankAccount>('/admin/platform/bank-accounts', dto);
  },

  /**
   * Update platform bank account
   * PUT /admin/platform/bank-accounts/:accountId
   */
  updatePlatformBankAccount: async (accountId: string, dto: UpdateBankAccountDto): Promise<BankAccount> => {
    return apiClient.put<BankAccount>(`/admin/platform/bank-accounts/${accountId}`, dto);
  },

  /**
   * Delete platform bank account
   * DELETE /admin/platform/bank-accounts/:accountId
   */
  deletePlatformBankAccount: async (accountId: string): Promise<{ success: boolean; message: string }> => {
    return apiClient.delete<{ success: boolean; message: string }>(`/admin/platform/bank-accounts/${accountId}`);
  },

  /**
   * Create withdrawal request for platform wallet
   * POST /admin/platform/withdraw
   */
  createPlatformWithdrawal: async (dto: WithdrawRequestDto): Promise<PayoutRequestResponse> => {
    return apiClient.post<PayoutRequestResponse>('/admin/platform/withdraw', dto);
  },

  /**
   * Get platform withdrawal history with pagination
   * GET /admin/platform/withdrawals?page=1&limit=50
   */
  getPlatformWithdrawals: async (page: number = 1, limit: number = 50): Promise<PaginatedPlatformWithdrawals> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    
    return apiClient.get<PaginatedPlatformWithdrawals>(`/admin/platform/withdrawals?${params.toString()}`);
  },

  /**
   * Get gift wallet statistics
   * GET /admin/finance/gift-wallet
   */
  getGiftWalletStats: async (): Promise<GiftStats> => {
    return apiClient.get<GiftStats>('/admin/finance/gift-wallet');
  },

  /**
   * Get user gift holdings
   * GET /admin/finance/gift-wallet/holdings?page=1&limit=20&search=
   */
  getUserGiftHoldings: async (filters?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<UserGiftHoldingsResponse> => {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.search) params.append('search', filters.search);

    return apiClient.get<UserGiftHoldingsResponse>(`/admin/finance/gift-wallet/holdings${params.toString() ? `?${params.toString()}` : ''}`);
  },

  /**
   * Get all gifts (including inactive) for admin management
   * GET /gifts/admin/all
   */
  getAllGifts: async (): Promise<VirtualGift[]> => {
    return apiClient.get<VirtualGift[]>('/gifts/admin/all');
  },

  // ✅ NEW: Enhanced Analytics API Methods

  /**
   * Get regional revenue breakdown
   * GET /admin/finance/regional-revenue?period=monthly&startDate=2024-01-01&endDate=2024-12-31
   */
  getRegionalRevenue: async (options?: {
    period?: 'daily' | 'weekly' | 'monthly' | 'yearly';
    startDate?: string;
    endDate?: string;
  }): Promise<RegionalRevenueResponse> => {
    const params = new URLSearchParams();
    if (options?.period) params.append('period', options.period);
    if (options?.startDate) params.append('startDate', options.startDate);
    if (options?.endDate) params.append('endDate', options.endDate);

    return apiClient.get<RegionalRevenueResponse>(`/admin/finance/regional-revenue${params.toString() ? `?${params.toString()}` : ''}`);
  },

  /**
   * Get payment provider performance metrics
   * GET /admin/finance/provider-performance?period=monthly&startDate=2024-01-01&endDate=2024-12-31
   */
  getProviderPerformance: async (options?: {
    period?: 'daily' | 'weekly' | 'monthly' | 'yearly';
    startDate?: string;
    endDate?: string;
  }): Promise<ProviderPerformanceResponse> => {
    const params = new URLSearchParams();
    if (options?.period) params.append('period', options.period);
    if (options?.startDate) params.append('startDate', options.startDate);
    if (options?.endDate) params.append('endDate', options.endDate);

    return apiClient.get<ProviderPerformanceResponse>(`/admin/finance/provider-performance${params.toString() ? `?${params.toString()}` : ''}`);
  },

  /**
   * Get transaction pattern analysis
   * GET /admin/finance/transaction-patterns?period=monthly&startDate=2024-01-01&endDate=2024-12-31
   */
  getTransactionPatterns: async (options?: {
    period?: 'daily' | 'weekly' | 'monthly' | 'yearly';
    startDate?: string;
    endDate?: string;
  }): Promise<TransactionPatternsResponse> => {
    const params = new URLSearchParams();
    if (options?.period) params.append('period', options.period);
    if (options?.startDate) params.append('startDate', options.startDate);
    if (options?.endDate) params.append('endDate', options.endDate);

    return apiClient.get<TransactionPatternsResponse>(`/admin/finance/transaction-patterns${params.toString() ? `?${params.toString()}` : ''}`);
  },

  /**
   * Get enhanced revenue summary
   * GET /admin/finance/revenue-summary?period=monthly&startDate=2024-01-01&endDate=2024-12-31
   */
  getRevenueSummary: async (options?: {
    period?: 'daily' | 'weekly' | 'monthly' | 'yearly';
    startDate?: string;
    endDate?: string;
  }): Promise<EnhancedRevenueSummary> => {
    const params = new URLSearchParams();
    if (options?.period) params.append('period', options.period);
    if (options?.startDate) params.append('startDate', options.startDate);
    if (options?.endDate) params.append('endDate', options.endDate);

    return apiClient.get<EnhancedRevenueSummary>(`/admin/finance/revenue-summary${params.toString() ? `?${params.toString()}` : ''}`);
  },

  /**
   * Create a new gift
   * POST /gifts/admin
   */
  createGift: async (dto: CreateGiftDto): Promise<VirtualGift> => {
    return apiClient.post<VirtualGift>('/gifts/admin', dto);
  },

  /**
   * Update a gift
   * PUT /gifts/admin/:id
   */
  updateGift: async (id: string, dto: UpdateGiftDto): Promise<VirtualGift> => {
    return apiClient.put<VirtualGift>(`/gifts/admin/${id}`, dto);
  },

  /**
   * Delete a gift
   * DELETE /gifts/admin/:id
   */
  deleteGift: async (id: string): Promise<{ success: boolean; message: string }> => {
    return apiClient.delete<{ success: boolean; message: string }>(`/gifts/admin/${id}`);
  },

  /**
   * Upload a gift asset (lottie or sound)
   * POST /gifts/admin/upload
   */
  uploadGiftAsset: async (file: File, type: 'lottie' | 'sound'): Promise<{ url: string; type: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    return apiClient.post<{ url: string; type: string }>('/gifts/admin/upload', formData);
  },

  /**
   * Get all sounds
   * GET /gifts/admin/sounds
   */
  getSounds: async (): Promise<Sound[]> => {
    return apiClient.get<Sound[]>('/gifts/admin/sounds');
  },

  /**
   * Create a sound
   * POST /gifts/admin/sounds
   */
  createSound: async (dto: CreateSoundDto): Promise<Sound> => {
    return apiClient.post<Sound>('/gifts/admin/sounds', dto);
  },

  /**
   * Update a sound
   * PUT /gifts/admin/sounds/:id
   */
  updateSound: async (id: string, dto: UpdateSoundDto): Promise<Sound> => {
    return apiClient.put<Sound>(`/gifts/admin/sounds/${id}`, dto);
  },

  /**
   * Delete a sound
   * DELETE /gifts/admin/sounds/:id
   */
  deleteSound: async (id: string): Promise<{ success: boolean; message: string }> => {
    return apiClient.delete<{ success: boolean; message: string }>(`/gifts/admin/sounds/${id}`);
  },
};

