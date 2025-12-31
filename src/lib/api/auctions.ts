import { apiClient } from './client';

/**
 * Auction Admin API Client
 * Handles all admin auction management operations
 */

export interface FullBidHistoryItem {
  id: string;
  auction_id: string;
  bidder_id: string;
  amount: number;
  bid_type: 'manual' | 'proxy';
  max_bid_amount?: number;
  is_proxy_bid: boolean;
  proxy_bid_parent_id?: string;
  is_winning: boolean;
  is_valid: boolean;
  bidder_display_id: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  invalidation_reason?: string;
  invalidated_by?: string;
  invalidated_at?: string;
  // Bidder details (only columns that exist in user_profiles)
  bidder_username: string;
  bidder_phone?: string;
  bidder_avatar_url?: string;
  bidder_is_verified: boolean;
  bidder_bio?: string;
  bidder_location?: string;
  // Invalidator details
  invalidated_by_username?: string;
}

export interface FraudAlert {
  type: 'shill_bidding_ip' | 'rapid_bidding' | 'seller_self_bid' | 'suspicious_pattern';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  auctionId: string;
  details?: any;
}

export interface FraudCheckResult {
  auction_id: string;
  alerts_found: number;
  alerts: FraudAlert[];
  checked_at: string;
}

/**
 * Get full bid history with real user identities
 */
export async function getFullAuctionBidHistory(auctionId: string): Promise<FullBidHistoryItem[]> {
  const response = await apiClient.get(`/admin/auctions/${auctionId}/bids/full`);
  return response.data;
}

/**
 * Invalidate a fraudulent bid
 */
export async function invalidateBid(bidId: string, reason: string): Promise<{
  success: boolean;
  message: string;
  new_current_bid: number;
}> {
  const response = await apiClient.post(`/admin/auctions/bids/${bidId}/invalidate`, { reason });
  return response.data;
}

/**
 * Update auction category (Super Admin only)
 */
export async function updateAuctionCategory(
  categoryId: string,
  updates: { description?: string; display_order?: number; is_active?: boolean }
): Promise<any> {
  const response = await apiClient.put(`/admin/auctions/categories/${categoryId}`, updates);
  return response.data;
}

/**
 * Emergency extend auction
 */
export async function emergencyExtendAuction(
  auctionId: string,
  extensionMinutes: number,
  reason: string
): Promise<{
  success: boolean;
  message: string;
  new_end_time: string;
}> {
  const response = await apiClient.post(`/admin/auctions/${auctionId}/emergency-extend`, {
    extension_minutes: extensionMinutes,
    reason,
  });
  return response.data;
}

/**
 * Run manual fraud check
 */
export async function runFraudCheck(auctionId: string): Promise<FraudCheckResult> {
  const response = await apiClient.post(`/admin/auctions/${auctionId}/fraud-check`);
  return response.data;
}

/**
 * Get fraud alerts for an auction
 */
export async function getFraudAlerts(auctionId: string): Promise<{
  auction_id: string;
  current_alerts: FraudAlert[];
}> {
  const response = await apiClient.get(`/admin/auctions/${auctionId}/fraud-alerts`);
  return response.data;
}

