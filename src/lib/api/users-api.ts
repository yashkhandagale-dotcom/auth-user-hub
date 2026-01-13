import { httpClient } from './http-client';
import { ApiUser } from './types';

export const usersApi = {
  /**
   * Get all users
   * GET /users
   * Requires: Authorization header
   */
  getAll: async (): Promise<ApiUser[]> => {
    return httpClient.authGet<ApiUser[]>('/users', { requiresAuth: true });
  },

  /**
   * Get user by ID
   * GET /users/{id}
   * Requires: Authorization header
   */
  getById: async (id: number): Promise<ApiUser> => {
    return httpClient.authGet<ApiUser>(`/users/${id}`, { requiresAuth: true });
  },

  /**
   * Delete user
   * DELETE /users/{id}
   * Requires: Authorization header
   * Returns: "User deleted" string
   */
  delete: async (id: number): Promise<string> => {
    return httpClient.authDelete<string>(`/users/${id}`, { requiresAuth: true });
  },
};
