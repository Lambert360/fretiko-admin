import { apiClient } from './client';

/**
 * Broadcasts API
 * Admin-triggered promotional broadcasts (email + push + in-app)
 * to vendors or all users, with reusable templates and optional
 * auto-send cadence.
 */

export type BroadcastAudience = 'vendors' | 'all_users';
export type BroadcastTrigger = 'manual' | 'auto';
export type BroadcastStatus = 'running' | 'completed' | 'failed';

export interface BroadcastTemplate {
  id: string;
  name: string;
  subject: string;
  title: string;
  body: string;
  cta_label: string | null;
  cta_url: string | null;
  audience: BroadcastAudience;
  send_push: boolean;
  send_email: boolean;
  auto_cadence_days: number | null;
  skip_if_listed_within_days: number | null;
  is_active: boolean;
  last_auto_sent_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface BroadcastSend {
  id: string;
  template_id: string | null;
  template?: { name: string } | null;
  trigger: BroadcastTrigger;
  sent_by: string | null;
  audience: BroadcastAudience;
  subject: string;
  title: string;
  body: string;
  cta_label: string | null;
  cta_url: string | null;
  targeted: number;
  sent: number;
  suppressed: number;
  failed: number;
  status: BroadcastStatus;
  created_at: string;
  completed_at: string | null;
}

export interface BroadcastDraft {
  subject: string;
  title: string;
  body: string;
  cta_label?: string | null;
  cta_url?: string | null;
}

export interface SendBroadcastRequest {
  templateId?: string;
  draft?: BroadcastDraft;
  audience?: BroadcastAudience;
  sendPush?: boolean;
  sendEmail?: boolean;
  variables?: Record<string, string>;
}

export interface BroadcastHistoryResponse {
  sends: BroadcastSend[];
  total: number;
  page: number;
  limit: number;
}

export const broadcastsAPI = {
  /** GET /admin/broadcasts/templates */
  getTemplates: async (): Promise<BroadcastTemplate[]> => {
    return apiClient.get<BroadcastTemplate[]>('/admin/broadcasts/templates');
  },

  /** POST /admin/broadcasts/templates */
  createTemplate: async (template: Partial<BroadcastTemplate>): Promise<BroadcastTemplate> => {
    return apiClient.post<BroadcastTemplate>('/admin/broadcasts/templates', template);
  },

  /** PATCH /admin/broadcasts/templates/:id */
  updateTemplate: async (id: string, template: Partial<BroadcastTemplate>): Promise<BroadcastTemplate> => {
    return apiClient.patch<BroadcastTemplate>(`/admin/broadcasts/templates/${id}`, template);
  },

  /** DELETE /admin/broadcasts/templates/:id */
  deleteTemplate: async (id: string): Promise<{ success: boolean }> => {
    return apiClient.delete<{ success: boolean }>(`/admin/broadcasts/templates/${id}`);
  },

  /** GET /admin/broadcasts/audience-count?audience=vendors */
  getAudienceCount: async (audience: BroadcastAudience): Promise<{ audience: BroadcastAudience; count: number }> => {
    return apiClient.get(`/admin/broadcasts/audience-count?audience=${audience}`);
  },

  /** POST /admin/broadcasts/send — returns the send row (status 'running') */
  sendBroadcast: async (payload: SendBroadcastRequest): Promise<BroadcastSend | { error: string }> => {
    return apiClient.post('/admin/broadcasts/send', payload);
  },

  /** POST /admin/broadcasts/test — synchronous single-user test */
  testBroadcast: async (payload: SendBroadcastRequest & { userId: string }): Promise<any> => {
    return apiClient.post('/admin/broadcasts/test', payload);
  },

  /** GET /admin/broadcasts?page=1&limit=20 */
  getHistory: async (page = 1, limit = 20): Promise<BroadcastHistoryResponse> => {
    return apiClient.get<BroadcastHistoryResponse>(`/admin/broadcasts?page=${page}&limit=${limit}`);
  },
};
