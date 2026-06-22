import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User } from "@workspace/db";

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  signin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  signout: () => void;
  updateUser: (user: User, token?: string) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing token on mount
  useEffect(() => {
    const storedToken = localStorage.getItem("auth_token");
    if (storedToken) {
      setToken(storedToken);
      // Verify token with backend
      checkAuthStatus(storedToken);
    } else {
      setLoading(false);
    }
  }, []);

  const checkAuthStatus = async (authToken: string) => {
    try {
      const response = await fetch("/api/user", {
        headers: {
          "Authorization": `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUser(data.data.user);
          setToken(authToken);
        } else {
          // Token is invalid
          localStorage.removeItem("auth_token");
          setToken(null);
          setUser(null);
        }
      } else {
        // Token is invalid or expired
        localStorage.removeItem("auth_token");
        setToken(null);
        setUser(null);
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      localStorage.removeItem("auth_token");
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signin = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        const { user: userData, token: authToken } = data.data;
        setUser(userData);
        setToken(authToken);
        localStorage.setItem("auth_token", authToken);
        return { success: true };
      } else {
        return { success: false, error: data.error || "Sign in failed" };
      }
    } catch (error) {
      console.error("Sign in error:", error);
      return { success: false, error: "Network error. Please try again." };
    }
  };

  const signup = async (
    email: string,
    password: string,
    name?: string,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, ...(name ? { name } : {}) }),
      });

      const data = await response.json();

      if (data.success) {
        // Sign-up auto-logs the user in (parity with mobile) so the welcome
        // screen can greet them and they land straight in the dashboard. If the
        // backend ever stops returning a token/user, treat it as a failure
        // rather than showing a false "welcome" with no session.
        const { user: userData, token: authToken } = data.data ?? {};
        if (!userData || !authToken) {
          return { success: false, error: "Sign up failed. Please try again." };
        }
        setUser(userData);
        setToken(authToken);
        localStorage.setItem("auth_token", authToken);
        return { success: true };
      } else {
        return { success: false, error: data.error || "Sign up failed" };
      }
    } catch (error) {
      console.error("Sign up error:", error);
      return { success: false, error: "Network error. Please try again." };
    }
  };

  const signout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("auth_token");
  };

  // Merge fresh user data (and optionally a reissued token) into state after a
  // profile/avatar update so the UI reflects changes without a full reload.
  const updateUser = (updatedUser: User, newToken?: string) => {
    setUser(updatedUser);
    if (newToken) {
      setToken(newToken);
      localStorage.setItem("auth_token", newToken);
    }
  };

  const value: AuthContextType = {
    user,
    token,
    loading,
    signin,
    signup,
    signout,
    updateUser,
    isAuthenticated: !!user && !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}