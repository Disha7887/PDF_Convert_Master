import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Button, Field, ScreenScroll } from "@/components/ui";
import colors from "@/constants/colors";
import { ROUTES } from "@/constants/routes";
import { fonts } from "@/constants/theme";
import { requestPasswordReset } from "@/services/profile";

const C = colors.light;

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(params.email ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    const trimmed = email.trim();
    if (!trimmed.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await requestPasswordReset(trimmed);
      if (res.success) {
        // Always advance to the code-entry screen (the backend never reveals
        // whether the email exists), passing the email along.
        router.replace({ pathname: ROUTES.resetPassword, params: { email: trimmed } } as never);
      } else {
        setError(res.error ?? "Could not send the reset code.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenScroll contentStyle={{ gap: 18 }}>
      <View style={{ gap: 8 }}>
        <Text style={styles.title}>Forgot your password?</Text>
        <Text style={styles.subtitle}>
          Enter the email for your account and we'll send you a 6-digit code to reset your
          password.
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
        testID="input-forgot-email"
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button
        label={submitting ? "Sending…" : "Send reset code"}
        onPress={submit}
        loading={submitting}
        disabled={submitting}
        fullWidth
        testID="button-send-code"
      />

      <Button
        label="I already have a code"
        variant="ghost"
        onPress={() =>
          router.replace({
            pathname: ROUTES.resetPassword,
            params: email.trim() ? { email: email.trim() } : {},
          } as never)
        }
        fullWidth
      />
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, color: C.foreground, fontFamily: fonts.headingBold },
  subtitle: { fontSize: 15, lineHeight: 22, color: C.mutedForeground, fontFamily: fonts.body },
  error: { fontSize: 13, color: C.destructive, fontFamily: fonts.body },
});
