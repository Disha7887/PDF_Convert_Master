/**
 * Guest download window.
 *
 * Signed-in users can re-download their converted files at any time. Guests
 * (logged-out) may re-download a converted file for a limited window after it
 * was produced; after that they must sign in. This keeps the free flow useful
 * while nudging long-term users to create an account (see LoginRequiredModal).
 */
export const GUEST_DOWNLOAD_WINDOW_MS = 12 * 60 * 60 * 1000; // 12 hours

/**
 * Whether a guest's re-download of an entry has expired.
 *
 * @param createdAt      When the entry was produced (epoch ms).
 * @param isAuthenticated Current auth state — signed-in users never expire.
 */
export function isGuestDownloadExpired(
  createdAt: number | undefined,
  isAuthenticated: boolean,
): boolean {
  if (isAuthenticated) return false;
  if (!createdAt) return false; // unknown age (legacy entry) — don't block
  return Date.now() - createdAt > GUEST_DOWNLOAD_WINDOW_MS;
}
