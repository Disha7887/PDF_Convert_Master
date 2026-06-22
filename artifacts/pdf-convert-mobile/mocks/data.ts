/**
 * Local mock-data layer. Powers the entire app when `USE_MOCK_DATA` is true so
 * it runs fully offline with no backend, network or real auth. Shapes mirror
 * the web app's API responses closely enough for screen parity.
 */

export interface MockUser {
  id: string;
  email: string;
  name: string;
  plan: "Free" | "Pro" | "Business";
  apiKey: string;
  createdAt: string;
  avatarInitials: string;
  /** URL (origin-relative) of the user's uploaded profile picture, if any. */
  profilePictureUrl?: string | null;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  period: "month" | "year";
  description: string;
  conversionsLimit: number | "Unlimited";
  maxFileSizeMB: number;
  popular: boolean;
  features: string[];
  cta: string;
}

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  prefix: string;
  createdAt: string;
  lastUsedAt: string | null;
  status: "active" | "revoked";
  requests: number;
}

export interface Job {
  id: string;
  toolId: string;
  toolTitle: string;
  fileName: string;
  outputFormat: string;
  status: "completed" | "processing" | "failed" | "queued";
  createdAt: string;
  fileSizeKB: number;
  durationSec: number;
}

export interface ToolUsage {
  toolId: string;
  toolTitle: string;
  count: number;
}

export interface DailyUsage {
  date: string;
  count: number;
}

export interface CategoryUsage {
  category: string;
  count: number;
}

export interface UsageStats {
  totalConversions: number;
  conversionsThisMonth: number;
  conversionsToday: number;
  apiCalls: number;
  successRate: number;
  avgProcessingTimeSec: number;
  storageUsedMB: number;
  storageLimitMB: number;
  byTool: ToolUsage[];
  byDay: DailyUsage[];
  byCategory: CategoryUsage[];
}

export interface DashboardStats {
  totalConversions: number;
  conversionsThisMonth: number;
  apiCalls: number;
  successRate: number;
  activeApiKeys: number;
  storageUsedMB: number;
  recentJobs: Job[];
}

// ─── Demo user ─────────────────────────────────────────────────────────────
export const DEMO_USER: MockUser = {
  id: "usr_demo_001",
  email: "demo@pdfconvertmaster.com",
  name: "Demo User",
  plan: "Pro",
  apiKey: "pk_live_demo_5f3a9c2b8e1d4a6f",
  createdAt: "2025-11-02T09:30:00.000Z",
  avatarInitials: "DU",
  profilePictureUrl: null,
};

// Accepts ANY email/password in mock mode; this is the credential shown as a hint.
export const DEMO_CREDENTIALS = {
  email: "demo@pdfconvertmaster.com",
  password: "demo1234",
};

// ─── Plans ───────────────────────────────────────────────────────────────
export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    period: "month",
    description: "For occasional conversions and trying things out.",
    conversionsLimit: 10,
    maxFileSizeMB: 25,
    popular: false,
    cta: "Get Started",
    features: [
      "10 conversions per month",
      "Files up to 25 MB",
      "All 27 conversion tools",
      "Standard processing speed",
      "Community support",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 9.99,
    period: "month",
    description: "For professionals who convert every day.",
    conversionsLimit: "Unlimited",
    maxFileSizeMB: 100,
    popular: true,
    cta: "Upgrade to Pro",
    features: [
      "Unlimited conversions",
      "Files up to 100 MB",
      "All 27 conversion tools",
      "Priority processing",
      "API access (10k calls/mo)",
      "Email support",
    ],
  },
  {
    id: "business",
    name: "Business",
    price: 29.99,
    period: "month",
    description: "For teams that need scale, control and an SLA.",
    conversionsLimit: "Unlimited",
    maxFileSizeMB: 500,
    popular: false,
    cta: "Contact Sales",
    features: [
      "Everything in Pro",
      "Files up to 500 MB",
      "Unlimited API access",
      "Team management",
      "Dedicated support & SLA",
      "Custom integrations",
    ],
  },
];

