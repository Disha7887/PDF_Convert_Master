const domain = process.env["EXPO_PUBLIC_DOMAIN"];

if (!domain) {
  console.warn(
    "[pdf-convert-mobile] EXPO_PUBLIC_DOMAIN is not set. " +
    "Set it in your workflow env or .env file to point at your deployed backend."
  );
}

/** Origin of the shared proxy (no path). Download URLs are origin-relative. */
export const API_ORIGIN = domain ? `https://${domain}` : "";

export const API_BASE_URL = API_ORIGIN ? `${API_ORIGIN}/api` : "";

export const POLL_INTERVAL_MS = 1500;
export const POLL_MAX_ATTEMPTS = 120;

export interface ConvertJob {
  jobId: string;
  status: "pending" | "processing" | "completed" | "failed";
  downloadUrl?: string;
  error?: string;
  outputFilename?: string;
}
