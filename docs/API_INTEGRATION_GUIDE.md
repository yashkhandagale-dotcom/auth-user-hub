# Frontend API Integration Guide

## Overview

This guide provides complete documentation for integrating the frontend with the Device & Asset Management backend APIs.

---

## Base URLs

| Service | Base URL |
|---------|----------|
| Device & Asset API | `https://localhost:7018/api` |
| User/Auth API | `https://localhost:7291/api` |

---

## Authentication

### Token Storage
- Access tokens are stored in `localStorage` or `sessionStorage` based on "Remember Me" preference
- Refresh tokens should be stored securely for token renewal
- All protected endpoints require the `Authorization: Bearer {accessToken}` header

### Token Refresh Flow
1. Check if access token is expired before making requests
2. If expired, call `/auth/refresh` with the refresh token
3. Store new tokens and retry the original request
4. If refresh fails, redirect to login

---

## 1️⃣ Authentication Endpoints

### Register User
```
POST /auth/register
```

**Request Body:**
```json
{
  "username": "user1",
  "email": "user@example.com",
  "password": "StrongPassword123"
}
```

**Success Response (200):**
```json
{
  "message": "User registered successfully"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid input or user already exists

**Frontend Usage:**
```typescript
import { authApi } from '@/lib/api/auth';

try {
  const result = await authApi.register('username', 'email@example.com', 'password123');
  toast.success('Registration successful!');
} catch (error) {
  toast.error(error.message);
}
```

---

### Login User
```
POST /auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "StrongPassword123"
}
```

**Success Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4..."
}
```

**Error Responses:**
- `400 Bad Request` - Invalid credentials
- `401 Unauthorized` - Authentication failed

**Frontend Usage:**
```typescript
import { authApi, tokenService } from '@/lib/api/auth';

try {
  const { accessToken, refreshToken } = await authApi.login(email, password);
  tokenService.setTokens(accessToken, refreshToken, rememberMe);
  navigate('/dashboard');
} catch (error) {
  toast.error('Invalid email or password');
}
```

---

### Refresh Token
```
POST /auth/refresh
```

**Request Body:**
```json
{
  "refreshToken": "JWT_REFRESH_TOKEN"
}
```

**Success Response (200):**
```json
{
  "accessToken": "NEW_JWT_ACCESS_TOKEN",
  "refreshToken": "NEW_REFRESH_TOKEN"
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid or expired refresh token

---

## 2️⃣ User Management Endpoints (Protected)

### Get All Users
```
GET /users
Authorization: Bearer {accessToken}
```

**Success Response (200):**
```json
[
  {
    "id": 1,
    "username": "user1",
    "email": "user@example.com"
  }
]
```

**Frontend Usage:**
```typescript
import { userApi } from '@/lib/api/users';

const users = await userApi.getAll();
```

---

### Get User By ID
```
GET /users/{id}
Authorization: Bearer {accessToken}
```

**Success Response (200):**
```json
{
  "id": 1,
  "username": "user1",
  "email": "user@example.com"
}
```

**Error Responses:**
- `404 Not Found` - User not found

---

### Delete User
```
DELETE /users/{id}
Authorization: Bearer {accessToken}
```

**Success Response (200):**
```
"User deleted"
```

**Error Responses:**
- `404 Not Found` - User not found
- `401 Unauthorized` - Not authorized

---

## 3️⃣ Device Endpoints

### Create Device
```
POST /Device
Content-Type: application/json
```

**Request Body:**
```json
{
  "deviceName": "Device A",
  "description": "Device Description"
}
```

**Success Response (200):**
```json
{
  "id": 1,
  "deviceName": "Device A",
  "description": "Device Description",
  "assetId": null,
  "assetName": null
}
```

**Frontend Usage:**
```typescript
import { deviceApi } from '@/lib/api/devices';

