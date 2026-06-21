import { Platform } from "react-native";
import { File } from "expo-file-system";
import { PDFDocument } from "pdf-lib";

/**
 * Cache the most-recently read PDF's bytes. Several consumers (page count, page
 * size, page rendering, and "Edit Text" extraction) each read the same source,
 * and they run at different times — count/size/render on open, extraction only
 * when the user taps "Edit Text" later. On web the source is a `blob:` /`data:`
 * object-URL that can stop being fetchable after it's been used once (e.g. an
 * export output URL that gets revoked). The renderer caches its *parsed*
 * document, so without a bytes cache the editor could show a page it can no
 * longer re-read — making "Edit Text" fail with "could not read text" on a doc
 * that is plainly on screen. Single-entry: the editor works on one doc at a time.
 */
let lastBytes: { uri: string; bytes: Uint8Array } | null = null;

/**
 * Read the raw bytes of a PDF (or any file) from a uri, cross-platform.
 *
 * - Web: the picked uri is a blob:/data: URL; `fetch` is the reliable reader.
 * - Native: use the expo-file-system `File` API.
 *
 * Always returns a fresh copy of the cached master, so a consumer that hands
 * the bytes to an API which DETACHES the buffer (e.g. pdf.js `getDocument`)
 * can never poison the cache for later reads.
 */
export async function readPdfBytes(uri: string): Promise<Uint8Array> {
  if (lastBytes && lastBytes.uri === uri) return lastBytes.bytes.slice();
  let bytes: Uint8Array;
  if (Platform.OS === "web") {
    const res = await fetch(uri);
    if (!res.ok) throw new Error("Could not read the selected PDF.");
    bytes = new Uint8Array(await res.arrayBuffer());
  } else {
    bytes = await new File(uri).bytes();
  }
  lastBytes = { uri, bytes };
  return bytes.slice();
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
