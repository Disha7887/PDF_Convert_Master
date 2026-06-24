import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LegacyFS from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";
import { getAuthToken } from "@/services/authToken";
import { API_ORIGIN } from "@/constants/api";

/**
 * Save a converted file to the device.
 *
 *  • Android — writes the file straight into a folder the user picks once
 *    (typically "Download") via the Storage Access Framework. The granted
 *    folder is remembered, so every later download is silent / one-tap.
 *  • iOS — opens the system "Save to Files / Save Image" dialog so the user
 *    picks the destination. iOS has no app-writable Downloads folder, and a
 *    silent copy into the app's Documents folder is invisible in Expo Go and
 *    only shows up in a fully installed build — so the system dialog is the
 *    only place a file is reliably findable everywhere.
 *  • Web — triggers a real browser download through a temporary <a download>.
 */

export type SaveResult =
  | { status: "saved"; location: string }
  | { status: "presented" }
  | { status: "cancelled" }
  | { status: "failed" };

const SAF_DIR_KEY = "downloads.safDirectoryUri";

/** Error carrying the HTTP status so callers can show a 401/403-specific message. */
export type DownloadError = Error & { status: number };

function downloadError(status: number): DownloadError {
  const err = new Error(`Download failed (${status})`) as DownloadError;
  err.status = status;
  return err;
}

const MIME_BY_EXT: Record<string, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  bmp: "image/bmp",
  tiff: "image/tiff",
  tif: "image/tiff",
  heic: "image/heic",
  avif: "image/avif",
  svg: "image/svg+xml",
  txt: "text/plain",
  html: "text/html",
  md: "text/markdown",
  csv: "text/csv",
  json: "application/json",
  zip: "application/zip",
};

function mimeFor(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  return MIME_BY_EXT[ext] ?? "application/octet-stream";
}

async function readBase64(uri: string): Promise<string> {
  return LegacyFS.readAsStringAsync(uri, {
    encoding: LegacyFS.EncodingType.Base64,
  });
}

/**
 * Open the system "Save to Files / Save Image / Share" sheet. The sheet needs a
 * real on-disk path with the right extension, so we copy the file into the cache
 * under its final name first, then hand that path off. Used directly on iOS (no
 * app-writable Downloads folder exists) and as the Android fallback whenever the
 * Storage Access Framework path fails, so a download always has a working route.
 */
async function shareFile(uri: string, name: string): Promise<SaveResult> {
  try {
    if (!(await Sharing.isAvailableAsync())) return { status: "failed" };
    const cacheDir = LegacyFS.cacheDirectory;
    let toShare = uri;
    if (cacheDir) {
      const to = cacheDir + encodeURIComponent(name);
      const info = await LegacyFS.getInfoAsync(to);
      if (info.exists) await LegacyFS.deleteAsync(to, { idempotent: true });
      await LegacyFS.copyAsync({ from: uri, to });
      toShare = to;
    }
    await Sharing.shareAsync(toShare, {
      mimeType: mimeFor(name),
      dialogTitle: `Save ${name}`,
    });
    // The system dialog reports its own success/cancel; we can't read which,
    // so surface a neutral "presented" rather than a misleading "saved here".
    return { status: "presented" };
  } catch {
    return { status: "failed" };
  }
}

/**
 * Android: write into the remembered SAF folder, or ask for one the first time.
 * If anything in the SAF path fails (read, folder pick, create, write), fall
 * back to the system share/save sheet so the download still completes — this is
 * what makes Android downloads reliable across the many devices/providers where
 * the raw SAF write silently errors.
 */
