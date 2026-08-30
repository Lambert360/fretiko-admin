import { apiClient as client } from './client';

export interface SignPost {
  id: string;
  name: string;
  title: string;
  subtitle: string;
  action_url: string;
  screen_target: 'home' | 'products' | 'live_sales' | 'auctions' | 'all';
  countdown_enabled: boolean;
  countdown_target: string | null;
  is_active: boolean;
  sort_order: number;
  start_at: string | null;
  end_at: string | null;
  created_at: string;
  updated_at: string;
  sign_post_media?: SignPostMedia[];
}

export interface SignPostMedia {
  id: string;
  sign_post_id: string;
  media_type: 'image' | 'video';
  media_url: string;
  thumbnail_url: string | null;
  sort_order: number;
  duration: number | null;
  width: number | null;
  height: number | null;
  mime_type: string | null;
  created_at: string;
}

export const getSignPosts = async () => {
  return client.get<SignPost[]>('/admin/app-management/sign-posts');
};

export const getSignPostById = async (id: string) => {
  return client.get<SignPost>(`/admin/app-management/sign-posts/${id}`);
};

export const createSignPost = async (data: any) => {
  return client.post<SignPost>('/admin/app-management/sign-posts', data);
};

export const updateSignPost = async (id: string, data: any) => {
  return client.put<SignPost>(`/admin/app-management/sign-posts/${id}`, data);
};

export const deleteSignPost = async (id: string) => {
  return client.delete<{ success: boolean }>(`/admin/app-management/sign-posts/${id}`);
};

export const uploadGenericSignPostMedia = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return client.post<{ mediaUrl: string; mediaType: 'image' | 'video'; thumbnailUrl: string | null }>(
    '/admin/app-management/sign-posts/upload',
    formData
  );
};

export const uploadSignPostMedia = async (signPostId: string, file: File, sortOrder?: number) => {
  const formData = new FormData();
  formData.append('file', file);
  if (sortOrder !== undefined) {
    formData.append('sortOrder', sortOrder.toString());
  }
  return client.post<SignPostMedia>(`/admin/app-management/sign-posts/${signPostId}/media`, formData);
};

export const updateSignPostMedia = async (mediaId: string, data: any) => {
  return client.put<SignPostMedia>(`/admin/app-management/sign-posts/media/${mediaId}`, data);
};

export const deleteSignPostMedia = async (mediaId: string) => {
  return client.delete<{ success: boolean }>(`/admin/app-management/sign-posts/media/${mediaId}`);
};
