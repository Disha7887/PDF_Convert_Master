/**
 * Color tokens mirroring the web app's theme (`src/index.css`).
 * Brand: white page background + soft-gray cards + coral #f7433d. Light-only by design.
 */
const colors = {
  light: {
    text: "#1c2434",
    tint: "#f7433d",

    background: "#ffffff",
    foreground: "#1c2434",

    card: "#f3f4f6",
    cardForeground: "#1c2434",

    popover: "#ffffff",
    popoverForeground: "#1c2434",

    primary: "#f7433d",
    primaryForeground: "#ffffff",

    secondary: "#fff1f0",
    secondaryForeground: "#8f1a16",

    muted: "#f5f7fb",
    mutedForeground: "#6b7280",

    accent: "#fff1f0",
    accentForeground: "#b9211c",

    destructive: "#ef4444",
    destructiveForeground: "#ffffff",

    success: "#22c55e",
    successForeground: "#ffffff",

    warning: "#f59e0b",
    warningForeground: "#ffffff",

    border: "#e2e8f0",
    input: "#e2e8f0",
    ring: "#f7433d",

    // Brand blue scale (used by tool icon tiles, badges, gradients)
    blue50: "#fff1f0",
    blue100: "#ffe1de",
    blue200: "#fecdc8",
    blue500: "#fb5d52",
    blue600: "#f7433d",
    blue700: "#e02d27",
    blue900: "#8f1a16",

    // Page background tint used by hero/marketing sections
    surfaceAlt: "#fff7f6",

    // Chart palette for dashboard/usage screens
    chart1: "#f7433d",
    chart2: "#f97a70",
    chart3: "#b9211c",
    chart4: "#fcaaa3",
    chart5: "#fb5d52",
  },

  radius: 12,
};

export type Palette = typeof colors.light & { radius: number };

export default colors;
