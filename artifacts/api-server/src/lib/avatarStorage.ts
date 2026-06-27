/**
 * Durable storage for user profile pictures (avatars).
 *
 * Each user's avatar is stored in S3 under a deterministic key, so it survives
 * server restarts and is re-fetchable anytime. Avatars are served back to
 * clients through an api-server route that streams the stored bytes (see
 * `/api/auth/avatar/:userId`).
 */
import { putObject, getObject, deleteObject } from "./s3Storage";

function objectNameFor(userId: string): string {
  return `avatars/${userId}`;
}

/** Uploads a user's avatar image. Overwrites any existing copy. */
export async function saveAvatar(
  userId: string,
  buffer: Buffer,
  contentType: string,
): Promise<void> {
  await putObject(objectNameFor(userId), buffer, contentType);
}

/** Fetches a user's stored avatar, or null if none was ever saved. */
export async function getAvatar(
  userId: string,
): Promise<{ buffer: Buffer; contentType: string } | null> {
  return getObject(objectNameFor(userId));
}

/** Removes a user's avatar from storage. Idempotent (no-op if none exists). */
export async function deleteAvatar(userId: string): Promise<void> {
  await deleteObject(objectNameFor(userId));
}
