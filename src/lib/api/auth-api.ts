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
   * Login user and get access token
   * Refresh token is sent as HttpOnly cookie
   */
  login: async (email: string, password: string): Promise<AuthTokens> => {
    const request: LoginRequest = { email, password };
    const tokens = await httpClient.authPost<AuthTokens>('/auth/login', request);
    
    // Only store access token; refresh token is cookie-based
    tokenService.setAccessToken(tokens.accessToken);
    
    return tokens;
  },

  /**
   * Refresh access token via cookie
   * No need to send refresh token manually
   */
  refreshToken: async (): Promise<AuthTokens> => {
    const tokens = await httpClient.authPost<AuthTokens>('/auth/refresh', undefined, {
      credentials: 'include', // send HttpOnly cookie
    });

    // Store new access token
    tokenService.setAccessToken(tokens.accessToken);

    return tokens;
  },

  /**
   * Logout user
   * Clears access token; backend clears cookie
   */
  logout: async (): Promise<void> => {
    await httpClient.authPost('/auth/logout', undefined, {
      credentials: 'include', // clear HttpOnly cookie
    });
    tokenService.clearAccessToken();
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: (): boolean => {
    return tokenService.isAuthenticated();
  },
};
