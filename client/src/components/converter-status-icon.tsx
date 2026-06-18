import { LottieIcon } from "@/components/ui/lottie-icon";
import syncingFile from "@/assets/lottie/syncing-file.json";
import correctFile from "@/assets/lottie/correct-file.json";
import discardedFile from "@/assets/lottie/discarded-file.json";

/**
 * Stages every file converter shares:
 * - "upload"     → prompt to pick/drop a file
 * - "processing" → file is uploading / converting
 * - "success"    → conversion finished
 * - "error"      → wrong file type or conversion failed
 *
 * The three Lottie animations the user provided are mapped here once so the
 * whole app stays consistent: the "syncing file" loop covers both the upload
 * prompt and the in-progress state, "correct file" is success, and
 * "discarded file" is the error/invalid state.
 */
export type ConverterStatus = "upload" | "processing" | "success" | "error";

const ANIMATIONS: Record<ConverterStatus, unknown> = {
  upload: syncingFile,
  processing: syncingFile,
  success: correctFile,
  error: discardedFile,
};

export interface ConverterStatusIconProps {
  status: ConverterStatus;
  /** Square pixel size. Defaults to 96. */
  size?: number;
  className?: string;
}

export function ConverterStatusIcon({
  status,
  size = 96,
  className,
}: ConverterStatusIconProps) {
  // Upload + processing read as continuous activity, so they loop. Success and
  // error play once and settle on their final frame.
  const loop = status === "upload" || status === "processing";
  return (
    <LottieIcon
      animationData={ANIMATIONS[status]}
      size={size}
      loop={loop}
      className={className}
    />
  );
}

export default ConverterStatusIcon;
