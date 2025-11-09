import axios, { AxiosError, AxiosInstance, AxiosResponse } from 'axios';
import type { ApiError } from '@/types';

// API Configuration
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const API_BASE_PATH = '/api/v1';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_URL}${API_BASE_PATH}`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError<ApiError>) => {
    // Handle 401 Unauthorized - Token expired or invalid
    if (error.response?.status === 401) {
      // Try to refresh token
      const refreshToken = localStorage.getItem('refresh_token');

      if (refreshToken && !error.config?.url?.includes('/auth/refresh')) {
        try {
          const response = await axios.post(`${API_URL}${API_BASE_PATH}/auth/refresh`, {
            refreshToken,
          });

          const { token, refreshToken: newRefreshToken } = response.data;
          localStorage.setItem('auth_token', token);
          localStorage.setItem('refresh_token', newRefreshToken);

          // Retry original request
          if (error.config) {
            error.config.headers.Authorization = `Bearer ${token}`;
            return axios(error.config);
          }
        } catch (refreshError) {
          // Refresh failed - Clear auth and redirect to login
          localStorage.removeItem('auth_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token or refresh failed
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }

    // Handle network errors
    if (!error.response) {
      return Promise.reject({
        error: 'Network Error',
        message: 'Unable to connect to server. Please check your internet connection.',
      });
    }

    // Return error response
    return Promise.reject(error.response?.data || error.message);
  }
);

// Generic API methods
export const api = {
  // GET request
  get: <T = any>(url: string, params?: any) => {
    return apiClient.get<T>(url, { params }).then((res) => res.data);
  },

  // POST request
  post: <T = any>(url: string, data?: any) => {
    return apiClient.post<T>(url, data).then((res) => res.data);
  },

  // PUT request
  put: <T = any>(url: string, data?: any) => {
    return apiClient.put<T>(url, data).then((res) => res.data);
  },

  // PATCH request
  patch: <T = any>(url: string, data?: any) => {
    return apiClient.patch<T>(url, data).then((res) => res.data);
  },

  // DELETE request
  delete: <T = any>(url: string) => {
    return apiClient.delete<T>(url).then((res) => res.data);
  },

  // Upload file
  upload: <T = any>(url: string, formData: FormData) => {
    return apiClient
      .post<T>(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      .then((res) => res.data);
  },
};

export default apiClient;
