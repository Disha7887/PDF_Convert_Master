import { Feather, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Dimensions,
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
import { SvgXml } from "react-native-svg";

import AuthResultIcon from "@/components/AuthResultIcon";
import colors from "@/constants/colors";
import { USE_MOCK_DATA } from "@/constants/config";
import { ROUTES } from "@/constants/routes";
import { SIGN_UP_XML } from "@/constants/signUpIcon";
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

// As big as the screen comfortably allows for the celebratory welcome icon.
const WELCOME_SIZE = Math.min(Dimensions.get("window").width * 0.92, 420);

type Mode = "signin" | "signup";

export default function AuthSheet({ mode }: { mode: Mode }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signin, signup, user, isAuthenticated, loading } = useAuth();

  const [step, setStep] = useState<"email" | "credentials">("email");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [result, setResult] = useState<"signup-success" | "signin-success" | "error" | null>(null);
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
    // Bounce an already-signed-in visitor straight to the dashboard, but never
    // during an in-flight submit or while a result animation (e.g. the welcome
    // celebration) is playing. signin() flips isAuthenticated before its promise
    // resolves, so without the isSubmitting/result gate this effect would fire
    // first and skip the welcome animation.
    if (isAuthenticated && !loading && !isSubmitting && !result) {
      router.replace(ROUTES.dashboardHome as never);
    }
  }, [isAuthenticated, loading, isSubmitting, result, router]);

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

    if (redirectTimer.current) clearTimeout(redirectTimer.current);
    setIsSubmitting(true);
    try {
      if (mode === "signup") {
        const res = await signup(email, password, name);
        if (res.success) {
          // Sign-up now auto-logs the user in, so go straight to the workspace
          // with a personalised welcome rather than bouncing back to sign-in.
          setResult("signup-success");
          redirectTimer.current = setTimeout(
            () => router.replace(ROUTES.dashboardHome as never),
            2600,
          );
        } else {
          setResult("error");
          setError(res.error || "Sign up failed");
        }
      } else {
        const res = await signin(email, password);
        if (res.success) {
          setResult("signin-success");
          redirectTimer.current = setTimeout(
            () => router.replace(ROUTES.dashboardHome as never),
            2600,
          );
        } else {
          setResult("error");
          setError(res.error || "Sign in failed");
        }
      }
    } catch {
      setResult("error");
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const dismissError = () => {
    setResult(null);
    setError(null);
  };

  // Successful auth (sign-in OR sign-up, since sign-up auto-logs in): take over
  // the whole screen with the big welcome animation, greeting the user by name.
  if (result === "signin-success" || result === "signup-success") {
    const firstName =
      user?.name?.trim().split(" ")[0] || user?.email?.split("@")[0] || "";
    const title =
      result === "signup-success"
        ? firstName
          ? `Welcome, ${firstName}!`
          : "Welcome!"
        : firstName
          ? `Welcome back, ${firstName}!`
          : "Welcome back!";
    return (
      <View style={styles.welcomeScreen} testID="view-welcome">
        <AuthResultIcon kind="welcome" size={WELCOME_SIZE} loop={false} style={styles.welcomeIcon} />
        <Text style={styles.welcomeTitle}>{title}</Text>
        <Text style={styles.welcomeSub}>Taking you to your workspace…</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* Pre-warm the heavy welcome Lottie off-screen while the user is still on
          the sheet, so its composition is already parsed/cached by the time the
          full-screen welcome animation mounts after a successful sign-in. Without
          this, the welcome screen shows a blank gap until the 130KB+ animation
          finishes loading on native. */}
      <View
        style={styles.preload}
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <AuthResultIcon kind="welcome" size={WELCOME_SIZE} loop={false} />
      </View>

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
            {result === "error" ? (
              <View style={styles.resultBlock} testID="view-auth-error">
                <AuthResultIcon kind="error" size={150} loop={false} />
                <Text style={styles.resultTitle}>
                  {mode === "signup" ? "Sign up failed" : "Sign in failed"}
                </Text>
                {error ? <Text style={styles.resultSub}>{error}</Text> : null}
                <Pressable
                  style={({ pressed }) => [styles.primaryBtn, styles.resultBtn, pressed && styles.pressed]}
                  onPress={dismissError}
                  testID="button-try-again"
                >
                  <Text style={styles.primaryText}>Try Again</Text>
                </Pressable>
              </View>
            ) : (
              <>
            {/* Header */}
            <View style={styles.headerRow}>
              <Text style={styles.headerTitle}>Sign up or Log in</Text>
              <Pressable onPress={close} hitSlop={10} testID="button-auth-close">
                <Feather name="x" size={22} color={SHEET.muted} />
              </Pressable>
            </View>

            {/* Illustration */}
            <View style={styles.illustration}>
              <SvgXml xml={SIGN_UP_XML} width={150} height={158} />
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

                {mode === "signin" ? (
                  <Pressable
                    onPress={() =>
                      router.push({
                        pathname: ROUTES.forgotPassword,
                        params: email.trim() ? { email: email.trim() } : {},
                      } as never)
                    }
                    hitSlop={8}
                    style={styles.forgotWrap}
                    testID="link-forgot-password"
                  >
                    <Text style={styles.forgotText}>Forgot password?</Text>
                  </Pressable>
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

            {/* Primary action */}
            <Pressable
              style={({ pressed }) => [
                styles.primaryBtn,
                isSubmitting && styles.primaryBtnDisabled,
                pressed && styles.pressed,
              ]}
              onPress={step === "email" ? continueWithEmail : submit}
              disabled={isSubmitting}
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

            {/* Demo hint (sign-in only, mock mode only — the real backend has no seeded demo user) */}
            {USE_MOCK_DATA && mode === "signin" ? (
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
              </>
            )}
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

  // Off-screen, non-interactive warm-up host for the welcome Lottie. It must
  // stay mounted (not display:none) so the animation actually parses, but is
  // pushed off-screen with zero opacity so the user never sees it.
  preload: { position: "absolute", top: -9999, left: -9999, opacity: 0 },

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

  illustration: { alignItems: "center", justifyContent: "center", marginTop: 4, marginBottom: 14 },

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

  forgotWrap: { alignSelf: "flex-end", marginTop: 2 },
  forgotText: { fontSize: 13, color: C.primary, fontFamily: fonts.bodySemibold },

  errorText: { fontSize: 13, color: "#fda4a1", fontFamily: fonts.body, marginTop: 2 },
  infoText: { fontSize: 13, color: SHEET.muted, fontFamily: fonts.body, marginTop: 2 },

  // Result states (success / error) shown inside the sheet
  resultBlock: { alignItems: "center", justifyContent: "center", paddingVertical: 18, gap: 6 },
  resultTitle: { fontSize: 20, color: SHEET.text, fontFamily: fonts.headingBold, marginTop: 4 },
  resultSub: {
    fontSize: 14,
    color: SHEET.muted,
    fontFamily: fonts.body,
    textAlign: "center",
    lineHeight: 20,
  },
  resultBtn: { alignSelf: "stretch", marginTop: 16 },

  // Full-screen welcome (successful login)
  welcomeScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.background,
    padding: 24,
  },
  welcomeIcon: { marginBottom: 8 },
  welcomeTitle: { fontSize: 30, color: C.foreground, fontFamily: fonts.headingBold, textAlign: "center" },
  welcomeSub: {
    fontSize: 15,
    color: C.mutedForeground,
    fontFamily: fonts.body,
    textAlign: "center",
    marginTop: 6,
  },

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
