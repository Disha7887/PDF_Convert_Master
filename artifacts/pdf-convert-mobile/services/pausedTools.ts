import { useEffect, useState } from "react";
import { AppState } from "react-native";

import { API_BASE_URL } from "@/constants/api";

// Module-level cache so every ToolCard in a list shares one fetch instead of
// firing dozens of identical /api/tools/paused requests. The cache expires
// after CACHE_TTL_MS so admin pauses/unpauses show up without restarting the
// app; mounted hooks also poll and refetch when the app returns to foreground.
const CACHE_TTL_MS = 60_000;

let cached: Set<string> | null = null;
let cachedAt = 0;
let inflight: Promise<Set<string>> | null = null;

// Subscribers so every mounted hook re-renders when a refetch lands.
const listeners = new Set<(set: Set<string>) => void>();

function isFresh(): boolean {
  return cached !== null && Date.now() - cachedAt < CACHE_TTL_MS;
}

async function fetchPausedTools(force = false): Promise<Set<string>> {
  if (!force && isFresh()) return cached as Set<string>;
  if (!API_BASE_URL) return cached ?? new Set();
  if (!inflight) {
    inflight = fetch(`${API_BASE_URL}/tools/paused`)
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        const list: unknown = data?.data?.paused;
        const set = new Set<string>(Array.isArray(list) ? list.map(String) : []);
        cached = set;
        cachedAt = Date.now();
        inflight = null;
        listeners.forEach((fn) => fn(set));
        return set;
      })
      .catch(() => {
        // Fail open: treat all tools as active if the probe fails; the server
        // still rejects paused conversions as a backstop. Keep any previously
        // cached value rather than clobbering it.
        inflight = null;
        return cached ?? new Set<string>();
      });
  }
  return inflight;
}

/**
 * Set of server tool types (snake_case, e.g. "pdf_to_word") that an admin has
 * temporarily paused. Empty while loading or on failure. Refreshes
 * periodically and when the app returns to the foreground, so admin changes
 * show up without a restart.
 */
export function usePausedTools(): Set<string> {
  const [paused, setPaused] = useState<Set<string>>(cached ?? new Set());

  useEffect(() => {
    let alive = true;
    const update = (set: Set<string>) => {
      if (alive) setPaused(set);
    };
    listeners.add(update);

    void fetchPausedTools().then(update);

    const interval = setInterval(() => {
      void fetchPausedTools(true);
    }, CACHE_TTL_MS);

    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active" && !isFresh()) {
        void fetchPausedTools(true);
      }
    });

    return () => {
      alive = false;
      listeners.delete(update);
      clearInterval(interval);
      sub.remove();
    };
  }, []);

  return paused;
}

/** True when the given server tool type is currently paused by an admin. */
export function useToolPaused(serverToolType: string | undefined): boolean {
  const paused = usePausedTools();
  return !!serverToolType && paused.has(serverToolType);
}
