/**
 * Write generated PDF bytes to a shareable uri (web).
 *
 * The expo-file-system `File` API is native-only (it calls `this.validatePath()`,
 * a native method that doesn't exist on web), so on web we wrap the bytes in a
 * Blob and hand back an object URL the download anchor can use.
 */
export async function writePdfOutput(bytes: Uint8Array, _fileName: string): Promise<string> {
  const ab = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  const blob = new Blob([ab], { type: "application/pdf" });
  return URL.createObjectURL(blob);
}
