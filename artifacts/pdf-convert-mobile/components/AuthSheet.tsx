import { Feather, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import colors from "@/constants/colors";
import { ROUTES } from "@/constants/routes";
import { fonts } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { DEMO_CREDENTIALS } from "@/mocks/data";

const C = colors.light;

// Sheet palette — this auth screen is intentionally dark (matches the design),
// independent of the otherwise light-only app theme.
const SHEET = {
  bg: "#171c28",
  field: "#1f2533",
  fieldBorder: "#2c3344",
  text: "#f8fafc",
  muted: "#9aa4b6",
  divider: "#2c3344",
};

type Mode = "signin" | "signup";

export default function AuthSheet({ mode }: { mode: Mode }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signin, signup, isAuthenticated, loading } = useAuth();

  const [step, setStep] = useState<"email" | "credentials">("email");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (redirectTimer.current) clearTimeout(redirectTimer.current);
    };
  }, []);

  const copy = useMemo(
    () =>
      mode === "signin"
        ? {
            cta: "Sign In",
            switchPrompt: "Don't have an account?",
            switchAction: "Sign Up",
            switchRoute: ROUTES.signUp,
          }
        : {
            cta: "Create Account",
            switchPrompt: "Already have an account?",
            switchAction: "Sign In",
            switchRoute: ROUTES.signIn,
          },
    [mode],
  );

  useEffect(() => {
    if (isAuthenticated && !loading) {
      router.replace(ROUTES.dashboardHome as never);
    }
  }, [isAuthenticated, loading, router]);

  const close = () => {
    if (router.canGoBack()) router.back();
    else router.replace(ROUTES.home as never);
  };

  const social = (provider: string) => {
    setError(null);
    setInfo(`${provider} sign-in isn't set up yet — continue with your email below.`);
  };

  const continueWithEmail = () => {
    setError(null);
    setInfo(null);
    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }
    if (!email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }
    setStep("credentials");
  };

  const submit = async () => {
    setError(null);
    setInfo(null);

    if (!email.includes("@")) {
      setStep("email");
      setError("Please enter a valid email address");
      return;
    }

    if (mode === "signup") {
      if (!name.trim() || !password || !confirmPassword) {
        setError("Please fill in all fields");
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters long");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }
    } else if (!password) {
      setError("Please enter your password");
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === "signup") {
        const result = await signup(email, password);
        if (result.success) {
          setSuccess(true);
          redirectTimer.current = setTimeout(() => router.replace(ROUTES.signIn as never), 1800);
        } else {
          setError(result.error || "Sign up failed");
        }
      } else {
        const result = await signin(email, password);
        if (result.success) {
          router.replace(ROUTES.dashboardHome as never);
        } else {
          setError(result.error || "Sign in failed");
        }
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.root}>
      <Pressable style={StyleSheet.absoluteFill} onPress={close} testID="button-auth-backdrop" />

      <KeyboardAvoidingView
        style={styles.fill}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        pointerEvents="box-none"
      >
        <Pressable style={styles.spacer} onPress={close} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 22 }]}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.sheetContent}
          >
            {/* Header */}
            <View style={styles.headerRow}>
              <Text style={styles.headerTitle}>Sign up or Log in</Text>
              <Pressable onPress={close} hitSlop={10} testID="button-auth-close">
                <Feather name="x" size={22} color={SHEET.muted} />
              </Pressable>
            </View>

            {/* Brand */}
            <View style={styles.brandRow}>
              <View style={styles.brandLogo}>
                <Feather name="file-text" size={22} color="#fff" />
              </View>
              <Text style={styles.brandName}>PDF Convert Master</Text>
            </View>

            {/* Social */}
            <Pressable
              style={({ pressed }) => [styles.socialBtn, pressed && styles.pressed]}
              onPress={() => social("Google")}
              testID="button-google"
            >
              <Ionicons name="logo-google" size={20} color="#ea4335" />
              <Text style={styles.socialText}>Google</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.socialBtn, pressed && styles.pressed]}
              onPress={() => social("Apple")}
              testID="button-apple"
            >
              <Ionicons name="logo-apple" size={21} color={SHEET.text} />
              <Text style={styles.socialText}>Apple</Text>
            </Pressable>

            {/* Email */}
            <View style={styles.inputWrap}>
              <Feather name="mail" size={18} color={SHEET.muted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="user@gmail.com"
                placeholderTextColor={SHEET.muted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={step === "email"}
                testID="input-email"
              />
              {step === "credentials" ? (
                <Pressable onPress={() => setStep("email")} hitSlop={8} testID="button-edit-email">
                  <Text style={styles.editText}>Edit</Text>
                </Pressable>
              ) : null}
            </View>

            {/* Credentials step (progressive) */}
            {step === "credentials" ? (
              <>
                {mode === "signup" ? (
                  <View style={styles.inputWrap}>
                    <Feather name="user" size={18} color={SHEET.muted} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={name}
                      onChangeText={setName}
                      placeholder="Full name"
                      placeholderTextColor={SHEET.muted}
                      autoCapitalize="words"
                      testID="input-full-name"
                    />
                  </View>
                ) : null}

                <View style={styles.inputWrap}>
                  <Feather name="lock" size={18} color={SHEET.muted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Password"
                    placeholderTextColor={SHEET.muted}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    testID="input-password"
                  />
                  <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8} testID="button-toggle-password">
                    <Feather name={showPassword ? "eye-off" : "eye"} size={18} color={SHEET.muted} />
                  </Pressable>
                </View>

                {mode === "signup" ? (
                  <View style={styles.inputWrap}>
                    <Feather name="lock" size={18} color={SHEET.muted} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      placeholder="Confirm password"
                      placeholderTextColor={SHEET.muted}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      testID="input-confirm-password"
                    />
                  </View>
                ) : null}
              </>
            ) : null}

            {/* Messages */}
            {error ? (
              <Text style={styles.errorText} testID="text-error">
                {error}
              </Text>
            ) : null}
            {info ? (
              <Text style={styles.infoText} testID="text-info">
                {info}
              </Text>
            ) : null}
            {success ? (
              <Text style={styles.successText} testID="text-success">
                Account created! Redirecting to sign in...
              </Text>
            ) : null}

            {/* Primary action */}
            <Pressable
              style={({ pressed }) => [
                styles.primaryBtn,
                (isSubmitting || success) && styles.primaryBtnDisabled,
                pressed && styles.pressed,
              ]}
              onPress={step === "email" ? continueWithEmail : submit}
              disabled={isSubmitting || success}
              testID={step === "email" ? "button-continue" : "button-submit"}
            >
              <Text style={styles.primaryText}>
                {step === "email"
                  ? "Continue"
                  : isSubmitting
                    ? mode === "signup"
                      ? "Creating account..."
                      : "Signing in..."
                    : copy.cta}
              </Text>
            </Pressable>

            {/* Demo hint (sign-in only) */}
            {mode === "signin" ? (
              <Text style={styles.demoText}>
                Demo — email: {DEMO_CREDENTIALS.email} · password: {DEMO_CREDENTIALS.password}
              </Text>
            ) : null}

            {/* Switch mode */}
            <View style={styles.switchRow}>
              <Text style={styles.switchPrompt}>{copy.switchPrompt} </Text>
              <Pressable
                onPress={() => router.replace(copy.switchRoute as never)}
                hitSlop={8}
                testID="link-switch-mode"
              >
                <Text style={styles.switchAction}>{copy.switchAction}</Text>
              </Pressable>
            </View>

            {/* Terms */}
            <Text style={styles.termsText}>
              By continuing I agree to the{" "}
              <Text
                style={styles.termsLink}
                onPress={() => router.push(ROUTES.terms as never)}
                accessibilityRole="link"
                testID="link-terms"
              >
                Terms
              </Text>{" "}
              &{" "}
              <Text
                style={styles.termsLink}
                onPress={() => router.push(ROUTES.privacy as never)}
                accessibilityRole="link"
                testID="link-privacy"
              >
                Privacy Policy
              </Text>
              .
            </Text>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "rgba(11,18,32,0.55)" },
  fill: { flex: 1 },
  spacer: { flex: 1 },

  sheet: {
    backgroundColor: SHEET.bg,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    maxHeight: "88%",
    ...(Platform.OS === "web" ? { maxWidth: 460, width: "100%", alignSelf: "center" } : null),
  },
  sheetContent: { padding: 22, gap: 12 },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 14, color: SHEET.text, fontFamily: fonts.bodySemibold },

  brandRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12, marginVertical: 10 },
  brandLogo: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: C.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  brandName: { fontSize: 24, color: SHEET.text, fontFamily: fonts.headingBold },

  socialBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    height: 54,
    paddingHorizontal: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: SHEET.fieldBorder,
    backgroundColor: SHEET.field,
  },
  socialText: { fontSize: 15, color: SHEET.text, fontFamily: fonts.bodyMedium },

  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 54,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: SHEET.fieldBorder,
    backgroundColor: SHEET.field,
  },
  inputIcon: { width: 18 },
  input: { flex: 1, fontSize: 15, color: SHEET.text, fontFamily: fonts.body, paddingVertical: 0 },
  editText: { fontSize: 13, color: C.primary, fontFamily: fonts.bodySemibold },

  errorText: { fontSize: 13, color: "#fda4a1", fontFamily: fonts.body, marginTop: 2 },
  infoText: { fontSize: 13, color: SHEET.muted, fontFamily: fonts.body, marginTop: 2 },
  successText: { fontSize: 13, color: "#86efac", fontFamily: fonts.body, marginTop: 2 },

  primaryBtn: {
    height: 54,
    borderRadius: 14,
    backgroundColor: C.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  primaryBtnDisabled: { opacity: 0.6 },
  primaryText: { fontSize: 16, color: "#fff", fontFamily: fonts.bodySemibold },
  pressed: { opacity: 0.85 },

  demoText: { fontSize: 11.5, color: SHEET.muted, fontFamily: fonts.body, textAlign: "center", marginTop: 2 },

  switchRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 4 },
  switchPrompt: { fontSize: 13, color: SHEET.muted, fontFamily: fonts.body },
  switchAction: { fontSize: 13, color: C.primary, fontFamily: fonts.bodySemibold },

  termsText: {
    fontSize: 12,
    color: SHEET.muted,
    fontFamily: fonts.body,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
  },
  termsLink: { color: SHEET.text, textDecorationLine: "underline" },
});
