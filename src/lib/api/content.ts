import { apiClient } from './client';

/**
 * Content Moderation API
 * Handles moderation of products, services, stories, and live streams
 */

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  status: 'draft' | 'active' | 'sold' | 'inactive';
  primary_image_url?: string;
  images?: string[];
  videos?: string[];
  primary_video_url?: string;
  media_type?: 'image' | 'video';
  view_count: number;
  like_count: number;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    username?: string;
    full_name?: string;
    avatar_url?: string;
    preferences?: {
      fullName?: string;
    };
  };
}

export interface Service {
  id: string;
  name: string;
  description: string;
  base_price: number;
  duration?: string;
  status: 'draft' | 'active' | 'busy' | 'inactive';
  primary_media_url?: string;
  images?: string[];
  videos?: string[];
  media_type?: 'image' | 'video';
  view_count: number;
  like_count: number;
  booking_count: number;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    username?: string;
    full_name?: string;
    avatar_url?: string;
    preferences?: {
      fullName?: string;
    };
  };
}

export interface Story {
  id: string;
  media_url: string;
  media_type: 'image' | 'video';
  thumbnail_url?: string;
  caption?: string;
  is_active: boolean;
  expires_at: string;
  view_count: number;
  like_count: number;
  created_at: string;
  user?: {
    id: string;
    username?: string;
    full_name?: string;
    avatar_url?: string;
    preferences?: {
      fullName?: string;
    };
  };
}

export interface LiveStream {
  id: string;
  title: string;
  description?: string;
  stream_type: 'products' | 'services';
  status: 'setup' | 'live' | 'ended' | 'paused';
  viewer_count: number;
  total_viewers: number;
  total_sales: number;
  thumbnail_url?: string;
  started_at?: string;
  ended_at?: string;
  created_at: string;
  vendor?: {
    id: string;
    username?: string;
    full_name?: string;
    avatar_url?: string;
    preferences?: {
      fullName?: string;
    };
  };
}

export interface Auction {
  id: string;
  title: string;
  description: string;
  lot_number?: string;
  starting_price: number;
  reserve_price?: number;
  current_bid: number;
  auction_type: 'timed' | 'live';
  start_time: string;
  end_time: string;
  status: 'scheduled' | 'active' | 'ended' | 'cancelled' | 'sold';
  total_bids: number;
  unique_bidders: number;
  view_count: number;
  watch_count: number;
  images?: string[];
  thumbnail_url?: string;
  video_url?: string;
  created_at: string;
  updated_at: string;
  seller?: {
    id: string;
    username?: string;
    full_name?: string;
    avatar_url?: string;
    preferences?: {
      fullName?: string;
    };
  };
}

export interface AdminPost {
  id: string;
  content: string | null;
  media_urls: string[];
  media_type: 'text' | 'image' | 'video' | 'mixed';
  privacy_level: 'public' | 'friends' | 'private';
  likes_count: number;
  comments_count: number;
  shares_count: number;
  gifts_count: number;
  is_pinned: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  reportCount: number;
  user?: {
    id: string;
    username?: string;
    avatar_url?: string;
    is_verified?: boolean;
    preferences?: { fullName?: string };
  };
  mediaItems?: Array<{
    id: string;
    media_type: 'image' | 'video';
    media_url: string;
    thumbnail_url?: string;
    duration?: number;
    width?: number;
    height?: number;
    order_index: number;
  }>;
}

export interface ContentModerationStats {
  products: {
    total: number;
    pending: number;
    active: number;
    inactive: number;
  };
  services: {
    total: number;
    pending: number;
    active: number;
    inactive: number;
  };
  stories: {
    total: number;
    active: number;
  };
  liveStreams: {
    total: number;
    live: number;
    ended: number;
  };
  auctions: {
    total: number;
    scheduled: number;
    active: number;
    ended: number;
  };
  posts: {
    total: number;
    hidden: number;
    reported: number;
  };
}

