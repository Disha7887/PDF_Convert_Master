import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { USE_MOCK_DATA } from "@/constants/config";
import { API_BASE_URL } from "@/constants/api";
import { DEMO_USER, type MockUser } from "@/mocks/data";
import { mockApi } from "@/mocks/mockApi";
import { setAuthToken } from "@/services/authToken";

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

interface AuthContextType {
  user: MockUser | null;
  token: string | null;
  loading: boolean;
  signin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (
    email: string,
    password: string,
    name?: string,
  ) => Promise<{ success: boolean; error?: string }>;
  signout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore a persisted session on mount.
  useEffect(() => {
    (async () => {
      try {
        const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
        const storedUser = await AsyncStorage.getItem(USER_KEY);
        if (storedToken) {
          setToken(storedToken);
          setAuthToken(storedToken);
          if (storedUser) setUser(JSON.parse(storedUser));
          else if (USE_MOCK_DATA) setUser(DEMO_USER);
        }
      } catch {
        // ignore restore errors
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const persist = useCallback(async (nextUser: MockUser, nextToken: string) => {
    setUser(nextUser);
    setToken(nextToken);
    setAuthToken(nextToken);
    await AsyncStorage.setItem(TOKEN_KEY, nextToken);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(nextUser));
  }, []);

  const signin = useCallback(
    async (email: string, password: string) => {
      if (USE_MOCK_DATA) {
        const res = await mockApi.signin(email, password);
        if (res.success && res.user && res.token) {
          await persist(res.user, res.token);
          return { success: true };
        }
        return { success: false, error: res.error ?? "Sign in failed" };
      }
      // Real backend (gated)
      try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await response.json();
        if (data.success) {
          await persist(data.data.user, data.data.token);
          return { success: true };
        }
        return { success: false, error: data.error ?? "Sign in failed" };
      } catch {
        return { success: false, error: "Network error. Please try again." };
      }
    },
    [persist],
  );

  const signup = useCallback(
    async (email: string, password: string, name?: string) => {
      if (USE_MOCK_DATA) {
        const res = await mockApi.signup(email, password, name);
        if (res.success && res.user && res.token) {
          await persist(res.user, res.token);
          return { success: true };
        }
        return { success: false, error: res.error ?? "Sign up failed" };
      }
      try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, name }),
        });
        const data = await response.json();
        if (data.success) {
          // Auto sign-in: the register endpoint returns a token + user, so we
          // persist the session immediately (no second sign-in round-trip).
          await persist(data.data.user, data.data.token);
          return { success: true };
        }
        return { success: false, error: data.error ?? "Sign up failed" };
      } catch {
        return { success: false, error: "Network error. Please try again." };
      }
    },
    [persist],
  );

  const signout = useCallback(() => {
    setUser(null);
    setToken(null);
    setAuthToken(null);
    AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]).catch(() => {});
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      token,
      loading,
      signin,
      signup,
      signout,
      isAuthenticated: !!user && !!token,
    }),
    [user, token, loading, signin, signup, signout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
