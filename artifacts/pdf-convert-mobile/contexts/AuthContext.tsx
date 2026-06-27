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

import { Platform } from "react-native";

import { USE_MOCK_DATA } from "@/constants/config";
import { API_BASE_URL } from "@/constants/api";
import { clearHistory } from "@/constants/history";
import { DEMO_USER, type MockUser } from "@/mocks/data";
import { mockApi } from "@/mocks/mockApi";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";

import { setAuthToken } from "@/services/authToken";

// Lets the system browser hand the OAuth redirect back to a waiting
// openAuthSessionAsync call (no-op on native, required on web).
WebBrowser.maybeCompleteAuthSession();

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
  /** Google sign-in via the system browser (backend-mediated OAuth). */
  googleSignin: () => Promise<{ success: boolean; error?: string; cancelled?: boolean }>;
  /**
   * Finish a Google sign-in from a token captured off the OAuth redirect deep
   * link. On Android the `pdfgenius://auth?token=...` callback is often consumed
   * by the router before `openAuthSessionAsync` can read it, so the `/auth`
   * screen captures the token and calls this to load + persist the session.
   */
  completeGoogleLogin: (
    token: string,
  ) => Promise<{ success: boolean; error?: string }>;
  /** Merge partial fields into the signed-in user and persist them locally. */
  updateUser: (updates: Partial<MockUser>, newToken?: string) => Promise<void>;
  /**
   * Re-fetch the signed-in user from the backend (credits, plan, etc.) and
   * mirror it onto local state. Returns the fresh credit balance, or null if
   * the refresh could not be completed.
   */
  refreshUser: () => Promise<number | null>;
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

  // Load the account a token belongs to and persist the session. Shared by the
  // in-app browser flow (googleSignin) and the deep-link callback screen.
  const completeGoogleLogin = useCallback(
    async (newToken: string) => {
      if (!newToken) {
        return { success: false, error: "Google sign-in failed. Please try again." };
      }
      // Bound the request so a hung connection can't leave the callback screen
      // spinning on the welcome animation forever.
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 15000);
      try {
        const res = await fetch(`${API_BASE_URL}/auth/user`, {
          headers: { Authorization: `Bearer ${newToken}` },
          signal: controller.signal,
        });
        const data = await res.json();
        if (!res.ok || !data?.success || !data?.data?.user) {
          return { success: false, error: "Could not load your account. Please try again." };
        }
        await persist(data.data.user, newToken);
        return { success: true };
      } catch {
        return { success: false, error: "Network error. Please try again." };
      } finally {
        clearTimeout(timer);
      }
    },
    [persist],
  );

  // Native Google sign-in. Opens the backend's OAuth start endpoint in the
  // system browser; the backend bounces through Google and redirects back to our
  // deep link with ?token=... (or ?error=...). We then load the account and
  // persist the session exactly like email login.
  const googleSignin = useCallback(async () => {
    if (!API_BASE_URL) {
      return { success: false, error: "Google sign-in isn't available in this build." };
    }
    // On web the popup returns to <origin>/auth; tag it with ?popup=1 so that
    // landing page hands the token back to THIS window and closes itself instead
    // of logging in inside the popup.
    const baseRedirect = Linking.createURL("auth");
    const redirectUrl =
      Platform.OS === "web" ? `${baseRedirect}?popup=1` : baseRedirect;
    const startUrl = `${API_BASE_URL}/auth/google/mobile/start?redirect=${encodeURIComponent(
      redirectUrl,
    )}`;

    // Web (Expo web preview / browser): Google refuses to load inside Replit's
    // preview iframe (the "403 — you do not have access" page), so a same-window
    // redirect can't work. Open Google in a real top-level popup instead. The
    // popup can't postMessage back to us — Google's COOP severs window.opener —
    // so the /auth landing page relays the token over a same-origin
    // BroadcastChannel, which we await here.
    if (Platform.OS === "web") {
      if (
        typeof window === "undefined" ||
        typeof BroadcastChannel === "undefined"
      ) {
        return {
          success: false,
          error:
            "Google sign-in isn't supported in this browser. Please update it or sign in with email.",
        };
      }
      return new Promise<{
        success: boolean;
        error?: string;
        cancelled?: boolean;
      }>((resolve) => {
        let settled = false;
        let channel: BroadcastChannel | null = null;
        let timeout: ReturnType<typeof setTimeout> | undefined;
        const cleanup = () => {
          try {
            channel?.close();
          } catch {
            /* ignore */
          }
          if (timeout) clearTimeout(timeout);
        };
        const finish = async (
          payload: { token?: string; error?: string } | null,
        ) => {
          if (settled) return;
          settled = true;
          cleanup();
          try {
            popup?.close();
          } catch {
            /* ignore */
          }
          if (!payload) return resolve({ success: false, cancelled: true });
          if (payload.error)
            return resolve({ success: false, error: payload.error });
          if (!payload.token)
            return resolve({
              success: false,
              error: "Google sign-in failed. Please try again.",
            });
          resolve(await completeGoogleLogin(payload.token));
        };
        try {
          channel = new BroadcastChannel("pdfgenius-oauth");
        } catch {
          return resolve({
            success: false,
            error: "Google sign-in isn't available here.",
          });
        }
        channel.onmessage = (e) => {
          if (e?.data?.type === "pdfgenius-google-auth") {
            finish({ token: e.data.token, error: e.data.error });
          }
        };
        const popup = window.open(
          startUrl,
          "pdfgenius-google",
          "width=480,height=640",
        );
        if (!popup) {
          cleanup();
          return resolve({
            success: false,
            error: "Please allow pop-ups for this site to sign in with Google.",
          });
        }
        // Note: we deliberately do NOT poll popup.closed for cancellation —
        // Google's COOP disowns the popup handle once it navigates to the
        // consent screen, so popup.closed reads true even while the user is
        // still signing in, which would cancel a perfectly good login. The
        // BroadcastChannel relay (success OR Google-side error) is the real
        // signal; this timeout is just a hard stop so the button can't spin
        // forever if the user abandons the popup.
        timeout = setTimeout(() => finish(null), 120000);
      });
    }

    try {
      const result = await WebBrowser.openAuthSessionAsync(startUrl, redirectUrl);

      if (result.type === "cancel" || result.type === "dismiss") {
        return { success: false, cancelled: true };
      }
      if (result.type !== "success" || !result.url) {
        return { success: false, error: "Google sign-in failed. Please try again." };
      }

      const { queryParams } = Linking.parse(result.url);
      const errorParam =
        typeof queryParams?.error === "string" ? queryParams.error : null;
      if (errorParam) return { success: false, error: errorParam };
      const newToken =
        typeof queryParams?.token === "string" ? queryParams.token : null;
      if (!newToken) {
        return { success: false, error: "Google sign-in failed. Please try again." };
      }

      // We hold a valid session token; load the account it belongs to so the UI
      // has the user's name / plan / credits immediately.
      return completeGoogleLogin(newToken);
    } catch {
      return { success: false, error: "Network error. Please try again." };
    }
  }, [completeGoogleLogin]);

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

  const refreshUser = useCallback(async (): Promise<number | null> => {
    if (!token) return null;
    try {
      const res = await fetch(`${API_BASE_URL}/auth/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return null;
      const payload = await res.json();
      const fresh = payload?.data?.user as Partial<MockUser> | undefined;
      if (!fresh) return null;
      setUser((prev) => {
        if (!prev) return prev;
        const next = { ...prev, ...fresh };
        AsyncStorage.setItem(USER_KEY, JSON.stringify(next)).catch(() => {});
        return next;
      });
      return typeof fresh.credits === "number" ? fresh.credits : null;
    } catch {
      return null;
    }
  }, [token]);

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
      googleSignin,
      completeGoogleLogin,
      updateUser,
      refreshUser,
      isAuthenticated: !!user && !!token,
    }),
    [user, token, loading, signin, signup, verifySignupOtp, signout, googleSignin, completeGoogleLogin, updateUser, refreshUser],
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
