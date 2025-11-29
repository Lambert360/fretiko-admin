import { apiClient } from './client';

/**
 * Finance API
 * Handles revenue tracking and financial analytics
 */

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
  vendorId: string;
  vendorName: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  requestedAt: string;
  processedAt?: string;
  paymentMethod: string;
  accountDetails?: string;
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
};

