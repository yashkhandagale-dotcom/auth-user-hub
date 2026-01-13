import { httpClient } from './http-client';
import { 
  ApiAsset, 
  ApiAvailableDevice, 
  CreateAssetRequest, 
  UpdateAssetRequest 
} from './types';

export const assetsApi = {
  /**
   * Get all assets
   * GET /Asset
   */
  getAll: async (): Promise<ApiAsset[]> => {
    return httpClient.get<ApiAsset[]>('/Asset');
  },

  /**
   * Get asset by ID
   * GET /Asset/{id}
   */
  getById: async (id: number): Promise<ApiAsset> => {
    return httpClient.get<ApiAsset>(`/Asset/${id}`);
  },

  /**
   * Create a new asset
   * POST /Asset
   */
  create: async (data: CreateAssetRequest): Promise<ApiAsset> => {
    return httpClient.post<ApiAsset>('/Asset', data);
  },

  /**
   * Update an existing asset
   * PUT /Asset/{id}
   * Returns: 204 No Content
   */
  update: async (id: number, data: UpdateAssetRequest): Promise<void> => {
    return httpClient.put<void>(`/Asset/${id}`, data);
  },

  /**
   * Delete an asset
   * DELETE /Asset/{id}
   * Returns: 204 No Content
   */
  delete: async (id: number): Promise<void> => {
    return httpClient.delete<void>(`/Asset/${id}`);
  },

  /**
   * Configure asset with a device
   * POST /Asset/{assetId}/configure/{deviceId}
   * Returns: 204 No Content
   * Error: 400 if asset already configured or device already assigned
   */
  configureWithDevice: async (assetId: number, deviceId: number): Promise<void> => {
    return httpClient.post<void>(`/Asset/${assetId}/configure/${deviceId}`);
  },

  /**
   * Get available devices for asset configuration
   * GET /Asset/available-devices
   */
  getAvailableDevices: async (): Promise<ApiAvailableDevice[]> => {
    return httpClient.get<ApiAvailableDevice[]>('/Asset/available-devices');
  },

  /**
   * Bulk delete assets
   * @param ids Array of asset IDs to delete
   */
  bulkDelete: async (ids: number[]): Promise<void> => {
    await Promise.all(ids.map(id => assetsApi.delete(id)));
  },
};
