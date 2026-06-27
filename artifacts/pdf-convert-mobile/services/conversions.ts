import { getAuthToken } from "@/services/authToken";
import { API_ORIGIN } from "@/constants/api";

/**
 * Permanently delete a conversion's stored output from the backend — the durable
 * Backblaze copy and the job record — so a deleted file isn't kept forever.
 *
 * Best-effort by contract: callers remove the local Files/History entry first and
 * call this to also purge the server copy; a failure here must not block the local
 * removal. Sends the signed-in user's token so the backend authorizes deletion of
 * a user-owned job (guest jobs need no token). Only ever hits our own origin.
 */
export async function deleteConversion(jobId: string | number): Promise<void> {
  if (!API_ORIGIN || jobId === undefined || jobId === null || jobId === "") return;
  const token = getAuthToken();
  const headers: Record<string, string> = token
    ? { Authorization: `Bearer ${token}` }
    : {};
  const res = await fetch(`${API_ORIGIN}/api/download/${jobId}`, {
    method: "DELETE",
    headers,
  });
  if (!res.ok) {
    const err = new Error(`Delete failed (${res.status})`) as Error & { status: number };
    err.status = res.status;
    throw err;
  }
}
