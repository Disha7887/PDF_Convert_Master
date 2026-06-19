import { Platform } from "react-native";

/**
 * Typography tokens mirroring the web app: Inter for body, Poppins for headings.
 * The matching font weights are loaded in `app/_layout.tsx`.
 */
export const fonts = {
  body: "Inter_400Regular",
  bodyMedium: "Inter_500Medium",
  bodySemibold: "Inter_600SemiBold",
  bodyBold: "Inter_700Bold",
  heading: "Poppins_400Regular",
  headingSemibold: "Poppins_600SemiBold",
  headingBold: "Poppins_700Bold",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

/** Standard horizontal screen gutter. */
export const SCREEN_PADDING = 20;

/** Cross-platform card shadow (subtle, matches web elevation). */
export const cardShadow = Platform.select({
  ios: {
    shadowColor: "#0f172a",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  android: { elevation: 2 },
  default: {},
});

/** Stronger shadow for the primary CTA / hero card. */
export const heroShadow = Platform.select({
  ios: {
    shadowColor: "#2563eb",
    shadowOpacity: 0.18,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
  },
  android: { elevation: 6 },
  default: {},
});
