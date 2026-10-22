import axios, { AxiosInstance, AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Warn in development if using fallback URL
if (process.env.NODE_ENV === 'development' && !process.env.NEXT_PUBLIC_API_URL) {
  console.warn(
    '⚠️  NEXT_PUBLIC_API_URL is not set. Using fallback: http://localhost:3000\n' +
    'Set NEXT_PUBLIC_API_URL in your .env.local file for production.'
  );
}

// Error in production if API URL is not set
if (process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_API_URL) {
  console.error(
    '❌ NEXT_PUBLIC_API_URL is required in production but is not set.\n' +
    'Please set NEXT_PUBLIC_API_URL in your environment variables.'
  );
}

class APIClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        // If data is FormData, remove Content-Type header to let browser set it with boundary
        if (config.data instanceof FormData) {
          delete config.headers['Content-Type'];
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle errors
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest: any = error.config;

        // Handle 401 errors (token expired or invalid)
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          const errorData = error.response?.data as { message?: string } | undefined;

          // Log the error for debugging
          const errorDetails = {
            url: originalRequest?.url,
            method: originalRequest?.method,
            message: errorData?.message || error.response?.data,
            hasToken: !!this.getAccessToken(),
          };
          
          console.error('401 Unauthorized Error:', errorDetails);

          // Check if this is a permission issue vs authentication issue
          const errorMessage = errorData?.message || '';
          const isPermissionError = errorMessage.toLowerCase().includes('permission') || 
                                    errorMessage.toLowerCase().includes('access denied');

          // Only redirect if it's clearly an authentication issue (not permission)
          // Permission errors should be handled by the component
          if (!isPermissionError) {
            const token = this.getAccessToken();
            if (token) {
              // Token exists but is invalid/expired
              console.warn('Authentication failed, redirecting to login');
              this.clearTokens();
              // Small delay to allow error to be logged
              setTimeout(() => {
                if (typeof window !== 'undefined') {
                  window.location.href = '/login';
                }
              }, 100);
            }
          }
          // If it's a permission error or no token, let the component handle it
        }

        return Promise.reject(error);
      }
    );
  }

  private getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('accessToken');
  }

  private getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('refreshToken');
  }

  public setTokens(accessToken: string, refreshToken: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  public clearTokens(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  public get<T = any>(url: string, config?: any): Promise<T> {
    return this.client.get(url, config).then((res) => res.data);
  }

  public post<T = any>(url: string, data?: any, config?: any): Promise<T> {
    return this.client.post(url, data, config).then((res) => res.data);
  }

  public patch<T = any>(url: string, data?: any, config?: any): Promise<T> {
    return this.client.patch(url, data, config).then((res) => res.data);
  }

  public put<T = any>(url: string, data?: any, config?: any): Promise<T> {
    return this.client.put(url, data, config).then((res) => res.data);
  }

  public delete<T = any>(url: string, config?: any): Promise<T> {
    return this.client.delete(url, config).then((res) => res.data);
  }
}

export const apiClient = new APIClient();
