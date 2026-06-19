/**
 * Color tokens mirroring the web app's theme (`src/index.css`).
 * Brand: white surfaces + vivid blue #2563eb. Light-only by design.
 */
const colors = {
  light: {
    text: "#1c2434",
    tint: "#2563eb",

    background: "#ffffff",
    foreground: "#1c2434",

    card: "#ffffff",
    cardForeground: "#1c2434",

    popover: "#ffffff",
    popoverForeground: "#1c2434",

    primary: "#2563eb",
    primaryForeground: "#ffffff",

    secondary: "#eff6ff",
    secondaryForeground: "#1e3a8a",

    muted: "#f5f7fb",
    mutedForeground: "#6b7280",

    accent: "#eff6ff",
    accentForeground: "#1e40af",

    destructive: "#ef4444",
    destructiveForeground: "#ffffff",

    success: "#22c55e",
    successForeground: "#ffffff",

    warning: "#f59e0b",
    warningForeground: "#ffffff",

    border: "#e2e8f0",
    input: "#e2e8f0",
    ring: "#2563eb",

    // Brand blue scale (used by tool icon tiles, badges, gradients)
    blue50: "#eff6ff",
    blue100: "#dbeafe",
    blue200: "#bfdbfe",
    blue500: "#3b82f6",
    blue600: "#2563eb",
    blue700: "#1d4ed8",
    blue900: "#1e3a8a",

    // Page background tint used by hero/marketing sections
    surfaceAlt: "#f8faff",

    // Chart palette for dashboard/usage screens
    chart1: "#2563eb",
    chart2: "#60a5fa",
    chart3: "#1e40af",
    chart4: "#93c5fd",
    chart5: "#3b82f6",
  },

  radius: 12,
};

export type Palette = typeof colors.light & { radius: number };

export default colors;
