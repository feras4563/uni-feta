import { getToken, removeToken } from './jwt-auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

export type APIClientError = Error & {
  status?: number;
  details?: string[];
  fields?: Record<string, string[]>;
};

function buildAPIError(message: string, status?: number, fields?: Record<string, string[]>) {
  const error = new Error(message) as APIClientError;
  error.status = status;
  error.fields = fields;
  error.details = fields
    ? Object.values(fields).flat().filter((value): value is string => Boolean(value))
    : undefined;
  return error;
}

// API client with JWT authentication
class APIClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = getToken();
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Merge with provided headers
    if (options.headers) {
      Object.assign(headers, options.headers);
    }

    const url = `${this.baseURL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired or invalid
          removeToken();
          window.location.href = '/login';
          throw new Error('Unauthorized');
        }
        
        const error = await response.json().catch(() => ({ 
          message: `HTTP ${response.status}` 
        }));
        
        // Handle Laravel validation errors
        if (error.errors && typeof error.errors === 'object') {
          const validationMessages = Object.values(error.errors).flat().join(', ');
          throw buildAPIError(
            error.message || validationMessages || `HTTP ${response.status}`,
            response.status,
            error.errors as Record<string, string[]>
          );
        }
        
        throw buildAPIError(error.message || error.error || `HTTP ${response.status}`, response.status);
      }

      // Handle empty responses
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return response.json();
      }
      
      return {} as T;
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const queryString = params
      ? '?' + new URLSearchParams(params).toString()
      : '';
    return this.request<T>(`${endpoint}${queryString}`, {
      method: 'GET',
    });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }

  async upload<T>(endpoint: string, formData: FormData): Promise<T> {
    const token = getToken();
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = `${this.baseURL}${endpoint}`;
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      if (response.status === 401) {
        removeToken();
        window.location.href = '/login';
        throw new Error('Unauthorized');
      }
      const error = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
      if (error.errors && typeof error.errors === 'object') {
        throw buildAPIError(
          error.message || Object.values(error.errors).flat().join(', '),
          response.status,
          error.errors as Record<string, string[]>
        );
      }
      throw buildAPIError(error.message || `HTTP ${response.status}`, response.status);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    return {} as T;
  }
}

export const apiClient = new APIClient(API_URL);

// Export convenience methods
export const api = {
  get: <T>(endpoint: string, params?: Record<string, any>) => 
    apiClient.get<T>(endpoint, params),
  post: <T>(endpoint: string, data?: any) => 
    apiClient.post<T>(endpoint, data),
  put: <T>(endpoint: string, data?: any) => 
    apiClient.put<T>(endpoint, data),
  patch: <T>(endpoint: string, data?: any) => 
    apiClient.patch<T>(endpoint, data),
  delete: <T>(endpoint: string) => 
    apiClient.delete<T>(endpoint),
  upload: <T>(endpoint: string, formData: FormData) =>
    apiClient.upload<T>(endpoint, formData),
};
