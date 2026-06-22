/**
 * Durable storage for user profile pictures (avatars).
 *
 * Each user's avatar is stored in Replit object storage (GCS) under a
 * deterministic key, so it survives server restarts and is re-fetchable
 * anytime. Avatars are served back to clients through an api-server route
 * that streams the stored bytes (see `/api/auth/avatar/:userId`).
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

function objectNameFor(userId: string): string {
  const { base } = parsePrivateDir();
  return base ? `${base}/avatars/${userId}` : `avatars/${userId}`;
}

/** Uploads a user's avatar image. Overwrites any existing copy. */
export async function saveAvatar(
  userId: string,
  buffer: Buffer,
  contentType: string,
): Promise<void> {
  const { bucketName } = parsePrivateDir();
  const file = objectStorageClient.bucket(bucketName).file(objectNameFor(userId));
  await file.save(buffer, {
    resumable: false,
    contentType,
    metadata: { contentType },
  });
}

/** Fetches a user's stored avatar, or null if none was ever saved. */
export async function getAvatar(
  userId: string,
): Promise<{ buffer: Buffer; contentType: string } | null> {
  const { bucketName } = parsePrivateDir();
  const file = objectStorageClient.bucket(bucketName).file(objectNameFor(userId));
  const [exists] = await file.exists();
  if (!exists) return null;
  const [metadata] = await file.getMetadata();
  const [buffer] = await file.download();
  return {
    buffer,
    contentType: (metadata.contentType as string) || "application/octet-stream",
  };
}
