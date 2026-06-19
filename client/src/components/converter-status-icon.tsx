import type { ComponentType, CSSProperties, ReactNode } from "react";
import { LottieIcon } from "@/components/ui/lottie-icon";
import { cn } from "@/lib/utils";
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
 *
 * For the "upload" prompt, callers can pass the selected tool's own icon
 * (`toolIcon` + colors) so the drop area shows that converter's icon — e.g. a
 * spreadsheet for Excel — instead of the generic syncing animation.
 */
export type ConverterStatus = "upload" | "processing" | "success" | "error";

const ANIMATIONS: Record<ConverterStatus, unknown> = {
  upload: syncingFile,
  processing: syncingFile,
  success: correctFile,
  error: discardedFile,
};

/**
 * Circular badge that frames a tool's own icon, matching the icon treatment
 * used on the tool cards.
 */
export function ToolIconBadge({
  size = 96,
  bgClassName,
  borderClassName,
  className,
  children,
}: {
  size?: number;
  bgClassName?: string;
  borderClassName?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-full border",
        bgClassName,
        borderClassName,
        className,
      )}
      style={{ width: size, height: size }}
    >
      {children}
    </div>
  );
}

export interface ConverterStatusIconProps {
  status: ConverterStatus;
  /** Square pixel size. Defaults to 96. */
  size?: number;
  className?: string;
  /**
   * Optional tool-specific icon. When provided and `status` is "upload", the
   * generic syncing animation is replaced by this icon inside a colored badge,
   * so the drop area reflects the converter the user picked.
   */
  toolIcon?: ComponentType<{ className?: string; style?: CSSProperties }>;
  toolIconColor?: string;
  toolIconBgColor?: string;
  toolIconBorderColor?: string;
}

export function ConverterStatusIcon({
  status,
  size = 96,
  className,
  toolIcon: ToolIcon,
  toolIconColor,
  toolIconBgColor,
  toolIconBorderColor,
}: ConverterStatusIconProps) {
  // Upload prompt with a known tool → show that tool's icon in a badge.
  if (status === "upload" && ToolIcon) {
    const iconPx = Math.round(size * 0.46);
    return (
      <ToolIconBadge
        size={size}
        bgClassName={toolIconBgColor}
        borderClassName={toolIconBorderColor}
        className={className}
      >
        <ToolIcon
          className={toolIconColor}
          style={{ width: iconPx, height: iconPx }}
        />
      </ToolIconBadge>
    );
  }

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
