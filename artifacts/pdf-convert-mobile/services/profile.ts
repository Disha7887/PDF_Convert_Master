/**
 * Profile + password gateway for the signed-in user.
 *
 * Talks to the real api-server auth endpoints (profile update, password change,
 * avatar upload, and the emailed password-reset flow). When `USE_MOCK_DATA` is
 * on, everything is served by `mockApi` so the app still runs fully offline.
 */
import { Platform } from "react-native";

import { API_BASE_URL, API_ORIGIN } from "@/constants/api";
import { USE_MOCK_DATA } from "@/constants/config";
import type { MockUser } from "@/mocks/data";
import { mockApi } from "@/mocks/mockApi";

export interface ProfileResult {
  success: boolean;
  error?: string;
  user?: MockUser;
  /** Reissued JWT (the server rotates it when email — a token claim — changes). */
  token?: string;
}

export interface AvatarResult extends ProfileResult {
  /** Origin-relative URL of the freshly uploaded avatar (cache-busted). */
  profilePictureUrl?: string;
}

function authHeaders(token: string | null): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function parseJson(res: Response): Promise<any> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

/** Update name and/or email. */
export async function updateProfile(
  token: string | null,
  updates: { name?: string; email?: string },
): Promise<ProfileResult> {
  if (USE_MOCK_DATA) {
    return mockApi.updateProfile(updates);
  }
  try {
    const res = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders(token) },
      body: JSON.stringify(updates),
    });
    const data = await parseJson(res);
    if (res.ok && data?.success) {
      return { success: true, user: data.data?.user, token: data.data?.token };
    }
    return { success: false, error: data?.error ?? "Could not update your profile." };
  } catch {
    return { success: false, error: "Network error. Please try again." };
  }
}

/** Change password (requires the current password). */
export async function changePassword(
  token: string | null,
  currentPassword: string,
  newPassword: string,
): Promise<{ success: boolean; error?: string }> {
  if (USE_MOCK_DATA) {
    return mockApi.changePassword(currentPassword, newPassword);
  }
  try {
    const res = await fetch(`${API_BASE_URL}/auth/change-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders(token) },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await parseJson(res);
    if (res.ok && data?.success) return { success: true };
    return { success: false, error: data?.error ?? "Could not change your password." };
  } catch {
    return { success: false, error: "Network error. Please try again." };
  }
}

/**
 * Upload a new profile picture from a local image URI. Browsers (Expo web) need
 * a real Blob fetched from the URI; native RN accepts the `{uri,name,type}`
 * shape directly (which the DOM FormData typings don't model — hence the cast).
 */
export async function uploadAvatar(
  token: string | null,
  uri: string,
): Promise<AvatarResult> {
  if (USE_MOCK_DATA) {
    return mockApi.uploadAvatar(uri);
  }
  try {
    const form = new FormData();
    if (Platform.OS === "web") {
      const blob = await (await fetch(uri)).blob();
      form.append("avatar", blob, "avatar.jpg");
    } else {
      form.append("avatar", {
        uri,
        name: "avatar.jpg",
        type: "image/jpeg",
      } as unknown as Blob);
    }
    const res = await fetch(`${API_BASE_URL}/auth/avatar`, {
      method: "POST",
      headers: authHeaders(token),
      body: form,
    });
    const data = await parseJson(res);
    if (res.ok && data?.success) {
      return {
        success: true,
        user: data.data?.user,
        profilePictureUrl: data.data?.profilePictureUrl,
      };
    }
    return { success: false, error: data?.error ?? "Could not upload your photo." };
  } catch {
    return { success: false, error: "Network error. Please try again." };
  }
}

/** Remove the signed-in user's profile picture. */
export async function deleteAvatar(
  token: string | null,
): Promise<ProfileResult> {
  if (USE_MOCK_DATA) {
    return mockApi.deleteAvatar();
  }
  try {
    const res = await fetch(`${API_BASE_URL}/auth/avatar`, {
      method: "DELETE",
      headers: authHeaders(token),
    });
    const data = await parseJson(res);
    if (res.ok && data?.success) {
      return { success: true, user: data.data?.user };
    }
    return { success: false, error: data?.error ?? "Could not remove your photo." };
  } catch {
    return { success: false, error: "Network error. Please try again." };
  }
}

/** Resolve a stored (origin-relative) avatar URL to a fully-qualified src. */
export function avatarSrc(url?: string | null): string | null {
  if (!url) return null;
  if (url.startsWith("http") || url.startsWith("data:")) return url;
  if (url.startsWith("mock-avatar://")) return null; // mock placeholder — no real image
  return `${API_ORIGIN}${url}`;
}

/** Request a password-reset code by email. Always resolves success (no account enumeration). */
export async function requestPasswordReset(
  email: string,
): Promise<{ success: boolean; error?: string }> {
  if (USE_MOCK_DATA) {
    return mockApi.forgotPassword(email);
  }
  try {
    const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await parseJson(res);
    if (res.ok && data?.success) return { success: true };
    return { success: false, error: data?.error ?? "Could not send the reset code." };
  } catch {
    return { success: false, error: "Network error. Please try again." };
  }
}

/** Complete a password reset with the emailed code. */
export async function resetPassword(
  email: string,
  code: string,
  newPassword: string,
): Promise<{ success: boolean; error?: string }> {
  if (USE_MOCK_DATA) {
    return mockApi.resetPassword(email, code, newPassword);
  }
  try {
    const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code, newPassword }),
    });
    const data = await parseJson(res);
    if (res.ok && data?.success) return { success: true };
    return { success: false, error: data?.error ?? "Could not reset your password." };
  } catch {
    return { success: false, error: "Network error. Please try again." };
  }
}
