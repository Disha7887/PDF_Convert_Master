import {
  API_BASE_URL,
  POLL_INTERVAL_MS,
  POLL_MAX_ATTEMPTS,
  type ConvertJob,
} from "@/constants/api";
import { MOCK_CONVERT_STEP_MS, USE_MOCK_DATA } from "@/constants/config";
import { resolveSampleOutput } from "@/mocks/data";
import { getToolById } from "@/constants/tools";

/**
 * Network gateway. While `USE_MOCK_DATA` is true everything resolves locally and
 * NO request leaves the device. The real-backend fetch/poll implementation is
 * fully preserved below and re-activates automatically when the flag is false.
 */

export interface PickedFile {
  uri: string;
  name: string;
  size?: number;
  mimeType?: string;
}

export interface StartConversionResult {
  jobId: string;
}

export interface ConversionResult {
  status: "completed" | "failed";
  /** Bundled-sample key the screen resolves to a local asset (mock mode). */
  sampleKey?: "pdf" | "image" | "text";
  outputFilename?: string;
  /** Real backend download URL (live mode). */
  downloadUrl?: string;
  error?: string;
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

// ── Real backend implementation (preserved, gated) ──────────────────────────
async function realStartConversion(
  serverToolType: string,
  files: PickedFile[],
): Promise<StartConversionResult> {
  const form = new FormData();
  form.append("toolType", serverToolType);
  files.forEach((f) => {
    // React Native FormData accepts a { uri, name, type } file object, which the
    // DOM `FormData` typings don't model — cast to satisfy TypeScript.
    form.append("files", {
      uri: f.uri,
      name: f.name,
      type: f.mimeType ?? "application/octet-stream",
    } as unknown as Blob);
  });
  const res = await fetch(`${API_BASE_URL}/convert`, { method: "POST", body: form });
  if (!res.ok) throw new Error(`Conversion request failed (${res.status})`);
  const data = await res.json();
  return { jobId: data.jobId ?? data.data?.jobId };
}

async function realPollJob(jobId: string): Promise<ConvertJob> {
  for (let attempt = 0; attempt < POLL_MAX_ATTEMPTS; attempt++) {
    const res = await fetch(`${API_BASE_URL}/jobs/${jobId}`);
    if (res.ok) {
      const job: ConvertJob = await res.json();
      if (job.status === "completed" || job.status === "failed") return job;
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
  throw new Error("Conversion timed out");
}

// ── Public API ───────────────────────────────────────────────────────────────
export async function startConversion(
  toolId: string,
  files: PickedFile[],
): Promise<StartConversionResult> {
  if (USE_MOCK_DATA) return mockStartConversion(toolId);
  const tool = getToolById(toolId);
  return realStartConversion(tool?.serverToolType ?? toolId, files);
}

export async function getConversionResult(
  toolId: string,
  jobId: string,
  baseName: string,
): Promise<ConversionResult> {
  if (USE_MOCK_DATA) return mockGetResult(toolId, baseName);
  const job = await realPollJob(jobId);
  return {
    status: job.status === "completed" ? "completed" : "failed",
    downloadUrl: job.downloadUrl,
    outputFilename: job.outputFilename,
    error: job.error,
  };
}