export interface PaginationResponse<T> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const contentAPI = {
  /**
   * Get products for moderation
   * GET /admin/content/products
   */
  getProducts: async (
    filters?: {
      status?: string;
      page?: number;
      limit?: number;
      search?: string;
    },
  ): Promise<PaginationResponse<Product>> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.search) params.append('search', filters.search);

    return apiClient.get<PaginationResponse<Product>>(
      `/admin/content/products${params.toString() ? `?${params.toString()}` : ''}`,
    );
  },

  /**
   * Approve product
   * POST /admin/content/products/:id/approve
   */
  approveProduct: async (id: string, reason?: string): Promise<{ message: string }> => {
    return apiClient.post<{ message: string }>(`/admin/content/products/${id}/approve`, { reason });
  },

  /**
   * Reject product
   * POST /admin/content/products/:id/reject
   */
  rejectProduct: async (id: string, reason: string): Promise<{ message: string }> => {
    return apiClient.post<{ message: string }>(`/admin/content/products/${id}/reject`, { reason });
  },

  /**
   * Get services for moderation
   * GET /admin/content/services
   */
  getServices: async (
    filters?: {
      status?: string;
      page?: number;
      limit?: number;
      search?: string;
    },
  ): Promise<PaginationResponse<Service>> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.search) params.append('search', filters.search);

    return apiClient.get<PaginationResponse<Service>>(
      `/admin/content/services${params.toString() ? `?${params.toString()}` : ''}`,
    );
  },

  /**
   * Approve service
   * POST /admin/content/services/:id/approve
   */
  approveService: async (id: string, reason?: string): Promise<{ message: string }> => {
    return apiClient.post<{ message: string }>(`/admin/content/services/${id}/approve`, { reason });
  },

  /**
   * Reject service
   * POST /admin/content/services/:id/reject
   */
  rejectService: async (id: string, reason: string): Promise<{ message: string }> => {
    return apiClient.post<{ message: string }>(`/admin/content/services/${id}/reject`, { reason });
  },

  /**
   * Get stories for moderation
   * GET /admin/content/stories
   */
  getStories: async (
    filters?: {
      page?: number;
      limit?: number;
      search?: string;
    },
  ): Promise<PaginationResponse<Story>> => {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.search) params.append('search', filters.search);

    return apiClient.get<PaginationResponse<Story>>(
      `/admin/content/stories${params.toString() ? `?${params.toString()}` : ''}`,
    );
  },

  /**
   * Remove story
   * POST /admin/content/stories/:id/remove
   */
  removeStory: async (id: string, reason: string): Promise<{ message: string }> => {
    return apiClient.post<{ message: string }>(`/admin/content/stories/${id}/remove`, { reason });
  },

  /**
   * Get live streams for moderation
   * GET /admin/content/live-streams
   */
  getLiveStreams: async (
    filters?: {
      status?: string;
      page?: number;
      limit?: number;
    },
  ): Promise<PaginationResponse<LiveStream>> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    return apiClient.get<PaginationResponse<LiveStream>>(
      `/admin/content/live-streams${params.toString() ? `?${params.toString()}` : ''}`,
    );
  },

  /**
   * End live stream
   * POST /admin/content/live-streams/:id/end
   */
  endLiveStream: async (id: string, reason: string): Promise<{ message: string }> => {
    return apiClient.post<{ message: string }>(`/admin/content/live-streams/${id}/end`, { reason });
  },

  /**
   * Get auctions for moderation
   * GET /admin/content/auctions
   */
  getAuctions: async (
    filters?: {
      status?: string;
      page?: number;
      limit?: number;
      search?: string;
    },
  ): Promise<PaginationResponse<Auction>> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.search) params.append('search', filters.search);

    return apiClient.get<PaginationResponse<Auction>>(
      `/admin/content/auctions${params.toString() ? `?${params.toString()}` : ''}`,
    );
  },

  /**
   * Approve auction
   * POST /admin/content/auctions/:id/approve
   */
  approveAuction: async (id: string, reason?: string): Promise<{ message: string }> => {
    return apiClient.post<{ message: string }>(`/admin/content/auctions/${id}/approve`, { reason });
  },

  /**
   * Reject/Cancel auction
   * POST /admin/content/auctions/:id/reject
   */
  rejectAuction: async (id: string, reason: string): Promise<{ message: string }> => {
    return apiClient.post<{ message: string }>(`/admin/content/auctions/${id}/reject`, { reason });
  },

  /**
   * Get content moderation statistics
   * GET /admin/content/stats
   */
  getStats: async (): Promise<ContentModerationStats> => {
    return apiClient.get<ContentModerationStats>('/admin/content/stats');
  },

  /**
   * Get reported content for moderation (staff)
   * GET /admin/content/reported
   */
  getReportedContent: async (filters?: {
    status?: 'pending' | 'under_review' | 'approved' | 'action_taken' | 'dismissed';
    category?: 'product' | 'service' | 'chat' | 'user' | 'post';
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ reports: any[]; total: number }> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    return apiClient.get<{ reports: any[]; total: number }>(
      `/admin/content/reported${params.toString() ? `?${params.toString()}` : ''}`,
    );
  },

  /**
   * Get reported content statistics (staff)
   * GET /admin/content/reported/stats
   */
  getReportedContentStats: async (): Promise<{
    totalReports: number;
    pendingReports: number;
    underReviewReports: number;
    actionTakenReports: number;
    dismissedReports: number;
    byCategory: {
      product: number;
      service: number;
      chat: number;
      user: number;
      post: number;
    };
  }> => {
    return apiClient.get('/admin/content/reported/stats');
  },

  /**
   * Review reported content (staff)
   * POST /admin/content/reported/:id/review
   */
  reviewReportedContent: async (
    reportId: string,
    review: {
      status: 'approved' | 'action_taken' | 'dismissed';
      actionTaken?: 'no_action' | 'content_removed' | 'content_hidden' | 'user_warned' | 'user_suspended' | 'user_banned';
      actionReason: string;
    },
  ): Promise<any> => {
    return apiClient.post(`/admin/content/reported/${reportId}/review`, review);
  },

  /**
   * Get posts for moderation
   * GET /admin/content/posts
   */
  getPosts: async (filters?: {
    status?: string;
    privacy?: string;
    search?: string;
    sortBy?: string;
    page?: number;
    limit?: number;
  }): Promise<{ posts: AdminPost[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.privacy) params.append('privacy', filters.privacy);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    return apiClient.get(`/admin/content/posts${params.toString() ? `?${params.toString()}` : ''}`);
  },

  /**
   * Get single post for moderation
   * GET /admin/content/posts/:id
   */
  getPostById: async (postId: string): Promise<AdminPost | null> => {
    try {
      return await apiClient.get<AdminPost>(`/admin/content/posts/${postId}`);
    } catch (error: any) {
      if (error?.response?.status === 404) return null;
      throw new Error(`Failed to fetch post: ${error?.response?.data?.message || error?.message}`);
    }
  },

  /**
   * Hide a post (admin soft-delete)
   * POST /admin/content/posts/:id/hide
   */
  hidePost: async (postId: string, reason: string): Promise<{ message: string }> => {
    return apiClient.post<{ message: string }>(`/admin/content/posts/${postId}/hide`, { reason });
  },

  /**
   * Restore a hidden post
   * POST /admin/content/posts/:id/restore
   */
  restorePost: async (postId: string): Promise<{ message: string }> => {
    return apiClient.post<{ message: string }>(`/admin/content/posts/${postId}/restore`, {});
  },

  /**
   * Pin a post
   * POST /admin/content/posts/:id/pin
   */
  pinPost: async (postId: string): Promise<{ message: string }> => {
    return apiClient.post<{ message: string }>(`/admin/content/posts/${postId}/pin`, {});
  },

  /**
   * Unpin a post
   * POST /admin/content/posts/:id/unpin
   */
  unpinPost: async (postId: string): Promise<{ message: string }> => {
    return apiClient.post<{ message: string }>(`/admin/content/posts/${postId}/unpin`, {});
  },

  /**
   * Get product by ID (direct fetch from moderation endpoint)
   * GET /admin/content/products/:id
   */
  getProductById: async (productId: string): Promise<Product | null> => {
    try {
      console.log('[contentAPI.getProductById] Fetching product:', productId);
      const response = await apiClient.get<Product>(`/admin/content/products/${productId}`);
      console.log('[contentAPI.getProductById] Product fetched successfully:', response);
      return response;
    } catch (error: any) {
      console.error('[contentAPI.getProductById] Error fetching product by ID:', {
        productId,
        error: error?.response?.data || error?.message || error,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        data: error?.response?.data,
      });
      if (error?.response?.status === 404) {
        console.log('[contentAPI.getProductById] Product not found (404)');
        return null;
      }
      throw new Error(`Failed to fetch product: ${error?.response?.data?.message || error?.message || 'Unknown error'}`);
    }
  },

  /**
   * Get service by ID (direct fetch from moderation endpoint)
   * GET /admin/content/services/:id
   */
  getServiceById: async (serviceId: string): Promise<Service | null> => {
    try {
      console.log('[contentAPI.getServiceById] Fetching service:', serviceId);
      const response = await apiClient.get<Service>(`/admin/content/services/${serviceId}`);
      console.log('[contentAPI.getServiceById] Service fetched successfully:', response);
      return response;
    } catch (error: any) {
      console.error('[contentAPI.getServiceById] Error fetching service by ID:', {
        serviceId,
        error: error?.response?.data || error?.message || error,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        data: error?.response?.data,
      });
      if (error?.response?.status === 404) {
        console.log('[contentAPI.getServiceById] Service not found (404)');
        return null;
      }
      throw new Error(`Failed to fetch service: ${error?.response?.data?.message || error?.message || 'Unknown error'}`);
    }
  },
};

