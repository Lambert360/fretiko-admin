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
}

export interface PaginationResponse<T> {
  [key: string]: T[];
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
};

