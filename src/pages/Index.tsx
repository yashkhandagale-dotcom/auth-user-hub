import { useState, useEffect } from "react";
import { auth } from "@/lib/api";
import Login from "@/components/Login";
import Register from "@/components/Register";
import Users from "@/components/Users";

type Page = "login" | "register" | "users";

const Index = () => {
  const [currentPage, setCurrentPage] = useState<Page>("login");

  useEffect(() => {
    // Check if user is already authenticated
    if (auth.isAuthenticated()) {
      setCurrentPage("users");
    }
  }, []);

  const handleLoginSuccess = () => {
    setCurrentPage("users");
  };

  const handleRegisterSuccess = () => {
    setCurrentPage("login");
  };

  const handleLogout = () => {
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
    return <Users onLogout={handleLogout} />;
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
