const domain = process.env["EXPO_PUBLIC_DOMAIN"];

if (!domain) {
  console.warn(
    "[pdf-convert-mobile] EXPO_PUBLIC_DOMAIN is not set. " +
    "Set it in your workflow env or .env file to point at your deployed backend."
  );
}

export const API_BASE_URL = domain
  ? `https://${domain}/api`
  : "";

export const POLL_INTERVAL_MS = 1500;
export const POLL_MAX_ATTEMPTS = 120;

export interface ConvertJob {
  jobId: string;
  status: "pending" | "processing" | "completed" | "failed";
  downloadUrl?: string;
  error?: string;
  outputFilename?: string;
}
