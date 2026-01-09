import { useState, useEffect, useCallback } from "react";
import { auth } from "@/lib/api";
import Login from "@/components/Login";
import Register from "@/components/Register";
import Users from "@/components/Users";
import { toast } from "@/hooks/use-toast";

type Page = "login" | "register" | "users";

const Index = () => {
  const [currentPage, setCurrentPage] = useState<Page>("login");

  const handleLogout = useCallback((showMessage = false) => {
    auth.removeToken();
    setCurrentPage("login");
    if (showMessage) {
      toast({
        title: "Session Expired",
        description: "Your session has expired. Please log in again.",
        variant: "destructive",
      });
    }
  }, []);

  useEffect(() => {
    // Check if user is already authenticated
    if (auth.isAuthenticated()) {
      setCurrentPage("users");
    }
  }, []);

  // Set up automatic logout timer when on users page
  useEffect(() => {
    if (currentPage !== "users") return;

    const token = auth.getToken();
    if (!token) {
      handleLogout();
      return;
    }

    // Check if already expired
    if (auth.isTokenExpired(token)) {
      handleLogout(true);
      return;
    }

    // Set timeout for automatic logout
    const timeUntilExpiration = auth.getTimeUntilExpiration(token);
    
    // Add a small buffer (1 second) before actual expiration
    const timeout = setTimeout(() => {
      handleLogout(true);
    }, Math.max(0, timeUntilExpiration - 1000));

    // Also check periodically in case system clock changes
    const interval = setInterval(() => {
      const currentToken = auth.getToken();
      if (!currentToken || auth.isTokenExpired(currentToken)) {
        handleLogout(true);
      }
    }, 30000); // Check every 30 seconds

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [currentPage, handleLogout]);

  const handleLoginSuccess = () => {
    setCurrentPage("users");
  };

  const handleRegisterSuccess = () => {
    setCurrentPage("login");
  };

  // Render based on current page
  if (currentPage === "register") {
    return (
      <Register
        onSuccess={handleRegisterSuccess}
        onLoginClick={() => setCurrentPage("login")}
      />
    );
  }

  if (currentPage === "users") {
    return <Users onLogout={() => handleLogout(false)} />;
  }

  // Default: Login page
  return (
    <Login
      onSuccess={handleLoginSuccess}
      onRegisterClick={() => setCurrentPage("register")}
    />
  );
};

export default Index;
