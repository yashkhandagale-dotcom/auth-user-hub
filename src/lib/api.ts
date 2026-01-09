const API_BASE_URL = "https://localhost:7291";

export const api = {
  register: async (username: string, email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
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
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || "Login failed");
    }
    
    return response.json();
  },

  getUsers: async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/api/users`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Unauthorized");
      }
      throw new Error("Failed to fetch users");
    }
    
    return response.json();
  },
};

// Parse JWT payload without external library
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

export const auth = {
  getToken: () => localStorage.getItem("jwt_token"),
  setToken: (token: string) => localStorage.setItem("jwt_token", token),
  removeToken: () => localStorage.removeItem("jwt_token"),
  
  isAuthenticated: () => {
    const token = localStorage.getItem("jwt_token");
    if (!token) return false;
    return !auth.isTokenExpired(token);
  },

  isTokenExpired: (token: string): boolean => {
    const payload = parseJwt(token);
    if (!payload?.exp) return true;
    // exp is in seconds, Date.now() is in milliseconds
    return Date.now() >= payload.exp * 1000;
  },

  getTokenExpiration: (token: string): number | null => {
    const payload = parseJwt(token);
    return payload?.exp ? payload.exp * 1000 : null;
  },

  getTimeUntilExpiration: (token: string): number => {
    const expiration = auth.getTokenExpiration(token);
    if (!expiration) return 0;
    return Math.max(0, expiration - Date.now());
  },
};
