import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ScreenScroll } from "@/components/ui";
import colors from "@/constants/colors";
import { ROUTES } from "@/constants/routes";
import { cardShadow, fonts } from "@/constants/theme";

const C = colors.light;
type FeatherName = keyof typeof Feather.glyphMap;

const ROWS: { label: string; sublabel: string; icon: FeatherName; route: string }[] = [
  { label: "Usage Statistics", sublabel: "Conversions, API calls & data", icon: "bar-chart-2", route: ROUTES.usage },
  { label: "Conversion History", sublabel: "Your recent conversions", icon: "clock", route: ROUTES.history },
  { label: "API Setup", sublabel: "Create and manage API keys", icon: "key", route: ROUTES.apiSetup },
  { label: "API Reference", sublabel: "Endpoints & examples", icon: "code", route: ROUTES.apiReference },
  { label: "Manage Plans", sublabel: "Upgrade or change your plan", icon: "credit-card", route: ROUTES.managePlans },
  { label: "Live Tools", sublabel: "Try tools instantly", icon: "zap", route: ROUTES.liveTools },
];

export default function WorkspaceScreen() {
  const router = useRouter();
  const go = (r: string) => router.push(r as never);

  return (
    <ScreenScroll>
      <Text style={styles.heading}>Workspace</Text>
      <Text style={styles.sub}>Usage, API keys and plan management.</Text>

      <View style={[styles.group, cardShadow]}>
        {ROWS.map((row, i) => (
          <Pressable
            key={row.label}
            onPress={() => go(row.route)}
            style={({ pressed }) => [
              styles.linkRow,
              i > 0 && styles.linkDivider,
              { backgroundColor: pressed ? C.muted : "transparent" },
            ]}
          >
            <View style={styles.linkIcon}>
              <Feather name={row.icon} size={18} color={C.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.linkLabel}>{row.label}</Text>
              <Text style={styles.linkSub}>{row.sublabel}</Text>
            </View>
            <Feather name="chevron-right" size={18} color={C.mutedForeground} />
          </Pressable>
        ))}
      </View>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  heading: { fontSize: 24, color: C.foreground, fontFamily: fonts.headingBold },
  sub: { fontSize: 14, color: C.mutedForeground, fontFamily: fonts.body, marginTop: 6, marginBottom: 20 },
  group: {
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    overflow: "hidden",
  },
  linkRow: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 14, paddingVertical: 14 },
  linkDivider: { borderTopWidth: 1, borderTopColor: C.border },
  linkIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  linkLabel: { fontSize: 15, color: C.foreground, fontFamily: fonts.bodyMedium },
  linkSub: { fontSize: 12, color: C.mutedForeground, fontFamily: fonts.body, marginTop: 1 },
});
