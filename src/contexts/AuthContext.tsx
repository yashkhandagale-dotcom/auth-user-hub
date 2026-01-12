import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, UserRole } from "@/types";
import { auth } from "@/lib/api";
import { mockUsers } from "@/data/mockData";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, role?: UserRole) => void;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check for existing session
    if (auth.isAuthenticated()) {
      // For mock data, get user from storage or default to admin
      const storedEmail = localStorage.getItem("user_email") || sessionStorage.getItem("user_email");
      const mockUser = mockUsers.find(u => u.email === storedEmail) || mockUsers[0];
      setUser(mockUser);
    }
  }, []);

  const login = (email: string, role?: UserRole) => {
    // Find user in mock data or create one
    let foundUser = mockUsers.find(u => u.email === email);
    if (!foundUser) {
      foundUser = {
        id: crypto.randomUUID(),
        username: email.split("@")[0],
        email,
        role: role || "user",
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        isActive: true,
      };
    }
    setUser(foundUser);
    // Store email for session persistence
    if (localStorage.getItem("auth_storage_type") === "local") {
      localStorage.setItem("user_email", email);
    } else {
      sessionStorage.setItem("user_email", email);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user_email");
    sessionStorage.removeItem("user_email");
    auth.removeToken();
  };

  const updateProfile = (updates: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...updates });
    }
  };

  const isAuthenticated = !!user && auth.isAuthenticated();
  const isAdmin = user?.role === "admin";

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isAdmin, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
