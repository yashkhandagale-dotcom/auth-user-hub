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
      let token = tokenService.getAccessToken();

      // If token missing or expired, try refresh (cookie-based)
      if (!token || tokenService.isTokenExpired(token)) {
        token = await this.tryRefreshToken();
        if (!token) {
          throw this.createError('Session expired. Please log in again.', 401);
        }
      }

      headers['Authorization'] = `Bearer ${token}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        ...fetchOptions,
        headers,
        signal: controller.signal,
        credentials: 'include', // important: send refresh cookie automatically
      });

      clearTimeout(timeoutId);

      // Handle 204 No Content
      if (response.status === 204) return undefined as T;

      // Handle errors
      if (!response.ok) {
        const text = await response.text();
        throw this.createError(text || response.statusText, response.status);
      }

      const text = await response.text();
      if (!text) return undefined as T;
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

  /** Try refresh token via cookie */
  private async tryRefreshToken(): Promise<string | null> {
    try {
      const res = await fetch(`${API_CONFIG.AUTH_BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include', // 🔴 cookie-based refresh
      });

      if (!res.ok) {
        tokenService.clearAccessToken();
        return null;
      }

      const data = await res.json();
      tokenService.setAccessToken(data.accessToken);
      return data.accessToken;
    } catch {
      tokenService.clearAccessToken();
      return null;
    }
  }

  // ---------------- Auth API ----------------
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

  // ---------------- Device & Asset API ----------------
  async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(API_CONFIG.DEVICE_ASSET_BASE_URL, endpoint, { ...options, method: 'GET', requiresAuth: true });
  }

  async post<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(API_CONFIG.DEVICE_ASSET_BASE_URL, endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      requiresAuth: true,
    });
  }

  async put<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(API_CONFIG.DEVICE_ASSET_BASE_URL, endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
      requiresAuth: true,
    });
  }

  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(API_CONFIG.DEVICE_ASSET_BASE_URL, endpoint, { ...options, method: 'DELETE', requiresAuth: true });
  }
}

export const httpClient = new HttpClient();
