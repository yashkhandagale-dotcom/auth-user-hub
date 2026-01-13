// API Configuration
export const API_CONFIG = {
  // Device & Asset Management API
  DEVICE_ASSET_BASE_URL: 'https://localhost:7018/api',
  
  // User Authentication API
  AUTH_BASE_URL: 'https://localhost:7291/api',
  
  // Request timeout in milliseconds
  TIMEOUT: 30000,
  
  // Retry configuration
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
};

// Storage keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  STORAGE_TYPE: 'auth_storage_type',
};
