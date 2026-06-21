import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  Platform,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

/**
 * Liquid-glass surface, inspired by Apple's iOS "Liquid Glass" material.
 *
 * It layers, bottom-to-top:
 *   1. a frosted `BlurView` that refracts whatever sits behind it,
 *   2. a translucent fill so foreground content stays legible,
 *   3. a diagonal specular sheen (the glossy highlight), and
 *   4. a bright hairline edge.
 *
 * Unlike `expo-glass-effect` (native, iOS 26+ only) this works everywhere —
 * Android, web and Expo Go — so the glossy look is consistent across devices.
 */
export type GlassTone = "light" | "tinted";

interface GlassSurfaceProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Corner radius (kept generous for the soft "squircle" feel). */
  radius?: number;
  /** Blur strength of the frosted base. */
  intensity?: number;
  /** `light` = clear white glass, `tinted` = faint coral-tinted glass. */
  tone?: GlassTone;
  /** Render the bright diagonal specular sheen. */
  sheen?: boolean;
  /** Drop the soft elevation shadow (e.g. for flush surfaces). */
  flat?: boolean;
}

export function GlassSurface({
  children,
  style,
  radius = 20,
  intensity = 42,
  tone = "light",
  sheen = true,
  flat = false,
}: GlassSurfaceProps) {
  const fill =
    tone === "tinted" ? "rgba(255,243,242,0.55)" : "rgba(255,255,255,0.52)";

  return (
    <View style={[!flat && styles.shadow, { borderRadius: radius }, style]}>
      <View style={[styles.clip, { borderRadius: radius }]}>
        <BlurView
          intensity={intensity}
          tint="light"
          experimentalBlurMethod={
            Platform.OS === "android" ? "dimezisBlurView" : undefined
          }
          style={StyleSheet.absoluteFill}
        />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: fill }]} />
        {sheen && (
          <LinearGradient
            pointerEvents="none"
            colors={[
              "rgba(255,255,255,0.75)",
              "rgba(255,255,255,0.04)",
              "rgba(255,255,255,0.22)",
            ]}
            locations={[0, 0.55, 1]}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        )}
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: Platform.select({
    ios: {
      shadowColor: "#0f172a",
      shadowOpacity: 0.12,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 10 },
    },
    android: { elevation: 5 },
    default: {},
  }) as ViewStyle,
  clip: {
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.6)",
    backgroundColor: "transparent",
  },
});

export default GlassSurface;
