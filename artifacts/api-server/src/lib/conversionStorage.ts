/**
 * Durable storage for converted output files.
 *
 * Converted buffers used to live only in an in-memory Map that was purged the
 * moment a file was downloaded, so a user could never re-download their result.
 * This module persists each completed job's output to Replit object storage
 * (GCS) under a deterministic key, so downloads work anytime — even after the
 * server restarts or the in-memory copy is gone.
 */
import { objectStorageClient, ObjectStorageService } from "./objectStorage";

const svc = new ObjectStorageService();

/** Splits the private object dir (`/<bucket>/<base...>`) into bucket + base. */
function parsePrivateDir(): { bucketName: string; base: string } {
  let dir = svc.getPrivateObjectDir();
  if (dir.startsWith("/")) dir = dir.slice(1);
  const parts = dir.split("/").filter((p) => p.length > 0);
  const bucketName = parts[0];
  const base = parts.slice(1).join("/");
  return { bucketName, base };
}

function objectNameFor(jobId: number): string {
  const { base } = parsePrivateDir();
  return base ? `${base}/conversions/${jobId}` : `conversions/${jobId}`;
}

/** Uploads a converted output buffer for a job. Overwrites any existing copy. */
export async function saveConvertedFile(
  jobId: number,
  buffer: Buffer,
  contentType: string,
): Promise<void> {
  const { bucketName } = parsePrivateDir();
  const file = objectStorageClient.bucket(bucketName).file(objectNameFor(jobId));
  await file.save(buffer, {
    resumable: false,
    contentType,
    metadata: { contentType },
  });
}

/** Fetches a job's persisted output, or null if it was never stored. */
export async function getConvertedFile(
  jobId: number,
): Promise<{ buffer: Buffer; contentType: string } | null> {
  const { bucketName } = parsePrivateDir();
  const file = objectStorageClient.bucket(bucketName).file(objectNameFor(jobId));
  const [exists] = await file.exists();
  if (!exists) return null;
  const [metadata] = await file.getMetadata();
  const [buffer] = await file.download();
  return {
    buffer,
    contentType: (metadata.contentType as string) || "application/octet-stream",
  };
}

/** Best-effort delete of a job's persisted output. */
export async function deleteConvertedFile(jobId: number): Promise<void> {
  const { bucketName } = parsePrivateDir();
  await objectStorageClient
    .bucket(bucketName)
    .file(objectNameFor(jobId))
    .delete({ ignoreNotFound: true });
}
