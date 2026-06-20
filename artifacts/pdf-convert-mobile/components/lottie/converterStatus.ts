import { TOOL_ANIMATIONS } from "@/components/lottie/toolLottie";

/**
 * Shared converter-status → Lottie animation map. Mirrors the web app's
 * `ConverterStatusIcon` (`src/components/converter-status-icon.tsx`):
 * - "upload"     → the picked tool's own animation, else a generic syncing loop
 * - "processing" → dedicated processing loop
 * - "success"    → "correct file" (plays once)
 * - "error"      → "discarded file" (plays once)
 *
 * Consumed by both the native (`ConverterStatusIcon.tsx`, lottie-react-native)
 * and web (`ConverterStatusIcon.web.tsx`, lottie-react) renderers.
 */
export type ConverterStatus = "upload" | "processing" | "success" | "error";

const syncingFile = require("../../assets/lottie/syncing-file.json");
const correctFile = require("../../assets/lottie/correct-file.json");
const discardedFile = require("../../assets/lottie/discarded-file.json");
const processingAnim = require("../../assets/lottie/processing.json");

export function resolveStatusAnimation(
  status: ConverterStatus,
  toolId?: string,
): { animation: unknown; loop: boolean } {
  if (status === "success") return { animation: correctFile, loop: false };
  if (status === "error") return { animation: discardedFile, loop: false };
  if (status === "processing") return { animation: processingAnim, loop: true };
  return { animation: (toolId && TOOL_ANIMATIONS[toolId]) || syncingFile, loop: true };
}