// ─── API keys ──────────────────────────────────────────────────────────────
export const API_KEYS: ApiKey[] = [
  {
    id: "key_001",
    name: "Production",
    key: "pk_live_demo_5f3a9c2b8e1d4a6f",
    prefix: "pk_live_demo",
    createdAt: "2025-11-04T10:00:00.000Z",
    lastUsedAt: "2026-06-18T14:22:00.000Z",
    status: "active",
    requests: 18432,
  },
  {
    id: "key_002",
    name: "Staging",
    key: "pk_test_demo_9a1b7c4d2e8f0a3c",
    prefix: "pk_test_demo",
    createdAt: "2026-01-12T08:15:00.000Z",
    lastUsedAt: "2026-06-10T09:41:00.000Z",
    status: "active",
    requests: 2741,
  },
];

// ─── Jobs / history ──────────────────────────────────────────────────────
export const RECENT_JOBS: Job[] = [
  {
    id: "job_2051",
    toolId: "pdf-to-word",
    toolTitle: "PDF to Word",
    fileName: "Q2-financial-report.pdf",
    outputFormat: "DOCX",
    status: "completed",
    createdAt: "2026-06-19T08:12:00.000Z",
    fileSizeKB: 2480,
    durationSec: 4,
  },
  {
    id: "job_2050",
    toolId: "merge-pdfs",
    toolTitle: "PDF Merger",
    fileName: "contract-bundle (3 files)",
    outputFormat: "Merged PDF",
    status: "completed",
    createdAt: "2026-06-19T07:55:00.000Z",
    fileSizeKB: 5310,
    durationSec: 6,
  },
  {
    id: "job_2049",
    toolId: "compress-pdf",
    toolTitle: "Compress PDF",
    fileName: "scanned-deck.pdf",
    outputFormat: "Compressed PDF",
    status: "completed",
    createdAt: "2026-06-18T17:20:00.000Z",
    fileSizeKB: 880,
    durationSec: 3,
  },
  {
    id: "job_2048",
    toolId: "remove-background",
    toolTitle: "Remove Background",
    fileName: "product-shot.png",
    outputFormat: "PNG with Transparency",
    status: "completed",
    createdAt: "2026-06-18T15:02:00.000Z",
    fileSizeKB: 1240,
    durationSec: 5,
  },
  {
    id: "job_2047",
    toolId: "pdf-to-excel",
    toolTitle: "PDF to Excel",
    fileName: "inventory.pdf",
    outputFormat: "XLSX",
    status: "failed",
    createdAt: "2026-06-18T11:48:00.000Z",
    fileSizeKB: 0,
    durationSec: 0,
  },
  {
    id: "job_2046",
    toolId: "images-to-pdf",
    toolTitle: "Images to PDF",
    fileName: "receipts (5 files)",
    outputFormat: "PDF",
    status: "completed",
    createdAt: "2026-06-17T19:33:00.000Z",
    fileSizeKB: 3120,
    durationSec: 7,
  },
];

// ─── Usage statistics ──────────────────────────────────────────────────────
export const USAGE_STATS: UsageStats = {
  totalConversions: 1284,
  conversionsThisMonth: 213,
  conversionsToday: 9,
  apiCalls: 21173,
  successRate: 98.6,
  avgProcessingTimeSec: 4.2,
  storageUsedMB: 642,
  storageLimitMB: 2048,
  byTool: [
    { toolId: "pdf-to-word", toolTitle: "PDF to Word", count: 312 },
    { toolId: "merge-pdfs", toolTitle: "PDF Merger", count: 198 },
    { toolId: "compress-pdf", toolTitle: "Compress PDF", count: 176 },
    { toolId: "pdf-to-excel", toolTitle: "PDF to Excel", count: 143 },
    { toolId: "images-to-pdf", toolTitle: "Images to PDF", count: 121 },
    { toolId: "remove-background", toolTitle: "Remove Background", count: 96 },
    { toolId: "split-pdf", toolTitle: "PDF Splitter", count: 88 },
  ],
  byDay: [
    { date: "Mon", count: 24 },
    { date: "Tue", count: 38 },
    { date: "Wed", count: 31 },
    { date: "Thu", count: 45 },
    { date: "Fri", count: 52 },
    { date: "Sat", count: 18 },
    { date: "Sun", count: 12 },
  ],
  byCategory: [
    { category: "Convert", count: 712 },
    { category: "Image Tools", count: 268 },
    { category: "Organize", count: 196 },
    { category: "Edit", count: 108 },
  ],
};

