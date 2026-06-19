import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Button, Card, Field, ScreenScroll } from "@/components/ui";
import colors from "@/constants/colors";
import { ROUTES } from "@/constants/routes";
import { fonts } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { DEMO_CREDENTIALS } from "@/mocks/data";

const C = colors.light;

export default function SignInScreen() {
  const router = useRouter();
  const { signin, isAuthenticated, loading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !loading) {
      router.replace(ROUTES.dashboardHome as never);
    }
  }, [isAuthenticated, loading, router]);

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace(ROUTES.home as never);
  };

  const handleSubmit = async () => {
    setError(null);

    // Basic form validation
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }
    if (!email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await signin(email, password);
      if (result.success) {
        router.replace(ROUTES.dashboardHome as never);
      } else {
        setError(result.error || "Sign in failed");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenScroll insetTop>
      {/* Back row */}
      <View style={styles.backRow}>
        <Pressable
          onPress={goBack}
          hitSlop={10}
          style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.6 : 1 }]}
          testID="button-back"
        >
          <Feather name="chevron-left" size={24} color={C.foreground} />
        </Pressable>
      </View>

      <Card style={styles.card}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Feather name="user" size={24} color="#fff" />
          </View>
          <Text style={styles.title}>PDF Convert Master</Text>
          <Text style={styles.subtitle}>
            Welcome back! Sign in to access your API dashboard
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Field
            label="Email Address"
            icon="mail"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            testID="input-email"
          />

          <View style={{ gap: 6 }}>
            <View style={styles.labelRow}>
              <Text style={styles.fieldLabel}>Password</Text>
              <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8} testID="button-toggle-password">
                <Text style={styles.toggleText}>{showPassword ? "Hide" : "Show"}</Text>
              </Pressable>
            </View>
            <Field
              icon="lock"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              testID="input-password"
            />
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText} testID="text-error">
                {error}
              </Text>
            </View>
          ) : null}

          <Button
            label={isSubmitting ? "Signing In..." : "Sign In"}
            onPress={handleSubmit}
            loading={isSubmitting}
            fullWidth
            size="lg"
            testID="button-sign-in"
          />

          {/* Demo account hint */}
          <View style={styles.demoHint}>
            <Text style={styles.demoTitle}>Demo account</Text>
            <Text style={styles.demoText}>Email: {DEMO_CREDENTIALS.email}</Text>
            <Text style={styles.demoText}>Password: {DEMO_CREDENTIALS.password}</Text>
          </View>

          {/* Sign Up link */}
          <View style={styles.linkRow}>
            <Text style={styles.linkText}>Don&apos;t have an account? </Text>
            <Pressable onPress={() => router.push(ROUTES.signUp as never)} hitSlop={8} testID="link-sign-up">
              <Text style={styles.linkAction}>Sign Up</Text>
            </Pressable>
          </View>
        </View>
      </Card>

      {/* Back to Home */}
      <Pressable
        onPress={() => router.replace(ROUTES.home as never)}
        style={styles.homeLink}
        hitSlop={8}
        testID="link-home"
      >
        <Feather name="arrow-left" size={16} color={C.primary} />
        <Text style={styles.homeLinkText}>Back to Home</Text>
      </Pressable>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  backRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.muted,
  },
  card: { gap: 24, padding: 24 },
  header: { alignItems: "center", gap: 12 },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: C.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 22,
    color: C.foreground,
    fontFamily: fonts.headingBold,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: C.mutedForeground,
    fontFamily: fonts.body,
    textAlign: "center",
  },
  form: { gap: 18 },
  labelRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  fieldLabel: { fontSize: 14, color: C.foreground, fontFamily: fonts.bodyMedium },
  toggleText: { fontSize: 13, color: C.primary, fontFamily: fonts.bodySemibold },
  errorBox: {
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 12,
    padding: 12,
  },
  errorText: { fontSize: 13, color: "#dc2626", fontFamily: fonts.body },
  demoHint: {
    backgroundColor: C.blue50,
    borderRadius: 12,
    padding: 14,
    gap: 2,
  },
  demoTitle: { fontSize: 13, color: C.blue700, fontFamily: fonts.bodySemibold, marginBottom: 2 },
  demoText: { fontSize: 13, color: C.blue700, fontFamily: fonts.body },
  linkRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 8,
  },
  linkText: { fontSize: 14, color: C.mutedForeground, fontFamily: fonts.body },
  linkAction: { fontSize: 14, color: C.primary, fontFamily: fonts.bodySemibold },
  homeLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 24,
  },
  homeLinkText: { fontSize: 14, color: C.primary, fontFamily: fonts.bodyMedium },
});
