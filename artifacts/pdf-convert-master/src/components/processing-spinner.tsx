import { ConverterStatusIcon } from "@/components/converter-status-icon";
import { cn } from "@/lib/utils";

export interface ProcessingSpinnerProps {
  /** Square pixel size. Defaults to 18. */
  size?: number;
  /**
   * Use "light" on dark/colored surfaces (e.g. blue buttons) so the loader is
   * tinted white for contrast. Defaults to "dark" (the animation's own navy),
   * which reads best on white/light backgrounds.
   */
  tone?: "dark" | "light";
  className?: string;
}

/**
 * The single loading/processing indicator used across the whole app. Renders the
 * user-provided "processing" Lottie animation so every loading state looks the
 * same. Replaces ad-hoc lucide <Loader2 className="animate-spin" /> spinners.
 */
export function ProcessingSpinner({
  size = 18,
  tone = "dark",
  className,
}: ProcessingSpinnerProps) {
  return (
    <ConverterStatusIcon
      status="processing"
      size={size}
      className={cn(tone === "light" && "brightness-0 invert", className)}
    />
  );
}

export default ProcessingSpinner;
