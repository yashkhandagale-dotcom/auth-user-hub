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

export const auth = {
  getToken: () => localStorage.getItem("jwt_token"),
  setToken: (token: string) => localStorage.setItem("jwt_token", token),
  removeToken: () => localStorage.removeItem("jwt_token"),
  isAuthenticated: () => !!localStorage.getItem("jwt_token"),
};
