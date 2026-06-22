// Profile / account API helpers for the web app. These mirror the mobile
// `services/profile.ts` and talk to the same api-server auth endpoints. All
// authed calls go through `authedFetch` so the JWT is attached automatically.
import { authedFetch } from "@/lib/authedFetch";
import type { User } from "@workspace/db";

interface ApiEnvelope<T> {
  success: boolean;
  error?: string;
  message?: string;
  data?: T;
}

async function parse<T>(res: Response): Promise<ApiEnvelope<T>> {
  let body: ApiEnvelope<T> | null = null;
  try {
    body = (await res.json()) as ApiEnvelope<T>;
  } catch {
    body = null;
  }
  if (!res.ok || !body || body.success === false) {
    const message = body?.error || `${res.status}: ${res.statusText}`;
    throw new Error(message);
  }
  return body;
}

/** Update the signed-in user's name and/or email. Returns the fresh user + token. */
export async function updateProfile(updates: {
  name?: string;
  email?: string;
}): Promise<{ user: User; token: string }> {
  const res = await authedFetch("/api/auth/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  const body = await parse<{ user: User; token: string }>(res);
  return body.data!;
}

/** Change the signed-in user's password (requires the current password). */
export async function changePassword(input: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  const res = await authedFetch("/api/auth/change-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  await parse(res);
}

/** Upload a new avatar image (browser File). Returns the updated user. */
export async function uploadAvatar(file: File): Promise<{ user: User; profilePictureUrl: string }> {
  const form = new FormData();
  form.append("avatar", file);
  const res = await authedFetch("/api/auth/avatar", {
    method: "POST",
    body: form,
  });
  const body = await parse<{ user: User; profilePictureUrl: string }>(res);
  return body.data!;
}

/** Request a password reset code by email. Always resolves (no account leak). */
export async function requestPasswordReset(email: string): Promise<string | undefined> {
  const res = await fetch("/api/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const body = await parse<unknown>(res);
  return body.message;
}

/** Complete a password reset with the emailed code. */
export async function resetPassword(input: {
  email: string;
  code: string;
  newPassword: string;
}): Promise<void> {
  const res = await fetch("/api/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  await parse(res);
}
