/**
 * Canonical route paths for the mobile app. Centralised so every screen links
 * to the same paths (expo-router is file-based — these mirror the file tree).
 */
export const ROUTES = {
  // Tabs
  home: "/",
  files: "/files",
  tools: "/tools",
  scanner: "/scanner",
  settings: "/settings",

  // Stack — tool flow
  convert: (toolId: string) => `/convert/${toolId}`,
  pdfEditor: "/editor/pdf",
  imageEditor: "/editor/image",
  history: "/history",

  // Marketing / legal
  pricing: "/marketing/pricing",
  about: "/marketing/about",
  features: "/marketing/features",
  learnMore: "/marketing/learn-more",
  support: "/marketing/support",
  contact: "/marketing/contact",
  terms: "/marketing/terms",
  privacy: "/marketing/privacy",

  // Auth
  signIn: "/auth/sign-in",
  signUp: "/auth/sign-up",

  // Dashboard suite (reachable from Settings)
  dashboardHome: "/dashboard",
  usage: "/dashboard/usage",
  apiSetup: "/dashboard/api-setup",
  apiReference: "/dashboard/api-reference",
  managePlans: "/dashboard/manage-plans",
  liveTools: "/dashboard/live-tools",
} as const;
