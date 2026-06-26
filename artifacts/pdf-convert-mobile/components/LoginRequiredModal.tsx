import { useRouter } from "expo-router";
import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import AuthResultIcon from "@/components/AuthResultIcon";
import colors from "@/constants/colors";
import { ROUTES } from "@/constants/routes";
import { fonts } from "@/constants/theme";

const C = colors.light;

/**
 * Shown when a guest tries to re-download a converted file after the free
 * 12-hour window. Plays the "please log in" Lottie and routes to sign-in.
 */
export function LoginRequiredModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <AuthResultIcon kind="login-required" size={140} loop />
          <Text style={styles.title}>Please log in to download</Text>
          <Text style={styles.body}>
            Free downloads stay available for 12 hours. Sign in to keep access to
            your converted files anytime.
          </Text>
          <Pressable
            style={({ pressed }) => [styles.primary, { opacity: pressed ? 0.92 : 1 }]}
            onPress={() => {
              onClose();
              router.push(ROUTES.signIn as never);
            }}
          >
            <Text style={styles.primaryText}>Log In</Text>
          </Pressable>
          <Pressable style={styles.secondary} onPress={onClose} hitSlop={8}>
            <Text style={styles.secondaryText}>Maybe later</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export default LoginRequiredModal;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: C.card,
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 22,
    alignItems: "center",
  },
  title: {
    fontSize: 19,
    color: C.foreground,
    fontFamily: fonts.headingBold,
    marginTop: 4,
    textAlign: "center",
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    color: C.mutedForeground,
    fontFamily: fonts.body,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 18,
  },
  primary: {
    width: "100%",
    backgroundColor: C.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryText: { color: "#fff", fontSize: 15, fontFamily: fonts.bodySemibold },
  secondary: { paddingVertical: 12, marginTop: 2 },
  secondaryText: { color: C.mutedForeground, fontSize: 14, fontFamily: fonts.bodyMedium },
});
