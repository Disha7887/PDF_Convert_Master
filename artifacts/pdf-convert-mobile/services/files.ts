import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LegacyFS from "expo-file-system/legacy";
import { Platform } from "react-native";

/**
 * Direct file download (no share sheet).
 *
 *  • Android — writes the file straight into a folder the user picks once
 *    (typically "Download") via the Storage Access Framework. The granted
 *    folder is remembered, so every later download is silent / one-tap.
 *  • iOS — copies the file into the app's Documents folder, which is exposed
 *    in the Files app (On My iPhone → PDF Convert Master) via the
 *    UIFileSharingEnabled / LSSupportsOpeningDocumentsInPlace Info.plist keys.
 *  • Web — triggers a real browser download through a temporary <a download>.
 */

export type SaveResult =
  | { status: "saved"; location: string }
  | { status: "cancelled" }
  | { status: "failed" };

const SAF_DIR_KEY = "downloads.safDirectoryUri";

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

/** Android: write into the remembered SAF folder, or ask for one the first time. */
async function saveAndroid(uri: string, name: string): Promise<SaveResult> {
  const mime = mimeFor(name);
  const { StorageAccessFramework: SAF } = LegacyFS;

  const data = await readBase64(uri);

  const writeOnce = async (dirUri: string, fileName: string): Promise<void> => {
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

  // A folder we can still list is a folder we still have permission to — used to
  // tell a revoked/missing permission apart from an ordinary write error.
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
      // Only forget the folder (and re-prompt) when it's truly inaccessible.
      // A transient write error shouldn't nag the user to re-pick every time.
      if (await dirIsAccessible(remembered)) return { status: "failed" };
      await AsyncStorage.removeItem(SAF_DIR_KEY);
    }
  }

  const perm = await SAF.requestDirectoryPermissionsAsync();
  if (!perm.granted) return { status: "cancelled" };
  await AsyncStorage.setItem(SAF_DIR_KEY, perm.directoryUri);
  try {
    await writeInto(perm.directoryUri);
    return { status: "saved", location: "the selected folder" };
  } catch {
    return { status: "failed" };
  }
}

/** iOS: copy into the app's Documents folder (visible in the Files app). */
async function saveIos(uri: string, name: string): Promise<SaveResult> {
  try {
    const dir = LegacyFS.documentDirectory;
    if (!dir) return { status: "failed" };
    const to = dir + encodeURIComponent(name);
    const info = await LegacyFS.getInfoAsync(to);
    if (info.exists) await LegacyFS.deleteAsync(to, { idempotent: true });
    await LegacyFS.copyAsync({ from: uri, to });
    return {
      status: "saved",
      location: "Files app → On My iPhone → PDF Convert Master",
    };
  } catch {
    return { status: "failed" };
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
 * Download a file directly to the device (no share sheet). `uri` is a local
 * file URI (file://) on native or a blob/object URL on web; `name` is the
 * desired file name including its extension.
 */
export async function saveFile(uri: string, name: string): Promise<SaveResult> {
  if (Platform.OS === "web") return saveWeb(uri, name);
  if (Platform.OS === "android") return saveAndroid(uri, name);
  return saveIos(uri, name);
}
