import React from "react";
import {
  Platform,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import colors from "@/constants/colors";

/**
 * Solid card surface.
 *
 * Renders a flat, static-coloured panel with a subtle border and (optional)
 * soft elevation shadow — no frosted blur and no glossy specular sheen. Kept
 * named `GlassSurface` so existing call sites don't need to change.
 */
export type GlassTone = "light" | "tinted";

const C = colors.light;

interface GlassSurfaceProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Corner radius (kept generous for the soft "squircle" feel). */
  radius?: number;
  /** Kept for API compatibility; no longer used (surface is solid). */
  intensity?: number;
  /** `light` = white surface, `tinted` = faint coral-tinted surface. */
  tone?: GlassTone;
  /** Kept for API compatibility; no longer used (no glossy sheen). */
  sheen?: boolean;
  /** Drop the soft elevation shadow (e.g. for flush surfaces). */
  flat?: boolean;
}

export function GlassSurface({
  children,
  style,
  radius = 20,
  tone = "light",
  flat = false,
}: GlassSurfaceProps) {
  const fill = tone === "tinted" ? C.secondary : "#ffffff";

  return (
    <View style={[!flat && styles.shadow, { borderRadius: radius }, style]}>
      <View style={[styles.clip, { borderRadius: radius, backgroundColor: fill }]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: Platform.select({
    ios: {
      shadowColor: "#0f172a",
      shadowOpacity: 0.08,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 8 },
    },
    android: { elevation: 3 },
    default: {},
  }) as ViewStyle,
  clip: {
    overflow: "hidden",
    borderWidth: 1,
    borderColor: C.border,
  },
});

export default GlassSurface;
