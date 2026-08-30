import { apiClient as client } from './client';

export interface LiveSalesEventConfig {
  id: string;
  watch_rewards_enabled: boolean;
  watch_time_minutes: number;
  freti_per_reward: number;
  daily_cap_per_user: number;
  per_stream_cap_per_user: number;
  notifications_enabled: boolean;
  leaderboard_enabled: boolean;
  default_order_weight: number;
  default_viewer_weight: number;
  default_revenue_weight: number;
  special_event_enabled: boolean;
  special_event_name?: string;
  special_event_start_at?: string;
  special_event_end_at?: string;
  special_event_order_weight: number;
  special_event_viewer_weight: number;
  special_event_revenue_weight: number;
  created_at: string;
  updated_at: string;
}

export interface UpdateLiveSalesEventConfigDto {
  watch_rewards_enabled?: boolean;
  watch_time_minutes?: number;
  freti_per_reward?: number;
  daily_cap_per_user?: number;
  per_stream_cap_per_user?: number;
  notifications_enabled?: boolean;
  leaderboard_enabled?: boolean;
  default_order_weight?: number;
  default_viewer_weight?: number;
  default_revenue_weight?: number;
  special_event_enabled?: boolean;
  special_event_name?: string;
  special_event_start_at?: string;
  special_event_end_at?: string;
  special_event_order_weight?: number;
  special_event_viewer_weight?: number;
  special_event_revenue_weight?: number;
}

export const getLiveSalesEventConfig = async () => {
  return client.get<LiveSalesEventConfig | null>('/admin/live-sales/event-config');
};

export const updateLiveSalesEventConfig = async (data: UpdateLiveSalesEventConfigDto) => {
  return client.put<LiveSalesEventConfig>('/admin/live-sales/event-config', data);
};

export const recalculateLeaderboard = async () => {
  return client.post<{ success: boolean; message: string }>('/admin/live-sales/recalculate-leaderboard');
};
