import { Redirect, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import AuthResultIcon from "@/components/AuthResultIcon";
import colors from "@/constants/colors";
import { ROUTES } from "@/constants/routes";
import { fonts } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";

const C = colors.light;

export default function AuthRedirectScreen() {
  const { user, isAuthenticated } = useAuth();
  const params = useLocalSearchParams<{ error?: string }>();
  const [timedOut, setTimedOut] = useState(false);

  // Safety net: the only way to reach /auth is the leaked Google OAuth deep
  // link, so we wait for googleSignin's token fetch + persist to flip
  // isAuthenticated. If it never settles (no token, no error param), fall back
  // to sign-in rather than spinning forever.
  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 8000);
    return () => clearTimeout(t);
  }, []);

  if (params?.error) return <Redirect href={ROUTES.signIn as never} />;
  if (isAuthenticated) return <Redirect href={ROUTES.dashboardHome as never} />;
  if (timedOut) return <Redirect href={ROUTES.signIn as never} />;

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