async function saveAndroid(uri: string, name: string): Promise<SaveResult> {
  try {
    const mime = mimeFor(name);
    const { StorageAccessFramework: SAF } = LegacyFS;

    const writeOnce = async (dirUri: string, fileName: string): Promise<void> => {
      const data = await readBase64(uri);
      const fileUri = await SAF.createFileAsync(dirUri, fileName, mime);
      await SAF.writeAsStringAsync(fileUri, data, {
        encoding: LegacyFS.EncodingType.Base64,
      });
    };

    // Write into the folder, retrying once with a unique name so a duplicate
    // filename (on providers that don't auto-rename) still saves instead of
    // failing outright.
    const writeInto = async (dirUri: string): Promise<void> => {
      try {
        await writeOnce(dirUri, name);
      } catch {
        const dot = name.lastIndexOf(".");
        const base = dot > 0 ? name.slice(0, dot) : name;
        const ext = dot > 0 ? name.slice(dot) : "";
        await writeOnce(dirUri, `${base} ${Date.now()}${ext}`);
      }
    };

    // A folder we can still list is a folder we still have permission to — used
    // to tell a revoked/missing permission apart from an ordinary write error.
    const dirIsAccessible = async (dirUri: string): Promise<boolean> => {
      try {
        await SAF.readDirectoryAsync(dirUri);
        return true;
      } catch {
        return false;
      }
    };

    // Try the previously-granted folder first for a silent, one-tap download.
    const remembered = await AsyncStorage.getItem(SAF_DIR_KEY);
    if (remembered) {
      try {
        await writeInto(remembered);
        return { status: "saved", location: "your Downloads folder" };
      } catch {
        // Inaccessible → permission was revoked: forget it and re-prompt below.
        // Accessible but write failed → fall back to the system sheet.
        if (await dirIsAccessible(remembered)) return shareFile(uri, name);
        await AsyncStorage.removeItem(SAF_DIR_KEY);
      }
    }

    const perm = await SAF.requestDirectoryPermissionsAsync();
    // User backed out of the folder picker: respect that, save nothing silently.
    if (!perm.granted) return { status: "cancelled" };
    await AsyncStorage.setItem(SAF_DIR_KEY, perm.directoryUri);
    try {
      await writeInto(perm.directoryUri);
      return { status: "saved", location: "the selected folder" };
    } catch {
      // The folder was granted but the write failed — hand off to the sheet so
      // the user still gets their file instead of a dead-end error.
      return shareFile(uri, name);
    }
  } catch {
    // Any unexpected SAF error (e.g. unreadable source URI) → system sheet.
    return shareFile(uri, name);
  }
}

/** Web: trigger a real browser download via a temporary anchor. */
function saveWeb(uri: string, name: string): SaveResult {
  const a = document.createElement("a");
  a.href = uri;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  if (uri.startsWith("blob:")) {
    setTimeout(() => URL.revokeObjectURL(uri), 4000);
  }
  return { status: "saved", location: "your downloads" };
}

/**
 * Save a converted file to the device. Android writes straight into a
 * remembered folder, iOS opens the system "Save to Files / Save Image" dialog,
 * and web triggers a browser download. `uri` is a local file URI (file://) on
 * native or a blob/object URL on web; `name` includes the extension.
 */
export async function saveFile(uri: string, name: string): Promise<SaveResult> {
  if (Platform.OS === "web") return saveWeb(uri, name);
  if (Platform.OS === "android") return saveAndroid(uri, name);
  return shareFile(uri, name);
}

/**
 * Download a converted result from the backend to a local URI. On native the
 * bytes are streamed into the cache so the save flow has a real on-disk path; on
 * web a blob object-URL is returned. Used to re-download a past conversion (e.g.
 * from Recent Activity) — the file is fetched fresh from durable storage each
 * time, so it works anytime, not just right after converting.
 */
export async function downloadRemoteFile(url: string, name: string): Promise<string> {
  // Attach the signed-in user's token so the backend authorizes downloads of
  // files owned by that user (`/api/download` serves a user-owned job only to
  // its owner). Anonymous conversions have no token and stay downloadable.
  // Only attach to our own backend origin so the token can't leak elsewhere.
  const token = getAuthToken();
  const isApiOrigin =
    !!API_ORIGIN && (url === API_ORIGIN || url.startsWith(`${API_ORIGIN}/`));
  const authHeaders =
    token && isApiOrigin ? { Authorization: `Bearer ${token}` } : undefined;
  if (Platform.OS === "web") {
    const res = await fetch(url, authHeaders ? { headers: authHeaders } : undefined);
    if (!res.ok) throw downloadError(res.status);
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  }
  const dir = LegacyFS.cacheDirectory;
  const target = `${dir}download-${Date.now()}-${encodeURIComponent(name)}`;
  const result = await LegacyFS.downloadAsync(
    url,
    target,
    authHeaders ? { headers: authHeaders } : undefined,
  );
  // Guard against saving an error body (e.g. a 404/500 JSON payload) as if it
  // were the converted file — without this the save flow would report success.
  if (result.status < 200 || result.status >= 300) {
    await LegacyFS.deleteAsync(result.uri, { idempotent: true });
    throw downloadError(result.status);
  }
  return result.uri;
}

/** Fetch a converted result from `url` and hand it to the device save flow. */
export async function downloadAndSave(url: string, name: string): Promise<SaveResult> {
  const localUri = await downloadRemoteFile(url, name);
  return saveFile(localUri, name);
}
