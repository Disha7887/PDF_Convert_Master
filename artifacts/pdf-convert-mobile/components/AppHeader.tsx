import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import colors from "@/constants/colors";
import { ROUTES } from "@/constants/routes";
import { fonts } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";

const C = colors.light;

interface AppHeaderProps {
  subtitle?: string;
}

/** Branded header used at the top of the main tab screens. */
export function AppHeader({ subtitle = "Convert · Organize · Transform" }: AppHeaderProps) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();

  return (
    <View style={styles.header}>
      <Pressable style={styles.brand} onPress={() => router.push(ROUTES.home as never)}>
        <View style={styles.logoMark}>
          <Feather name="file-text" size={18} color="#fff" />
        </View>
        <View style={{ flexShrink: 1 }}>
          <Text style={styles.appTitle} numberOfLines={1}>
            PDF Convert Master
          </Text>
          {subtitle ? (
            <Text style={styles.appSubtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </Pressable>

      {isAuthenticated ? (
        <Pressable
          style={styles.avatar}
          onPress={() => router.push(ROUTES.settings as never)}
        >
          <Text style={styles.avatarText}>{user?.avatarInitials ?? "U"}</Text>
        </Pressable>
      ) : (
        <Pressable style={styles.signIn} onPress={() => router.push(ROUTES.signIn as never)}>
          <Text style={styles.signInText}>Sign In</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 18,
  },
  brand: { flexDirection: "row", alignItems: "center", gap: 12, flexShrink: 1 },
  logoMark: {
    width: 40,
    height: 40,
    borderRadius: 11,
    backgroundColor: C.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  appTitle: { fontSize: 18, color: C.foreground, fontFamily: fonts.headingBold, lineHeight: 22 },
  appSubtitle: { fontSize: 11, color: C.mutedForeground, fontFamily: fonts.body, marginTop: 1 },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 13, color: C.primary, fontFamily: fonts.bodyBold },
  signIn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: C.primary,
  },
  signInText: { fontSize: 13, color: "#fff", fontFamily: fonts.bodySemibold },
});

export default AppHeader;
