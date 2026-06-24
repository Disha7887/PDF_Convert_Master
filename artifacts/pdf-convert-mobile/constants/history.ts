import AsyncStorage from "@react-native-async-storage/async-storage";

export const HISTORY_KEY = "pdf_convert_history";

export interface HistoryEntry {
  id: string;
  toolId?: string;
  toolTitle: string;
  fileName: string;
  /**
   * Backend job id for server-converted outputs. Preferred for re-download
   * because the file is fetched fresh from durable storage (survives cache
   * eviction / app restarts). Absent for purely local editor outputs.
   */
  jobId?: string;
  /** Local URI of the produced file; fallback re-download for editor outputs. */
  uri?: string;
  outputFormat: string;
  timestamp: number;
  status: "completed" | "failed";
}

export async function loadHistory(): Promise<HistoryEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed: HistoryEntry[] = JSON.parse(raw);
    return parsed.sort((a, b) => b.timestamp - a.timestamp);
  } catch {
    return [];
  }
}

export async function addHistory(entry: HistoryEntry): Promise<void> {
  try {
    const current = await loadHistory();
    const next = [entry, ...current].slice(0, 100);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  } catch {
    // best-effort; history is non-critical
  }
}

export async function clearHistory(): Promise<void> {
  try {
    await AsyncStorage.removeItem(HISTORY_KEY);
  } catch {
    // ignore
  }
}
