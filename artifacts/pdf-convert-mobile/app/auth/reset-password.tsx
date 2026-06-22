import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import AuthResultIcon from "@/components/AuthResultIcon";
import { Button, Field, ScreenScroll } from "@/components/ui";
import colors from "@/constants/colors";
import { ROUTES } from "@/constants/routes";
import { fonts } from "@/constants/theme";
import { resetPassword } from "@/services/profile";

const C = colors.light;

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(params.email ?? "");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = async () => {
    setError(null);
    const trimmedEmail = email.trim();
    if (!trimmedEmail.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!/^\d{6}$/.test(code.trim())) {
      setError("Enter the 6-digit code from your email.");
      return;
    }
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await resetPassword(trimmedEmail, code.trim(), newPassword);
      if (res.success) {
        setDone(true);
      } else {
        setError(res.error ?? "Could not reset your password.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <ScreenScroll contentStyle={{ gap: 18 }}>
        <View style={{ alignItems: "center" }}>
          <AuthResultIcon kind="password-reset" size={180} loop={false} />
        </View>
        <View style={{ gap: 8 }}>
          <Text style={styles.title}>Password updated</Text>
          <Text style={styles.subtitle}>
            Your password has been changed. You can now sign in with your new password.
          </Text>
        </View>
        <Button
          label="Go to sign in"
          onPress={() => router.replace(ROUTES.signIn as never)}
          fullWidth
          testID="button-go-signin"
        />
      </ScreenScroll>
    );
  }

  return (
    <ScreenScroll contentStyle={{ gap: 18 }}>
      <View style={{ gap: 8 }}>
        <Text style={styles.title}>Reset password</Text>
        <Text style={styles.subtitle}>
          Enter the 6-digit code we emailed you, then choose a new password.
        </Text>
      </View>

      <Field
        label="Email"
        icon="mail"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        testID="input-reset-email"
      />
      <Field
        label="Reset code"
        icon="hash"
        value={code}
        onChangeText={(t) => setCode(t.replace(/[^\d]/g, "").slice(0, 6))}
        placeholder="123456"
        keyboardType="number-pad"
        testID="input-reset-code"
      />
      <Field
        label="New password"
        icon="lock"
        value={newPassword}
        onChangeText={setNewPassword}
        placeholder="At least 6 characters"
        secureTextEntry
        autoCapitalize="none"
        testID="input-reset-new-password"
      />
      <Field
        label="Confirm new password"
        icon="lock"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        placeholder="Re-enter new password"
        secureTextEntry
        autoCapitalize="none"
        testID="input-reset-confirm-password"
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button
        label={submitting ? "Resetting…" : "Reset password"}
        onPress={submit}
        loading={submitting}
        disabled={submitting}
        fullWidth
        testID="button-reset-password"
      />
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, color: C.foreground, fontFamily: fonts.headingBold },
  subtitle: { fontSize: 15, lineHeight: 22, color: C.mutedForeground, fontFamily: fonts.body },
  error: { fontSize: 13, color: C.destructive, fontFamily: fonts.body },
});
