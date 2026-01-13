// src/lib/api.ts
const API_BASE_URL = "https://localhost:7291";

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

// -------------------- TOKEN SERVICE --------------------
export const auth = {
  TOKEN_KEY: "jwt_token",

  getToken: (): string | null => sessionStorage.getItem(auth.TOKEN_KEY),

  setAccessToken: (token: string) => {
    sessionStorage.setItem(auth.TOKEN_KEY, token);
  },

  removeToken: () => {
    sessionStorage.removeItem(auth.TOKEN_KEY);
  },

  isTokenExpired: (token: string) => {
    const payload = parseJwt(token);
    if (!payload?.exp) return true;
    return Date.now() + 5000 >= payload.exp * 1000; // 5s buffer
  },
};

// -------------------- REFRESH LOGIC --------------------
const refreshAccessToken = async (): Promise<string | null> => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: "POST",
      credentials: "include", // 🔴 sends refresh cookie
    });

    if (!res.ok) return null;

    const data = await res.json();
    auth.setAccessToken(data.accessToken);
    return data.accessToken;
  } catch {
    auth.removeToken();
    return null;
  }
};

// -------------------- FETCH WITH AUTO REFRESH --------------------
const fetchWithAuth = async (url: string, options: RequestInit = {}): Promise<any> => {
  let token = auth.getToken();

  if (!token || auth.isTokenExpired(token)) {
    token = await refreshAccessToken();
    if (!token) {
      auth.removeToken();
      throw new Error("Unauthorized: token expired");
    }
  }

  const response = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (response.status === 401) {
    // Retry once after refresh
    const newToken = await refreshAccessToken();
    if (!newToken) throw new Error("Unauthorized");
    return fetchWithAuth(url, options);
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || response.statusText);
  }

  if (response.status === 204) return undefined; // No Content
  return response.json();
};

// -------------------- API METHODS --------------------
export const api = {
  // ---------- AUTH ----------
  register: async (username: string, email: string, password: string) => {
    const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(err || "Registration failed");
    }

    return res.json();
  },

  login: async (email: string, password: string) => {
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // 🔴 important for refresh cookie
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(err || "Login failed");
    }

    const data = await res.json();
    auth.setAccessToken(data.accessToken);
    return data;
  },

  logout: async () => {
    await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    auth.removeToken();
  },

  // ---------- USERS ----------
  getUsers: async () => fetchWithAuth(`${API_BASE_URL}/api/users`),
  getUserById: async (id: string) => fetchWithAuth(`${API_BASE_URL}/api/users/${id}`),
  saveUser: async (user: any) => {
    const method = user.id ? "PUT" : "POST";
    const url = user.id ? `${API_BASE_URL}/api/users/${user.id}` : `${API_BASE_URL}/api/users`;
    return fetchWithAuth(url, { method, body: JSON.stringify(user) });
  },
  deleteUser: async (id: string) => fetchWithAuth(`${API_BASE_URL}/api/users/${id}`, { method: "DELETE" }),

  // ---------- DEVICES ----------
  getDevices: async () => fetchWithAuth(`${API_BASE_URL}/api/Device`),
  getUnassignedDevices: async () => fetchWithAuth(`${API_BASE_URL}/api/Device/unassigned`),
};
