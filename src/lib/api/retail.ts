import { apiClient as client } from './client';

export interface RetailConfig {
  retail_enabled: boolean;
  commission_rate: number;
  collaborators_enabled: boolean;
}

export interface UpdateRetailConfigDto {
  retail_enabled?: boolean;
  commission_rate?: number;
  collaborators_enabled?: boolean;
}

export interface RetailStats {
  activeEarningReposts: number;
  totalCommissionsPaid: number;
  totalCommissionAmount: number;
  commissionThisMonth: number;
  uniqueEarners: number;
  topEarners: Array<{
    userId: string;
    username: string;
    avatarUrl: string | null;
    total: number;
  }>;
}

export interface RetailCommissionRow {
  id: string;
  order_id: string;
  repost_id: string | null;
  reposter_id: string;
  item_type: 'product' | 'service';
  item_id: string;
  platform_amount: number;
  commission_amount: number;
  status: 'credited' | 'skipped';
  skip_reason: string | null;
  created_at: string;
  reposter?: { id: string; username: string; display_name?: string; avatar_url?: string };
  order?: { order_number: string };
}

export interface RetailRepostRow {
  id: string;
  reposterId: string;
  reposter?: { id: string; username: string; avatarUrl?: string | null };
  reposterRaw?: { username: string };
  targetType: 'post' | 'product' | 'service';
  targetId: string;
  caption: string | null;
  isRetail: boolean;
  itemName: string | null;
  createdAt: string;
}

export const getRetailConfig = () =>
  client.get<RetailConfig>('/admin/retail/config');

export const updateRetailConfig = (data: UpdateRetailConfigDto) =>
  client.put<RetailConfig>('/admin/retail/config', data);

export const getRetailStats = () =>
  client.get<RetailStats>('/admin/retail/stats');

export const getRetailCommissions = (limit = 50, offset = 0) =>
  client.get<{ rows: RetailCommissionRow[]; total: number }>(
    `/admin/retail/commissions?limit=${limit}&offset=${offset}`,
  );

export const getRetailReposts = (limit = 50, offset = 0) =>
  client.get<{ rows: RetailRepostRow[]; total: number }>(
    `/admin/retail/reposts?limit=${limit}&offset=${offset}`,
  );

export const disableRepostEarning = (repostId: string) =>
  client.post<{ disabled: boolean; already?: boolean }>(
    `/admin/retail/reposts/${repostId}/disable`,
  );
