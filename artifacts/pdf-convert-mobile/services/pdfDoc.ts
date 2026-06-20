import { Platform } from "react-native";
import { File } from "expo-file-system";
import { PDFDocument } from "pdf-lib";

/**
 * Read the raw bytes of a PDF (or any file) from a uri, cross-platform.
 *
 * - Web: the picked uri is a blob:/data: URL; `fetch` is the reliable reader.
 * - Native: use the expo-file-system `File` API.
 */
export async function readPdfBytes(uri: string): Promise<Uint8Array> {
  if (Platform.OS === "web") {
    const res = await fetch(uri);
    if (!res.ok) throw new Error("Could not read the selected PDF.");
    return new Uint8Array(await res.arrayBuffer());
  }
  return new File(uri).bytes();
}

/**
 * Return the real page count of a PDF. Uses pdf-lib (pure JS) so it works on
 * web and in Expo Go without native modules.
 */
export async function getPdfPageCount(uri: string): Promise<number> {
  const bytes = await readPdfBytes(uri);
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  return doc.getPageCount();
}

/**
 * Return the size (in PDF points) of a single page. Used by the editor to size
 * the on-screen preview to the real page aspect ratio so placed signatures and
 * images map 1:1 onto the generated PDF (pages aren't always A4).
 */
export async function getPdfPageSize(
  uri: string,
  pageIndex: number,
): Promise<{ width: number; height: number }> {
  const bytes = await readPdfBytes(uri);
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const pages = doc.getPages();
  const page = pages[pageIndex] ?? pages[0];
  const { width, height } = page.getSize();
  return { width, height };
}
