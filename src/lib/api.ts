import { apiClient as client } from './api/client';

export const apiClient = {
  getBlogPosts: async (params?: { page?: number; limit?: number; status?: string }) => {
    return client.get('/admin/website-content/blog-posts', { params });
  },

  createBlogPost: async (data: any) => {
    return client.post('/admin/website-content/blog-posts', data);
  },

  updateBlogPost: async (id: string, data: any) => {
    return client.put(`/admin/website-content/blog-posts/${id}`, data);
  },

  deleteBlogPost: async (id: string) => {
    return client.delete(`/admin/website-content/blog-posts/${id}`);
  },

  getJobListings: async (params?: { page?: number; limit?: number; status?: string }) => {
    return client.get('/admin/website-content/job-listings', { params });
  },

  createJobListing: async (data: any) => {
    return client.post('/admin/website-content/job-listings', data);
  },

  updateJobListing: async (id: string, data: any) => {
    return client.put(`/admin/website-content/job-listings/${id}`, data);
  },

  deleteJobListing: async (id: string) => {
    return client.delete(`/admin/website-content/job-listings/${id}`);
  },

  getJobApplications: async (params?: { page?: number; limit?: number; status?: string }) => {
    return client.get('/admin/website-content/job-applications', { params });
  },

  updateJobApplication: async (id: string, data: any) => {
    return client.put(`/admin/website-content/job-applications/${id}`, data);
  },

  getAboutContent: async () => {
    return client.get('/admin/website-content/about-content');
  },

  createAboutContent: async (data: any) => {
    return client.post('/admin/website-content/about-content', data);
  },

  updateAboutContent: async (id: string, data: any) => {
    return client.put(`/admin/website-content/about-content/${id}`, data);
  },

  deleteAboutContent: async (id: string) => {
    return client.delete(`/admin/website-content/about-content/${id}`);
  },

  getSupportMessages: async (params?: { page?: number; limit?: number; status?: string; category?: string }) => {
    return client.get('/admin/website-content/support-messages', { params });
  },

  updateSupportMessage: async (id: string, data: any) => {
    return client.put(`/admin/website-content/support-messages/${id}`, data);
  },

  uploadBlogImage: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return client.post('/admin/website-content/upload/blog-image', formData);
  },

  uploadAboutImage: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return client.post('/admin/website-content/upload/about-image', formData);
  },

  uploadJobListingImage: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return client.post('/admin/website-content/upload/job-listing-image', formData);
  },

  deleteFile: async (filePath: string) => {
    return client.delete('/admin/website-content/upload/delete', { data: { filePath } });
  },

  getStorageStats: async () => {
    return client.get('/admin/website-content/upload/stats');
  },

  // Landing page content (hero slides + body rows)
  getLandingContent: async () => {
    return client.get('/admin/website-content/landing-content');
  },

  updateLandingSection: async (section: string, data: { content: Record<string, any>; isActive?: boolean }) => {
    return client.put(`/admin/website-content/landing-content/${section}`, data);
  },

  uploadLandingImage: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return client.post('/admin/website-content/upload/landing-image', formData);
  },
};

export default apiClient;
