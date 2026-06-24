// Robust file download helper. The server returns converted files from
// `/api/download/:jobId` with `Content-Disposition: attachment`. Triggering the
// download by navigating an <a href> to that URL (or `window.open`) is
// unreliable: inside the Replit preview / canvas iframe those navigations and
// popups are frequently blocked by the iframe sandbox or the browser's popup
// blocker, so the file never actually saves.
//
// Fetching the file as a Blob and clicking a temporary object-URL <a download>
// works in those embedded contexts because the navigation stays same-document.

import { getAuthToken } from "./authedFetch";

function filenameFromDisposition(header: string | null): string | null {
  if (!header) return null;
  // Prefer RFC 5987 `filename*=UTF-8''...` when present.
  const star = /filename\*=(?:UTF-8'')?([^;]+)/i.exec(header);
  if (star) {
    try {
      return decodeURIComponent(star[1].trim().replace(/^"|"$/g, ""));
    } catch {
      /* fall through to plain filename */
    }
  }
  const plain = /filename="?([^";]+)"?/i.exec(header);
  return plain ? plain[1].trim() : null;
}

/**
 * Download the file at `url` to the user's device. Resolves once the download
 * has been triggered; rejects if the request fails (e.g. the converted file is
 * no longer available on the server).
 *
 * @param url           Same-origin URL of the file (e.g. `/api/download/123`).
 * @param fallbackName  Filename to use if the server sends no Content-Disposition.
 */
export async function downloadFromUrl(
  url: string,
  fallbackName?: string,
): Promise<void> {
  // Attach the signed-in user's token for same-origin API downloads so the
  // backend can authorize access to files owned by that user (`/api/download`
  // only serves a user-owned job to its owner). Guest downloads send no token.
  // Strict origin check (via URL parsing, not prefix matching) so the bearer
  // token is never leaked to a look-alike third-party origin.
  const token = getAuthToken();
  let sameOrigin = false;
  try {
    sameOrigin = new URL(url, window.location.origin).origin === window.location.origin;
  } catch {
    sameOrigin = false;
  }
  const init: RequestInit | undefined =
    token && sameOrigin
      ? { headers: { Authorization: `Bearer ${token}` } }
      : undefined;
  const res = await fetch(url, init);
  if (!res.ok) {
    throw new Error(
      res.status === 404
        ? "This file is no longer available. Please run the conversion again."
        : `Download failed (${res.status})`,
    );
  }

  const blob = await res.blob();
  const name =
    filenameFromDisposition(res.headers.get("Content-Disposition")) ||
    fallbackName ||
    url.split("/").pop() ||
    "download";

  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoke after a tick so the browser has started the download.
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}
