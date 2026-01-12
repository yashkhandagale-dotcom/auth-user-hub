// User types
export type UserRole = "admin" | "user";

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  createdAt: string;
  lastLogin?: string;
  isActive: boolean;
}

export interface LoginLog {
  id: string;
  userId: string;
  username: string;
  loginTime: string;
  ipAddress: string;
  device: string;
  success: boolean;
}

// Device types
export type DeviceStatus = "active" | "inactive" | "maintenance" | "retired";
export type DeviceType = "laptop" | "desktop" | "tablet" | "phone" | "server" | "printer" | "other";

export interface Device {
  id: string;
  name: string;
  type: DeviceType;
  status: DeviceStatus;
  serialNumber: string;
  location: string;
  assignedUserId?: string;
  assignedUserName?: string;
  purchaseDate: string;
  lastUpdated: string;
  notes?: string;
}

// Asset types
export type AssetCategory = "hardware" | "software" | "peripheral" | "license" | "other";
export type AssetStatus = "available" | "in_use" | "reserved" | "retired";

export interface Asset {
  id: string;
  name: string;
  category: AssetCategory;
  status: AssetStatus;
  assetTag: string;
  linkedDeviceId?: string;
  linkedDeviceName?: string;
  assignedUserId?: string;
  assignedUserName?: string;
  purchaseDate: string;
  expiryDate?: string;
  cost: number;
  lastUpdated: string;
  notes?: string;
}

// Activity types
export interface Activity {
  id: string;
  type: "device" | "asset" | "user";
  action: "created" | "updated" | "deleted" | "assigned" | "login";
  description: string;
  timestamp: string;
  userId: string;
  userName: string;
}
