/**
 * Durable storage for converted output files.
 *
 * Converted buffers used to live only in an in-memory Map that was purged the
 * moment a file was downloaded, so a user could never re-download their result.
 * This module persists each completed job's output to S3 under a deterministic
 * key, so downloads work anytime — even after the server restarts or the
 * in-memory copy is gone.
 */
import { putObject, getObject, deleteObject } from "./s3Storage";

function objectNameFor(jobId: number): string {
  return `conversions/${jobId}`;
}

function ocrTextNameFor(jobId: number): string {
  return `conversions/${jobId}-ocr-text.json`;
}

/** Uploads a converted output buffer for a job. Overwrites any existing copy. */
export async function saveConvertedFile(
  jobId: number,
  buffer: Buffer,
  contentType: string,
): Promise<void> {
  await putObject(objectNameFor(jobId), buffer, contentType);
}

/** Fetches a job's persisted output, or null if it was never stored. */
export async function getConvertedFile(
  jobId: number,
): Promise<{ buffer: Buffer; contentType: string } | null> {
  return getObject(objectNameFor(jobId));
}

/**
 * Persists an OCR job's recognized text (per page) durably alongside the
 * searchable PDF. The text is what powers the TXT/DOC/HTML/Markdown download
 * options; keeping it in object storage means those formats can be rebuilt for
 * a later re-download — even after the in-memory copy is purged or the server
 * restarts. Without this, re-downloading an OCR ".txt" served the PDF bytes
 * under a .txt name, producing a broken file.
 */
export async function saveOcrText(
  jobId: number,
  pages: string[],
): Promise<void> {
  await putObject(
    ocrTextNameFor(jobId),
    Buffer.from(JSON.stringify({ pages }), "utf-8"),
    "application/json",
  );
}

/** Fetches a job's persisted OCR text pages, or null if none were stored. */
export async function getOcrText(jobId: number): Promise<string[] | null> {
  const stored = await getObject(ocrTextNameFor(jobId));
  if (!stored) return null;
  try {
    const parsed = JSON.parse(stored.buffer.toString("utf-8"));
    return Array.isArray(parsed?.pages) ? parsed.pages : null;
  } catch {
    return null;
  }
}

/** Best-effort delete of a job's persisted output (and any OCR text sidecar). */
export async function deleteConvertedFile(jobId: number): Promise<void> {
  await deleteObject(objectNameFor(jobId));
  // The OCR text sidecar is best-effort: a job without one is the common case,
  // and deleteObject is a no-op for a missing key.
  try {
    await deleteObject(ocrTextNameFor(jobId));
  } catch {
    // ignore — the primary output delete above is what matters
  }
}
