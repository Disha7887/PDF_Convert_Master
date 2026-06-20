import AsyncStorage from "@react-native-async-storage/async-storage";

export const FILES_KEY = "pdf_convert_files";

export type StoredFileKind = "scanned-image" | "converted-pdf" | "converted-file";

export type FileCategory = "scanned" | "converted";

export interface StoredFileEntry {
  id: string;
  kind: StoredFileKind;
  /** Display name, e.g. "Scan 2026-06-20" or "report.pdf". */
  name: string;
  /** File URI of the produced document (PDF or converted output), if any. */
  uri?: string;
  /** Image URI used for the list thumbnail (first scanned page, etc.). */
  thumbnailUri?: string;
  /** Number of pages/items — shown as "N elements" in the file list. */
  elementCount: number;
  createdAt: number;
  /** Source tool metadata for converted files. */
  toolId?: string;
  toolTitle?: string;
  outputFormat?: string;
}

export function categoryOf(kind: StoredFileKind): FileCategory {
  return kind === "scanned-image" ? "scanned" : "converted";
}

export async function loadFiles(): Promise<StoredFileEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(FILES_KEY);
    if (!raw) return [];
    const parsed: StoredFileEntry[] = JSON.parse(raw);
    return parsed.sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return [];
  }
}

export async function addFile(entry: StoredFileEntry): Promise<void> {
  try {
    const current = await loadFiles();
    const next = [entry, ...current].slice(0, 200);
    await AsyncStorage.setItem(FILES_KEY, JSON.stringify(next));
  } catch {
    // best-effort; the file list is non-critical local state
  }
}

export async function removeFile(id: string): Promise<void> {
  try {
    const current = await loadFiles();
    const next = current.filter((f) => f.id !== id);
    await AsyncStorage.setItem(FILES_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

export async function clearFiles(): Promise<void> {
  try {
    await AsyncStorage.removeItem(FILES_KEY);
  } catch {
    // ignore
  }
}

/** Case-insensitive search over file name and tool title. */
export function searchFiles(files: StoredFileEntry[], query: string): StoredFileEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return files;
  return files.filter(
    (f) =>
      f.name.toLowerCase().includes(q) ||
      (f.toolTitle ? f.toolTitle.toLowerCase().includes(q) : false),
  );
}
