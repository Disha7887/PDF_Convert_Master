import { Redirect, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

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
  const { user, isAuthenticated, completeGoogleLogin } = useAuth();
  const params = useLocalSearchParams<{ token?: string; error?: string }>();
  const [failed, setFailed] = useState(false);
  const handledRef = useRef(false);

  const tokenParam = typeof params?.token === "string" ? params.token : null;
  const errorParam = typeof params?.error === "string" ? params.error : null;

  // Finish the login from the token carried on the deep link. Runs once.
  useEffect(() => {
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
    if (tokenParam || errorParam) return;
    const t = setTimeout(() => setFailed(true), 8000);
    return () => clearTimeout(t);
  }, [tokenParam, errorParam]);

  if (isAuthenticated) return <Redirect href={ROUTES.dashboardHome as never} />;
  if (failed) return <Redirect href={ROUTES.signIn as never} />;

  const firstName =
    user?.name?.trim().split(" ")[0] || user?.email?.split("@")[0] || "";
  const title = firstName ? `Welcome back, ${firstName}!` : "Welcome back!";

  return (
    <View style={styles.screen}>
      <AuthResultIcon kind="welcome" size={260} loop={false} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.sub}>Taking you to your workspace…</Text>
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
