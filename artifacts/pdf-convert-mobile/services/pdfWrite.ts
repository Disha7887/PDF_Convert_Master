import { File, Paths } from "expo-file-system";

/**
 * Write generated PDF bytes to a shareable uri (native).
 * Uses the expo-file-system `File` API to write into the cache directory.
 */
export async function writePdfOutput(bytes: Uint8Array, fileName: string): Promise<string> {
  const file = new File(Paths.cache, fileName);
  file.create({ overwrite: true, intermediates: true });
  file.write(bytes);
  return file.uri;
}
