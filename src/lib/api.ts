// src/lib/api.ts
const API_BASE_URL = "https://localhost:7291";

const TOKEN_KEY = "jwt_token";
const REFRESH_KEY = "refresh_token";
const STORAGE_TYPE_KEY = "auth_storage_type";

// -------------------- JWT PARSING --------------------
const parseJwt = (token: string): { exp?: number } | null => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

// -------------------- AUTH HELPERS --------------------
export const auth = {
  getToken: (): string | null =>
    localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY),

  getRefreshToken: (): string | null =>
    localStorage.getItem(REFRESH_KEY) || sessionStorage.getItem(REFRESH_KEY),

  setToken: (accessToken: string, refreshToken: string, rememberMe = true) => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_KEY);

    if (rememberMe) {
      localStorage.setItem(STORAGE_TYPE_KEY, "local");
      localStorage.setItem(TOKEN_KEY, accessToken);
      localStorage.setItem(REFRESH_KEY, refreshToken);
    } else {
      localStorage.setItem(STORAGE_TYPE_KEY, "session");
      sessionStorage.setItem(TOKEN_KEY, accessToken);
      sessionStorage.setItem(REFRESH_KEY, refreshToken);
    }
  },

  removeToken: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(STORAGE_TYPE_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_KEY);
  },

  isTokenExpired: (token: string) => {
    const payload = parseJwt(token);
    if (!payload?.exp) return true;
    return Date.now() + 5000 >= payload.exp * 1000; // 5s buffer
  },

  isAuthenticated: () => {
    const token = auth.getToken();
    return !!token && !auth.isTokenExpired(token);
  },
};

// -------------------- FETCH WITH AUTH --------------------
const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  let token = auth.getToken();

  if (!token || auth.isTokenExpired(token)) {
    auth.removeToken();
    throw new Error("Unauthorized: token missing or expired");
  }

  const headers = {
    ...options.headers,
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    if (response.status === 401) {
      auth.removeToken();
      throw new Error("Unauthorized");
    }
    throw new Error(`Request failed: ${response.statusText}`);
  }

  return response.json();
};

// -------------------- TYPES --------------------
export interface UserDto {
  id: string;
  username: string;
  email: string;
  role: "user" | "admin";
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

// -------------------- API METHODS --------------------
export const api = {
  // ---------- AUTH ----------
  register: async (username: string, email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || "Registration failed");
    }

    return response.json();
  },

  login: async (email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || "Login failed");
    }

    return response.json(); // { accessToken, refreshToken, role }
  },

  // ---------- USERS ----------
  getUsers: async (): Promise<UserDto[]> =>
    fetchWithAuth(`${API_BASE_URL}/api/users`),

  getUserById: async (id: string): Promise<UserDto> =>
    fetchWithAuth(`${API_BASE_URL}/api/users/${id}`),

  saveUser: async (user: Partial<UserDto>): Promise<UserDto> => {
    const method = user.id ? "PUT" : "POST";
    const url = user.id
      ? `${API_BASE_URL}/api/users/${user.id}`
      : `${API_BASE_URL}/api/users`;
    return fetchWithAuth(url, {
      method,
      body: JSON.stringify(user),
    });
  },

  deleteUser: async (id: string) =>
    fetchWithAuth(`${API_BASE_URL}/api/users/${id}`, { method: "DELETE" }),

  // ---------- DEVICES (optional, kept from old API) ----------
  getDevices: async () => fetchWithAuth(`${API_BASE_URL}/api/Device`),
  getUnassignedDevices: async () =>
    fetchWithAuth(`${API_BASE_URL}/api/Device/unassigned`),
};
