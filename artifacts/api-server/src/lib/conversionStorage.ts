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

/** Best-effort delete of a job's persisted output. */
export async function deleteConvertedFile(jobId: number): Promise<void> {
  await deleteObject(objectNameFor(jobId));
}
