import { httpClient } from './http-client';
import { tokenService } from './token-service';
import { 
  AuthTokens, 
  RegisterResponse, 
  LoginRequest, 
  RegisterRequest 
} from './types';

export const authApi = {
  /**
   * Register a new user
   * POST /auth/register
   */
  register: async (username: string, email: string, password: string): Promise<RegisterResponse> => {
    const request: RegisterRequest = { username, email, password };
    return httpClient.authPost<RegisterResponse>('/auth/register', request);
  },

  /**
   * Login user and get tokens
   * POST /auth/login
   */
  login: async (email: string, password: string, rememberMe: boolean = true): Promise<AuthTokens> => {
    const request: LoginRequest = { email, password };
    const tokens = await httpClient.authPost<AuthTokens>('/auth/login', request);
    
    // Store tokens
    tokenService.setTokens(tokens.accessToken, tokens.refreshToken, rememberMe);
    
    return tokens;
  },

  /**
   * Refresh access token
   * POST /auth/refresh
   */
  refreshToken: async (): Promise<AuthTokens> => {
    const refreshToken = tokenService.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const tokens = await httpClient.authPost<AuthTokens>('/auth/refresh', { refreshToken });
    tokenService.setTokens(tokens.accessToken, tokens.refreshToken);
    
    return tokens;
  },

  /**
   * Logout user - clear tokens
   */
  logout: (): void => {
    tokenService.clearTokens();
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: (): boolean => {
    return tokenService.isAuthenticated();
  },
};
