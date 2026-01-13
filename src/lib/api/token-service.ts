import { STORAGE_KEYS } from './config';

// Parse JWT payload without external library
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

const getStorage = (): Storage => {
  const storageType = localStorage.getItem(STORAGE_KEYS.STORAGE_TYPE);
  return storageType === 'session' ? sessionStorage : localStorage;
};

export const tokenService = {
  getAccessToken: (): string | null => {
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) || 
           sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  },

  getRefreshToken: (): string | null => {
    return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN) || 
           sessionStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  },

  setTokens: (accessToken: string, refreshToken: string, rememberMe: boolean = true): void => {
    // Clear both storages first
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    sessionStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    sessionStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);

    const storage = rememberMe ? localStorage : sessionStorage;
    localStorage.setItem(STORAGE_KEYS.STORAGE_TYPE, rememberMe ? 'local' : 'session');
    storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
  },

  clearTokens: (): void => {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    sessionStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    sessionStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.STORAGE_TYPE);
  },

  isAuthenticated: (): boolean => {
    const token = tokenService.getAccessToken();
    if (!token) return false;
    return !tokenService.isTokenExpired(token);
  },

  isTokenExpired: (token: string): boolean => {
    const payload = parseJwt(token);
    if (!payload?.exp) return true;
    // Add 30 second buffer for clock skew
    return Date.now() >= (payload.exp * 1000) - 30000;
  },

  getTokenExpiration: (token: string): number | null => {
    const payload = parseJwt(token);
    return payload?.exp ? payload.exp * 1000 : null;
  },

  getTimeUntilExpiration: (token: string): number => {
    const expiration = tokenService.getTokenExpiration(token);
    if (!expiration) return 0;
    return Math.max(0, expiration - Date.now());
  },

  getTokenPayload: (token: string) => {
    return parseJwt(token);
  },
};
