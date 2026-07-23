import { useEffect, useState } from "react";

import { API_BASE_URL } from "@/constants/api";

// Module-level cache so every ToolCard in a list shares one fetch instead of
// firing dozens of identical /api/tools/paused requests.
let cached: Set<string> | null = null;
let inflight: Promise<Set<string>> | null = null;

async function fetchPausedTools(): Promise<Set<string>> {
  if (cached) return cached;
  if (!API_BASE_URL) return new Set();
  if (!inflight) {
    inflight = fetch(`${API_BASE_URL}/tools/paused`)
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        const list: unknown = data?.data?.paused;
        const set = new Set<string>(Array.isArray(list) ? list.map(String) : []);
        cached = set;
        return set;
      })
      .catch(() => {
        // Fail open: treat all tools as active if the probe fails; the server
        // still rejects paused conversions as a backstop.
        inflight = null;
        return new Set<string>();
      });
  }
  return inflight;
}

/**
 * Set of server tool types (snake_case, e.g. "pdf_to_word") that an admin has
 * temporarily paused. Empty while loading or on failure.
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

/** True when the given server tool type is currently paused by an admin. */
export function useToolPaused(serverToolType: string | undefined): boolean {
  const paused = usePausedTools();
  return !!serverToolType && paused.has(serverToolType);
}
