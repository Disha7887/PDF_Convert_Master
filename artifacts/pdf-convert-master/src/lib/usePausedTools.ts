import { useEffect, useState } from "react";

// Module-level cache so the many ToolCard instances (and tool pages) share a
// single /api/tools/paused fetch instead of firing 30 requests. The cache
// expires after CACHE_TTL_MS so paused/unpaused changes made by an admin show
// up without a hard reload; mounted hooks also poll and refetch on focus.
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
  if (!inflight) {
    inflight = fetch("/api/tools/paused")
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
        // Fail open: if the probe fails, treat every tool as active. The
        // conversion endpoints still enforce the pause server-side. Keep any
        // previously cached value rather than clobbering it.
        inflight = null;
        return cached ?? new Set<string>();
      });
  }
  return inflight;
}

/**
 * Returns the set of backend tool types (snake_case, e.g. "pdf_to_word") that
 * an admin has temporarily paused. Empty set while loading or on failure.
 * Refreshes periodically and when the tab regains focus, so admin pauses show
 * up without a page reload.
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

    const onFocus = () => {
      if (document.visibilityState === "visible" && !isFresh()) {
        void fetchPausedTools(true);
      }
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);

    return () => {
      alive = false;
      listeners.delete(update);
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, []);

  return paused;
}

/** True when the given backend tool type is currently paused. */
export function useToolPaused(toolType: string | undefined): boolean {
  const paused = usePausedTools();
  return !!toolType && paused.has(toolType);
}
