import { httpClient } from './http-client';
import { 
  ApiDevice, 
  ApiUnassignedDevice, 
  CreateDeviceRequest, 
  UpdateDeviceRequest 
} from './types';

export const devicesApi = {
  /**
   * Get all devices
   * GET /Device
   */
  getAll: async (): Promise<ApiDevice[]> => {
    return httpClient.get<ApiDevice[]>('/Device');
  },

  /**
   * Get device by ID
   * GET /Device/{id}
   */
  getById: async (id: number): Promise<ApiDevice> => {
    return httpClient.get<ApiDevice>(`/Device/${id}`);
  },

  /**
   * Create a new device
   * POST /Device
   */
  create: async (data: CreateDeviceRequest): Promise<ApiDevice> => {
    return httpClient.post<ApiDevice>('/Device', data);
  },

  /**
   * Update an existing device
   * PUT /Device/{id}
   * Returns: 204 No Content
   */
  update: async (id: number, data: UpdateDeviceRequest): Promise<void> => {
    return httpClient.put<void>(`/Device/${id}`, data);
  },

  /**
   * Delete a device
   * DELETE /Device/{id}
   * Returns: 204 No Content
   */
  delete: async (id: number): Promise<void> => {
    return httpClient.delete<void>(`/Device/${id}`);
  },

  /**
   * Get unassigned devices (not linked to any asset)
   * GET /Device/unassigned
   */
  getUnassigned: async (): Promise<ApiUnassignedDevice[]> => {
    return httpClient.get<ApiUnassignedDevice[]>('/Device/unassigned');
  },

  /**
   * Bulk delete devices
   * @param ids Array of device IDs to delete
   */
  bulkDelete: async (ids: number[]): Promise<void> => {
    await Promise.all(ids.map(id => devicesApi.delete(id)));
  },
};