export const DASHBOARD_STATS: DashboardStats = {
  totalConversions: USAGE_STATS.totalConversions,
  conversionsThisMonth: USAGE_STATS.conversionsThisMonth,
  apiCalls: USAGE_STATS.apiCalls,
  successRate: USAGE_STATS.successRate,
  activeApiKeys: API_KEYS.filter((k) => k.status === "active").length,
  storageUsedMB: USAGE_STATS.storageUsedMB,
  recentJobs: RECENT_JOBS,
};

// ─── Marketing content (testimonials / features / faq / stats) ───────────────
export interface Testimonial {
  name: string;
  role: string;
  quote: string;
  initials: string;
}

export const TESTIMONIALS: Testimonial[] = [
  {
    name: "Sarah Mitchell",
    role: "Operations Manager",
    quote:
      "PDF Genius replaced three separate tools we used to pay for. The conversions are flawless and lightning fast.",
    initials: "SM",
  },
  {
    name: "James Carter",
    role: "Freelance Designer",
    quote:
      "The image tools alone are worth it. Removing backgrounds and resizing in seconds saves me hours every week.",
    initials: "JC",
  },
  {
    name: "Priya Nair",
    role: "Legal Assistant",
    quote:
      "Merging, signing and watermarking contracts has never been this simple. It just works, every single time.",
    initials: "PN",
  },
];

export interface HomeStat {
  value: string;
  label: string;
}

export const HOME_STATS: HomeStat[] = [
  { value: "27", label: "Conversion tools" },
  { value: "10M+", label: "Files converted" },
  { value: "98.6%", label: "Success rate" },
  { value: "256-bit", label: "SSL encryption" },
];

// ─── Bundled sample outputs (mock conversion results) ───────────────────────
// `pdf` and `image` are real bundled assets (both resolve via Metro's default
// asset extensions). Text outputs are generated on-device at conversion time
// (see app/convert/[toolId].tsx + the editors), so no `.txt` asset is bundled —
// requiring a `.txt` file would break the Metro web bundle.
export const SAMPLE_ASSETS = {
  pdf: require("../assets/samples/sample-document.pdf"),
  image: require("../assets/samples/sample-image.png"),
} as const;

export type SampleKey = "pdf" | "image" | "text";

/** Picks the bundled sample + output extension for a tool's output format. */
export function resolveSampleOutput(outputFormat: string): {
  sampleKey: SampleKey;
  extension: string;
} {
  const fmt = outputFormat.toLowerCase();
  if (fmt.includes("docx") || fmt.includes("word")) return { sampleKey: "pdf", extension: "docx" };
  if (fmt.includes("xlsx") || fmt.includes("excel")) return { sampleKey: "pdf", extension: "xlsx" };
  if (fmt.includes("pptx") || fmt.includes("powerpoint")) return { sampleKey: "pdf", extension: "pptx" };
  if (fmt.includes("text")) return { sampleKey: "text", extension: "txt" };
  if (
    fmt.includes("png") ||
    fmt.includes("jpg") ||
    fmt.includes("image") ||
    fmt.includes("format") ||
    fmt.includes("transparency") ||
    fmt.includes("high-res") ||
    fmt.includes("same")
  ) {
    return { sampleKey: "image", extension: fmt.includes("png") ? "png" : "jpg" };
  }
  return { sampleKey: "pdf", extension: "pdf" };
}
