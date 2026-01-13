import { API_CONFIG } from './config';
import { tokenService } from './token-service';
import { ApiError } from './types';

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
  timeout?: number;
}

class HttpClient {
  private async request<T>(
    baseUrl: string,
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { requiresAuth = false, timeout = API_CONFIG.TIMEOUT, ...fetchOptions } = options;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    };

    // Add authorization header if required
    if (requiresAuth) {
      const token = tokenService.getAccessToken();
      if (!token) {
        throw this.createError('No authentication token available', 401);
      }
      
      // Check if token is expired and try to refresh
      if (tokenService.isTokenExpired(token)) {
        const refreshed = await this.tryRefreshToken();
        if (!refreshed) {
          throw this.createError('Session expired. Please log in again.', 401);
        }
        const newToken = tokenService.getAccessToken();
        if (newToken) {
          (headers as Record<string, string>)['Authorization'] = `Bearer ${newToken}`;
        }
      } else {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        ...fetchOptions,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle 204 No Content
      if (response.status === 204) {
        return undefined as T;
      }

      // Handle error responses
      if (!response.ok) {
        let errorMessage = 'An error occurred';
        try {
          const errorData = await response.text();
          errorMessage = errorData || response.statusText;
        } catch {
          errorMessage = response.statusText;
        }
        throw this.createError(errorMessage, response.status);
      }

      // Parse JSON response
      const text = await response.text();
      if (!text) {
        return undefined as T;
      }
      return JSON.parse(text) as T;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw this.createError('Request timeout', 408);
      }
      
      throw error;
    }
  }

  private createError(message: string, status: number): ApiError {
    return { message, status };
  }

  private async tryRefreshToken(): Promise<boolean> {
    const refreshToken = tokenService.getRefreshToken();
    if (!refreshToken) {
      return false;
    }

    try {
      const response = await fetch(`${API_CONFIG.AUTH_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        tokenService.clearTokens();
        return false;
      }

      const tokens = await response.json();
      tokenService.setTokens(tokens.accessToken, tokens.refreshToken);
      return true;
    } catch {
      tokenService.clearTokens();
      return false;
    }
  }

  // Auth API methods
  async authGet<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(API_CONFIG.AUTH_BASE_URL, endpoint, { ...options, method: 'GET' });
  }

  async authPost<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(API_CONFIG.AUTH_BASE_URL, endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async authDelete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(API_CONFIG.AUTH_BASE_URL, endpoint, { ...options, method: 'DELETE' });
  }

  // Device & Asset API methods
  async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(API_CONFIG.DEVICE_ASSET_BASE_URL, endpoint, { ...options, method: 'GET' });
  }

  async post<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(API_CONFIG.DEVICE_ASSET_BASE_URL, endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(API_CONFIG.DEVICE_ASSET_BASE_URL, endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(API_CONFIG.DEVICE_ASSET_BASE_URL, endpoint, { ...options, method: 'DELETE' });
  }
}

export const httpClient = new HttpClient();
