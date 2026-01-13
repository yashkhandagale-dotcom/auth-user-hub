// src/lib/api/token-service.ts

// Only handle access token on frontend
const parseJwt = (token: string): { exp?: number; sub?: string; email?: string } | null => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

export const tokenService = {
  TOKEN_KEY: 'jwt_token',

  /** Get access token from sessionStorage only */
  getAccessToken: (): string | null => {
    return sessionStorage.getItem(tokenService.TOKEN_KEY);
  },

  /** Set access token in sessionStorage */
  setAccessToken: (token: string): void => {
    sessionStorage.setItem(tokenService.TOKEN_KEY, token);
  },

  /** Remove access token */
  clearAccessToken: (): void => {
    sessionStorage.removeItem(tokenService.TOKEN_KEY);
  },

  /** Check if access token exists and is valid */
  isAuthenticated: (): boolean => {
    const token = tokenService.getAccessToken();
    return !!token && !tokenService.isTokenExpired(token);
  },

  /** Check if token is expired */
  isTokenExpired: (token: string): boolean => {
    const payload = parseJwt(token);
    if (!payload?.exp) return true;
    // 5s buffer for clock skew
    return Date.now() + 5000 >= payload.exp * 1000;
  },

  /** Get token payload */
  getTokenPayload: (token: string) => parseJwt(token),

  /** Get milliseconds until token expires */
  getTimeUntilExpiration: (token: string): number => {
    const payload = parseJwt(token);
    if (!payload?.exp) return 0;
    return Math.max(0, payload.exp * 1000 - Date.now());
  },
};
