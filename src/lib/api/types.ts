// ============================================
// API Response Types - Match Backend Exactly
// ============================================

// Authentication Types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface RegisterResponse {
  message: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

// User Types (from API)
export interface ApiUser {
  id: number;
  username: string;
  email: string;
}

// Device Types (from API)
export interface ApiDevice {
  id: number;
  deviceName: string;
  description: string;
  assetId: number | null;
  assetName: string | null;
}

export interface ApiUnassignedDevice {
  id: number;
  deviceName: string;
  description: string;
  isConfigured: boolean;
}

export interface CreateDeviceRequest {
  deviceName: string;
  description: string;
}

export interface UpdateDeviceRequest {
  deviceName: string;
  description: string;
}

// Asset Types (from API)
export interface ApiAsset {
  id: number;
  assetName: string;
  deviceId: number | null;
  deviceName: string | null;
}

export interface ApiAvailableDevice {
  id: number;
  deviceName: string;
  description: string;
  isConfigured: boolean;
}

export interface CreateAssetRequest {
  assetName: string;
}

export interface UpdateAssetRequest {
  assetName: string;
}

// API Error Types
export interface ApiError {
  message: string;
  status: number;
  details?: Record<string, string[]>;
}

// Generic API Response wrapper
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}
