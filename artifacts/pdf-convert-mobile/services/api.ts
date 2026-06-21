import { Platform } from "react-native";

import {
  API_BASE_URL,
  POLL_INTERVAL_MS,
  POLL_MAX_ATTEMPTS,
  type ConvertJob,
} from "@/constants/api";
import {
  MOCK_CONVERT_STEP_MS,
  USE_MOCK_DATA,
  USE_REAL_CONVERSIONS,
} from "@/constants/config";
import { resolveSampleOutput } from "@/mocks/data";
import { getToolById, type Tool } from "@/constants/tools";
import { getAuthToken } from "@/services/authToken";

/**
 * Network gateway for the CONVERT tools.
 *
 * Conversions hit the real api-server backend (the same API the web app uses)
 * whenever `USE_REAL_CONVERSIONS` is true — independently of `USE_MOCK_DATA`,
 * which only governs auth/dashboard/marketing. When real conversions are
 * disabled the bundled-sample mock path below takes over so the app still runs
 * fully offline.
 */

export interface PickedFile {
  uri: string;
  name: string;
  size?: number;
  mimeType?: string;
}

/** Per-tool conversion options mirrored from the web app. */
export interface ConversionOptions {
  /** Target format for "Convert Image Format" (e.g. "png", "jpg", "webp"). */
  outputFormat?: string;
  /** Output quality 10-100 for "Compress Images". */
  quality?: number;
}

export interface StartConversionResult {
  jobId: string;
}

export interface ConversionResult {
  status: "completed" | "failed";
  /** Bundled-sample key the screen resolves to a local asset (mock mode). */
  sampleKey?: "pdf" | "image" | "text";
  outputFilename?: string;
  /** Origin-relative backend download URL, e.g. "/api/download/42" (live mode). */
  downloadUrl?: string;
  /** OCR-recognized text, one entry per source page (OCR PDF tool only). */
  ocrPages?: string[];
  error?: string;
}

/** True when conversions should use the real backend instead of mock samples. */
function realConversionsEnabled(): boolean {
  return USE_REAL_CONVERSIONS || !USE_MOCK_DATA;
}

// ── Mock implementation ──────────────────────────────────────────────────────
async function mockStartConversion(toolId: string): Promise<StartConversionResult> {
  return new Promise((resolve) =>
    setTimeout(
      () => resolve({ jobId: `mock_${toolId}_${Date.now()}` }),
      MOCK_CONVERT_STEP_MS,
    ),
  );
}

async function mockGetResult(
  toolId: string,
  baseName: string,
): Promise<ConversionResult> {
  const tool = getToolById(toolId);
  const outputFormat = tool?.outputFormat ?? "PDF";
  const { sampleKey, extension } = resolveSampleOutput(outputFormat);
  const stem = baseName.replace(/\.[^./]+$/, "") || "output";
  return new Promise((resolve) =>
    setTimeout(
      () =>
        resolve({
          status: "completed",
          sampleKey,
          outputFilename: `${stem}.${extension}`,
        }),
      MOCK_CONVERT_STEP_MS,
    ),
  );
}

// ── Real backend implementation ─────────────────────────────────────────────

/**
 * Appends a picked file to a FormData under `field`. Browsers (Expo web) need a
 * real Blob fetched from the asset URI; native RN accepts the `{uri,name,type}`
 * shape directly (which the DOM FormData typings don't model — hence the cast).
 */
async function appendFile(
  form: FormData,
  field: string,
  f: PickedFile,
): Promise<void> {
  if (Platform.OS === "web") {
    const res = await fetch(f.uri);
    const blob = await res.blob();
    form.append(field, blob, f.name);
    return;
  }
  form.append(field, {
    uri: f.uri,
    name: f.name,
    type: f.mimeType ?? "application/octet-stream",
  } as unknown as Blob);
}

/**
 * Authorization header for conversion requests, when a user is signed in. The
 * backend's `optionalConversionAuth` attributes the job to that user so it shows
 * up in their dashboard / usage statistics. Anonymous conversions still work.
 */
