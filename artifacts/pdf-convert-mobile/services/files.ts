import * as Sharing from "expo-sharing";

/** Open the native share sheet for a file URI. Returns false if unavailable. */
export async function shareFile(uri: string): Promise<boolean> {
  if (!(await Sharing.isAvailableAsync())) return false;
  await Sharing.shareAsync(uri);
  return true;
}
