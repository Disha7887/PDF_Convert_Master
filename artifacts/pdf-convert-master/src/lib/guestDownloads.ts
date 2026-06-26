// Guest (logged-out) download persistence.
//
// Logged-in users can always re-download from their dashboard history (the
// server enforces per-user ownership). Guests have no account, so once the
// converter's in-memory React state is lost on a page refresh they would lose
// the link to their just-converted file even though the backend keeps a durable
// copy. We persist the guest's completed jobs (jobId is enough — the file lives
// in durable object storage on the server) to localStorage so they can still
// download after a refresh / fresh page load.
//
// These entries reference anonymous jobs only (userId null on the server), so
// there is no cross-user exposure: the jobId points at the guest's own file.

import { getAuthToken } from "./authedFetch";

export interface GuestDownload {
  /** Normalised server tool type (underscores), used to scope per-tool lists. */
  toolType: string;
  jobId: number;
  fileName: string;
  ts: number;
}

const KEY = "guest_downloads_v1";
const MAX = 20;

/** True when there is no signed-in user (guest session). */
export function isGuest(): boolean {
  return !getAuthToken();
}

export function loadGuestDownloads(): GuestDownload[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as GuestDownload[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((d) => d && typeof d.jobId === "number")
      .sort((a, b) => b.ts - a.ts);
  } catch {
    return [];
  }
}

export function addGuestDownload(entry: GuestDownload): void {
  try {
    const current = loadGuestDownloads().filter(
      (d) => !(d.jobId === entry.jobId && d.toolType === entry.toolType),
    );
    const next = [entry, ...current].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // best-effort; persistence is non-critical
  }
}

export function clearGuestDownloads(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