function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function assertBackendConfigured(): void {
  if (!API_BASE_URL) {
    throw new Error(
      "The conversion backend isn't configured (EXPO_PUBLIC_DOMAIN is missing). " +
        "Set it to your server domain and reload the app.",
    );
  }
}

async function realStartConvert(
  serverToolType: string,
  file: PickedFile,
  options: ConversionOptions,
): Promise<StartConversionResult> {
  assertBackendConfigured();
  const form = new FormData();
  await appendFile(form, "file", file);
  form.append("toolType", serverToolType);
  form.append("fileName", file.name);
  if (typeof file.size === "number" && file.size > 0) {
    form.append("fileSize", String(file.size));
  }
  form.append("options", JSON.stringify(options ?? {}));

  const res = await fetch(`${API_BASE_URL}/convert`, { method: "POST", headers: authHeaders(), body: form });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.success || !data?.data?.jobId) {
    throw new Error(data?.error || `Conversion request failed (${res.status})`);
  }
  return { jobId: String(data.data.jobId) };
}

async function realStartMerge(files: PickedFile[]): Promise<StartConversionResult> {
  assertBackendConfigured();
  if (files.length < 2) {
    throw new Error("Select at least 2 PDF files to merge.");
  }
  const form = new FormData();
  for (const f of files) await appendFile(form, "files", f);

  const res = await fetch(`${API_BASE_URL}/merge-pdfs`, { method: "POST", headers: authHeaders(), body: form });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.success || !data?.data?.jobId) {
    throw new Error(data?.error || `Merge request failed (${res.status})`);
  }
  return { jobId: String(data.data.jobId) };
}

async function realPollJob(jobId: string): Promise<ConvertJob> {
  assertBackendConfigured();
  for (let attempt = 0; attempt < POLL_MAX_ATTEMPTS; attempt++) {
    const res = await fetch(`${API_BASE_URL}/jobs/${jobId}`);
    if (res.ok) {
      const payload = await res.json().catch(() => null);
      const job = payload?.data;
      if (payload?.success && job) {
        if (job.status === "completed" || job.status === "failed") {
          return {
            jobId: String(job.jobId),
            status: job.status,
            downloadUrl: job.downloadUrl,
            outputFilename: job.outputFilename ?? undefined,
            error: job.errorMessage ?? undefined,
          };
        }
      }
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
  throw new Error("Conversion timed out. Please try again.");
}

/** Fetches the per-page OCR text for a completed OCR job, if available. */
async function realFetchOcrText(jobId: string): Promise<string[] | undefined> {
  try {
    const res = await fetch(`${API_BASE_URL}/ocr-text/${jobId}`);
    if (!res.ok) return undefined;
    const payload = await res.json().catch(() => null);
    const pages = payload?.data?.pages;
    return Array.isArray(pages) ? pages : undefined;
  } catch {
    return undefined;
  }
}

// ── Public API ───────────────────────────────────────────────────────────────
export async function startConversion(
  toolId: string,
  files: PickedFile[],
  options: ConversionOptions = {},
): Promise<StartConversionResult> {
  const tool: Tool | undefined = getToolById(toolId);
  if (!realConversionsEnabled()) return mockStartConversion(toolId);

  if (files.length === 0) throw new Error("No file selected.");
  if (tool?.isMerge) return realStartMerge(files);
  return realStartConvert(tool?.serverToolType ?? toolId, files[0], options);
}

export async function getConversionResult(
  toolId: string,
  jobId: string,
  baseName: string,
): Promise<ConversionResult> {
  if (!realConversionsEnabled()) return mockGetResult(toolId, baseName);
  const job = await realPollJob(jobId);

  // The OCR PDF tool returns recognized text in addition to the searchable PDF.
  let ocrPages: string[] | undefined;
  if (job.status === "completed" && getToolById(toolId)?.serverToolType === "ocr_pdf") {
    ocrPages = await realFetchOcrText(jobId);
  }

  return {
    status: job.status === "completed" ? "completed" : "failed",
    downloadUrl: job.downloadUrl,
    outputFilename: job.outputFilename,
    ocrPages,
    error: job.error,
  };
}