const newDevice = await deviceApi.create({
  deviceName: 'Laptop #001',
  description: 'Development laptop'
});
```

---

### Get All Devices
```
GET /Device
```

**Success Response (200):**
```json
[
  {
    "id": 1,
    "deviceName": "Device A",
    "description": "Device Description",
    "assetId": 2,
    "assetName": "Asset X"
  },
  {
    "id": 2,
    "deviceName": "Device B",
    "description": "Device Description",
    "assetId": null,
    "assetName": null
  }
]
```

---

### Get Device By ID
```
GET /Device/{id}
```

**Success Response (200):**
```json
{
  "id": 1,
  "deviceName": "Device A",
  "description": "Device Description",
  "assetId": 2,
  "assetName": "Asset X"
}
```

**Error Responses:**
- `404 Not Found` - Device not found

---

### Update Device
```
PUT /Device/{id}
Content-Type: application/json
```

**Request Body:**
```json
{
  "deviceName": "Updated Device Name",
  "description": "Updated Description"
}
```

**Success Response:** `204 No Content`

---

### Delete Device
```
DELETE /Device/{id}
```

**Success Response:** `204 No Content`

---

### Get Unassigned Devices
```
GET /Device/unassigned
```

**Success Response (200):**
```json
[
  {
    "id": 3,
    "deviceName": "Device C",
    "description": "Device Description",
    "isConfigured": false
  }
]
```

---

## 4️⃣ Asset Endpoints

### Create Asset
```
POST /Asset
Content-Type: application/json
```

**Request Body:**
```json
{
  "assetName": "Asset Name"
}
```

**Success Response (200):**
```json
{
  "id": 1,
  "assetName": "Asset Name",
  "deviceId": null,
  "deviceName": null
}
```

---

### Get All Assets
```
GET /Asset
```

**Success Response (200):**
```json
[
  {
    "id": 1,
    "assetName": "Asset 1",
    "deviceId": 2,
    "deviceName": "Device A"
  },
  {
    "id": 2,
    "assetName": "Asset 2",
    "deviceId": null,
    "deviceName": null
  }
]
```

---

### Get Asset By ID
```
GET /Asset/{id}
```

**Success Response (200):**
```json
{
  "id": 1,
  "assetName": "Asset 1",
  "deviceId": 2,
  "deviceName": "Device A"
}
```

---

### Update Asset
```
PUT /Asset/{id}
Content-Type: application/json
```

**Request Body:**
```json
{
  "assetName": "Updated Asset Name"
}
```

**Success Response:** `204 No Content`

---

### Delete Asset
```
DELETE /Asset/{id}
```

**Success Response:** `204 No Content`

---

### Configure Asset with Device
```
POST /Asset/{assetId}/configure/{deviceId}
```

**Success Response:** `204 No Content`

**Error Responses:**
- `400 Bad Request` - Asset already configured or device already assigned

**Frontend Usage:**
```typescript
import { assetApi } from '@/lib/api/assets';

try {
  await assetApi.configureWithDevice(assetId, deviceId);
  toast.success('Asset configured with device');
} catch (error) {
  toast.error('Failed to configure: ' + error.message);
}
```

---

### Get Available Devices (for Asset Configuration)
```
GET /Asset/available-devices
```

**Success Response (200):**
```json
[
  {
    "id": 3,
    "deviceName": "Device C",
    "description": "Device Description",
    "isConfigured": false
  }
]
```

---

## Error Handling

### Common HTTP Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| `200` | Success | Process response data |
| `204` | No Content | Operation successful, no body |
| `400` | Bad Request | Show validation error to user |
| `401` | Unauthorized | Refresh token or redirect to login |
| `403` | Forbidden | Show access denied message |
| `404` | Not Found | Show "not found" message |
| `500` | Server Error | Show generic error, log details |

### Error Response Handling
```typescript
import { handleApiError } from '@/lib/api/utils';

try {
  const data = await deviceApi.getAll();
} catch (error) {
  const message = handleApiError(error);
  toast.error(message);
}
```

---

## TypeScript Interfaces

### API Response Types

```typescript
// Auth
interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface RegisterResponse {
  message: string;
}

// User
interface ApiUser {
  id: number;
  username: string;
  email: string;
}

// Device
interface ApiDevice {
  id: number;
  deviceName: string;
  description: string;
  assetId: number | null;
  assetName: string | null;
}

interface ApiUnassignedDevice {
  id: number;
  deviceName: string;
  description: string;
  isConfigured: boolean;
}

// Asset
interface ApiAsset {
  id: number;
  assetName: string;
  deviceId: number | null;
  deviceName: string | null;
}

interface ApiAvailableDevice {
  id: number;
  deviceName: string;
  description: string;
  isConfigured: boolean;
}
```

---

## Best Practices

1. **Always handle errors** - Wrap API calls in try-catch blocks
2. **Check token expiration** - Before protected requests, verify token validity
3. **Use loading states** - Show spinners during API calls
4. **Implement retry logic** - For transient failures
5. **Cache where appropriate** - Use React Query for data fetching
6. **Validate inputs** - Before sending to API

---

## Example: Complete CRUD Flow

```typescript
// DeviceManagement.tsx
import { deviceApi } from '@/lib/api/devices';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

function DeviceManagement() {
  const queryClient = useQueryClient();

  // Fetch devices
  const { data: devices, isLoading } = useQuery({
    queryKey: ['devices'],
    queryFn: deviceApi.getAll
  });

  // Create device
  const createMutation = useMutation({
    mutationFn: deviceApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      toast.success('Device created');
    }
  });

  // Update device
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => deviceApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      toast.success('Device updated');
    }
  });

  // Delete device
  const deleteMutation = useMutation({
    mutationFn: deviceApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      toast.success('Device deleted');
    }
  });

  // ... component JSX
}
```
