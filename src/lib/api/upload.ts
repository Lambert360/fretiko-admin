import { apiClient } from './client';

export interface UploadFileResponse {
  url: string;
  fileData: {
    name: string;
    size: number;
    type: string;
    mimeType: string;
  };
}

export interface UploadMultipleFilesResponse {
  files: Array<{
    url: string;
    fileData: {
      name: string;
      size: number;
      type: string;
      mimeType: string;
    };
  }>;
}

/**
 * File Upload API
 * Handles file uploads for admin panel (disputes, reports, etc.)
 */
export const uploadAPI = {
  /**
   * Upload a single file
   * POST /admin/disputes/upload
   */
  uploadFile: async (file: File): Promise<UploadFileResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    
    return apiClient.post<UploadFileResponse>('/admin/disputes/upload', formData);
  },

  /**
   * Upload multiple files
   * POST /admin/disputes/upload-multiple
   */
  uploadMultipleFiles: async (files: File[]): Promise<UploadMultipleFilesResponse> => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    
    return apiClient.post<UploadMultipleFilesResponse>('/admin/disputes/upload-multiple', formData);
  },
};

