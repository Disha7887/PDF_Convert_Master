import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import colors from "@/constants/colors";
import { fonts, heroShadow } from "@/constants/theme";

const C = colors.light;

/**
 * Home is intentionally minimal — an aesthetic, on-brand backdrop that acts as
 * a placeholder for future product promotions. All functional content lives in
 * the Files, Tools, Scanner and Settings tabs.
 */
export default function HomeScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={["#ffffff", C.surfaceAlt, C.blue50]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative gradient orbs */}
      <LinearGradient
        colors={[C.blue200, "rgba(191,219,254,0)"]}
        style={[styles.orb, styles.orbTop]}
      />
      <LinearGradient
        colors={[C.blue100, "rgba(219,234,254,0)"]}
        style={[styles.orb, styles.orbBottom]}
      />

      <View style={[styles.content, { paddingTop: insets.top }]}>
        <View style={[styles.logoMark, heroShadow]}>
          <Feather name="file-text" size={40} color="#fff" />
        </View>
        <Text style={styles.title}>PDF Convert Master</Text>
        <Text style={styles.tagline}>Convert · Scan · Organize</Text>

        <View style={styles.comingSoon}>
          <Feather name="zap" size={13} color={C.primary} />
          <Text style={styles.comingSoonText}>More coming soon</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background },
  orb: { position: "absolute", borderRadius: 999 },
  orbTop: { width: 360, height: 360, top: -120, right: -120 },
  orbBottom: { width: 320, height: 320, bottom: -100, left: -110 },
  content: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 6 },
  logoMark: {
    width: 88,
    height: 88,
    borderRadius: 26,
    backgroundColor: C.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 22,
  },
  title: { fontSize: 28, color: C.foreground, fontFamily: fonts.headingBold, textAlign: "center" },
  tagline: {
    fontSize: 15,
    color: C.mutedForeground,
    fontFamily: fonts.bodyMedium,
    letterSpacing: 0.3,
    marginTop: 2,
  },
  comingSoon: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: C.blue50,
    borderWidth: 1,
    borderColor: C.blue100,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    marginTop: 28,
  },
  comingSoonText: { fontSize: 13, color: C.blue700, fontFamily: fonts.bodySemibold },
});
