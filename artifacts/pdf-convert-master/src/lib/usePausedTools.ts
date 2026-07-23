import { useEffect, useState } from "react";

// Module-level cache so the many ToolCard instances (and tool pages) share a
// single /api/tools/paused fetch per page load instead of firing 30 requests.
let cached: Set<string> | null = null;
let inflight: Promise<Set<string>> | null = null;

async function fetchPausedTools(): Promise<Set<string>> {
  if (cached) return cached;
  if (!inflight) {
    inflight = fetch("/api/tools/paused")
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        const list: unknown = data?.data?.paused;
        const set = new Set<string>(Array.isArray(list) ? list.map(String) : []);
        cached = set;
        return set;
      })
      .catch(() => {
        // Fail open: if the probe fails, treat every tool as active. The
        // conversion endpoints still enforce the pause server-side.
        inflight = null;
        return new Set<string>();
      });
  }
  return inflight;
}

/**
 * Returns the set of backend tool types (snake_case, e.g. "pdf_to_word") that
 * an admin has temporarily paused. Empty set while loading or on failure.
 */
export function usePausedTools(): Set<string> {
  const [paused, setPaused] = useState<Set<string>>(cached ?? new Set());

  useEffect(() => {
    let alive = true;
    void fetchPausedTools().then((set) => {
      if (alive) setPaused(set);
    });
    return () => {
      alive = false;
    };
  }, []);

  return paused;
}

/** True when the given backend tool type is currently paused. */
export function useToolPaused(toolType: string | undefined): boolean {
  const paused = usePausedTools();
  return !!toolType && paused.has(toolType);
}
