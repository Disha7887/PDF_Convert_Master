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
import { clearHistory } from "@/constants/history";
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
  /** Step 1 of signup: emails a verification code. Does NOT log the user in. */
  signup: (
    email: string,
    password: string,
    name?: string,
  ) => Promise<{ success: boolean; error?: string }>;
  /** Step 2 of signup: verifies the emailed code, creates the account, logs in. */
  verifySignupOtp: (
    email: string,
    code: string,
  ) => Promise<{ success: boolean; error?: string }>;
  signout: () => void;
  /** Merge partial fields into the signed-in user and persist them locally. */
  updateUser: (updates: Partial<MockUser>, newToken?: string) => Promise<void>;
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

  // Step 1: submit credentials. The backend stashes them and emails a code; no
  // account is created and no session is persisted until verifySignupOtp.
  const signup = useCallback(
    async (email: string, password: string, name?: string) => {
      if (USE_MOCK_DATA) {
        const res = await mockApi.signup(email, password, name);
        return res.success
          ? { success: true }
          : { success: false, error: res.error ?? "Sign up failed" };
      }
      try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, name }),
        });
        const data = await response.json();
        if (data.success) {
          return { success: true };
        }
        return { success: false, error: data.error ?? "Sign up failed" };
      } catch {
        return { success: false, error: "Network error. Please try again." };
      }
    },
    [],
  );

  // Step 2: verify the emailed code. On success the backend creates the account
  // and returns a token + user, which we persist (logging the user in).
  const verifySignupOtp = useCallback(
    async (email: string, code: string) => {
      if (USE_MOCK_DATA) {
        const res = await mockApi.verifySignupOtp(email, code);
        if (res.success && res.user && res.token) {
          await persist(res.user, res.token);
          return { success: true };
        }
        return { success: false, error: res.error ?? "Invalid or expired code" };
      }
      try {
        const response = await fetch(`${API_BASE_URL}/auth/verify-signup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, code }),
        });
        const data = await response.json();
        if (data.success) {
          await persist(data.data.user, data.data.token);
          return { success: true };
        }
        return { success: false, error: data.error ?? "Invalid or expired code" };
      } catch {
        return { success: false, error: "Network error. Please try again." };
      }
    },
    [persist],
  );

  const updateUser = useCallback(
    async (updates: Partial<MockUser>, newToken?: string) => {
      setUser((prev) => {
        if (!prev) return prev;
        const next = { ...prev, ...updates };
        AsyncStorage.setItem(USER_KEY, JSON.stringify(next)).catch(() => {});
        return next;
      });
      // The server rotates the JWT when email changes; persist it so future
      // authed calls don't carry a stale token.
      if (newToken) {
        setToken(newToken);
        setAuthToken(newToken);
        AsyncStorage.setItem(TOKEN_KEY, newToken).catch(() => {});
      }
    },
    [],
  );

  const signout = useCallback(() => {
    setUser(null);
    setToken(null);
    setAuthToken(null);
    AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]).catch(() => {});
    // Clear cached conversion history so the History screen doesn't keep
    // showing download buttons for jobs the backend will now refuse (a
    // signed-in user's jobs require their token; after logout they 403).
    clearHistory().catch(() => {});
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      token,
      loading,
      signin,
      signup,
      verifySignupOtp,
      signout,
      updateUser,
      isAuthenticated: !!user && !!token,
    }),
    [user, token, loading, signin, signup, verifySignupOtp, signout, updateUser],
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
