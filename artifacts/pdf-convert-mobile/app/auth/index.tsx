import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";

import AuthResultIcon from "@/components/AuthResultIcon";
import colors from "@/constants/colors";
import { ROUTES } from "@/constants/routes";
import { fonts } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";

const C = colors.light;

/**
 * Google OAuth callback landing screen.
 *
 * The backend redirects native sign-in to `pdfgenius://auth?token=...` (or
 * `?error=...`). On Android the OS frequently hands that deep link to the
 * router instead of the waiting `openAuthSessionAsync` call, so this screen is
 * the reliable place to finish the login: we read the token straight off the
 * URL, persist the session, and forward to the workspace. We also handle the
 * happy path where `googleSignin` already persisted the session (then we just
 * redirect on `isAuthenticated`).
 */
export default function AuthRedirectScreen() {
  const router = useRouter();
  const { user, isAuthenticated, completeGoogleLogin } = useAuth();
  const params = useLocalSearchParams<{
    token?: string;
    error?: string;
    popup?: string;
  }>();
  const [failed, setFailed] = useState(false);
  const handledRef = useRef(false);
  const navigatedRef = useRef(false);

  const tokenParam = typeof params?.token === "string" ? params.token : null;
  const errorParam = typeof params?.error === "string" ? params.error : null;

  // On web, Google's OAuth popup lands here tagged with ?popup=1. Because Google's
  // COOP severs window.opener, we relay the token to the original window over a
  // same-origin BroadcastChannel and close, instead of logging in here.
  const isOAuthPopup =
    Platform.OS === "web" &&
    typeof window !== "undefined" &&
    params?.popup === "1";

  useEffect(() => {
    if (!isOAuthPopup) return;
    try {
      const channel = new BroadcastChannel("pdfgenius-oauth");
      channel.postMessage({
        type: "pdfgenius-google-auth",
        token: tokenParam,
        error: errorParam,
      });
      channel.close();
    } catch {
      /* ignore */
    }
    // Give the message a tick to flush before the window disappears.
    const t = setTimeout(() => {
      try {
        window.close();
      } catch {
        /* ignore */
      }
    }, 150);
    return () => clearTimeout(t);
  }, [isOAuthPopup, tokenParam, errorParam]);

  // Finish the login from the token carried on the deep link. Runs once.
  useEffect(() => {
    if (isOAuthPopup) return;
    if (handledRef.current) return;
    if (errorParam) {
      handledRef.current = true;
      setFailed(true);
      return;
    }
    if (tokenParam && !isAuthenticated) {
      handledRef.current = true;
      completeGoogleLogin(tokenParam).then((res) => {
        if (!res.success) setFailed(true);
      });
    }
  }, [tokenParam, errorParam, isAuthenticated, completeGoogleLogin]);

  // Safety net: if there is no token and no session ever settles (e.g. a stray
  // visit to /auth), fall back to sign-in rather than spinning forever.
  useEffect(() => {
    if (isOAuthPopup) return;
    if (tokenParam || errorParam) return;
    const t = setTimeout(() => setFailed(true), 8000);
    return () => clearTimeout(t);
  }, [isOAuthPopup, tokenParam, errorParam]);

  // Navigate imperatively (once) so we can FIRST tear down the auth modal stack
  // (the transparent sign-in/sign-up sheet sitting underneath this callback
  // screen) and THEN land on the gate-free home tab. Using <Redirect> to the
  // dashboard left that sheet in the stack and could hit the dashboard's own
  // sign-in gate during auth-state propagation — which is what bounced users
  // back onto the sign-in page.
  useEffect(() => {
    if (isOAuthPopup) return;
    if (navigatedRef.current) return;
    if (!isAuthenticated && !failed) return;
    navigatedRef.current = true;
    const dest = isAuthenticated ? ROUTES.home : ROUTES.signIn;
    try {
      if (router.canDismiss?.()) router.dismissAll();
    } catch {
      // dismissAll throws if there's nothing to dismiss — safe to ignore.
    }
    router.replace(dest as never);
  }, [isAuthenticated, failed, router]);

  const firstName =
    user?.name?.trim().split(" ")[0] || user?.email?.split("@")[0] || "";
  const title = firstName ? `Welcome back, ${firstName}!` : "Welcome back!";

  if (isOAuthPopup) {
    return (
      <View style={styles.screen}>
        <Text style={styles.sub}>Completing sign-in…</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <AuthResultIcon kind="welcome" size={260} loop={false} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.sub}>Taking you home…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.background,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 30,
    color: C.foreground,
    fontFamily: fonts.headingBold,
    textAlign: "center",
    marginTop: 8,
  },
  sub: {
    fontSize: 15,
    color: C.mutedForeground,
    fontFamily: fonts.body,
    textAlign: "center",
    marginTop: 8,
  },
});
