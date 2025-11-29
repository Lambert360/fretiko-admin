import { apiClient } from './client';

/**
 * Memos API
 * Handles internal memo communication for staff
 */

export type RecipientType = 'department' | 'staff' | 'all';
export type MemoPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface MemoAttachment {
  type: string;
  url: string;
  name: string;
  size?: string;
}

export interface Memo {
  id: string;
  subject: string;
  body: string;
  senderId: string;
  senderName: string;
  senderDepartmentId: string | null;
  senderDepartmentName: string | null;
  recipientType: RecipientType;
  recipientId: string | null;
  recipientName?: string;
  priority: MemoPriority;
  isRead: boolean;
  readAt: Date | null;
  readBy: string | null;
  attachments: MemoAttachment[];
  parentMemoId: string | null;
  replies?: Memo[];
  replyCount?: number;
  createdAt: string;
}

export interface MemoStats {
  total: number;
  unread: number;
  urgent: number;
  byPriority: {
    low: number;
    normal: number;
    high: number;
    urgent: number;
  };
  byRecipientType: {
    department: number;
    staff: number;
    all: number;
  };
}

export interface MemoFilters {
  recipientType?: RecipientType;
  priority?: MemoPriority;
  isRead?: 'true' | 'false';
  search?: string;
}

export interface SendMemoRequest {
  subject: string;
  body: string;
  recipientType: RecipientType;
  recipientId?: string;
  priority?: MemoPriority;
  attachments?: MemoAttachment[];
  parentMemoId?: string;
}

export const memosAPI = {
  /**
   * Get memo statistics
   * GET /memos/stats
   */
  getStats: async (): Promise<MemoStats> => {
    return apiClient.get<MemoStats>('/memos/stats');
  },

  /**
   * Get received memos
   * GET /memos/received
   */
  getReceivedMemos: async (filters?: MemoFilters): Promise<Memo[]> => {
    const params = new URLSearchParams();
    if (filters?.recipientType) params.append('recipientType', filters.recipientType);
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.isRead) params.append('isRead', filters.isRead);
    if (filters?.search) params.append('search', filters.search);

    return apiClient.get<Memo[]>(`/memos/received${params.toString() ? `?${params.toString()}` : ''}`);
  },

  /**
   * Get sent memos
   * GET /memos/sent
   */
  getSentMemos: async (filters?: MemoFilters): Promise<Memo[]> => {
    const params = new URLSearchParams();
    if (filters?.recipientType) params.append('recipientType', filters.recipientType);
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.isRead) params.append('isRead', filters.isRead);
    if (filters?.search) params.append('search', filters.search);

    return apiClient.get<Memo[]>(`/memos/sent${params.toString() ? `?${params.toString()}` : ''}`);
  },

  /**
   * Get memo by ID
   * GET /memos/:id
   */
  getMemoById: async (memoId: string): Promise<Memo> => {
    return apiClient.get<Memo>(`/memos/${memoId}`);
  },

  /**
   * Send a memo
   * POST /memos
   */
  sendMemo: async (memo: SendMemoRequest): Promise<Memo> => {
    return apiClient.post<Memo>('/memos', memo);
  },

  /**
   * Reply to a memo
   * POST /memos/:id/reply
   */
  replyToMemo: async (memoId: string, subject: string, message: string): Promise<Memo> => {
    return apiClient.post<Memo>(`/memos/${memoId}/reply`, { subject, message });
  },

  /**
   * Mark memo as read
   * PATCH /memos/:id/read
   */
  markAsRead: async (memoId: string): Promise<void> => {
    await apiClient.patch(`/memos/${memoId}/read`, {});
  },
};
