import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Shared amber "Unavailable" badge shown wherever an admin-paused tool
 * appears (tools grid, home cards, nav dropdowns, search results).
 * Keep wording/styling changes here so every surface stays identical.
 */
export const PausedBadge = ({
  testId,
  className,
}: {
  testId?: string;
  className?: string;
}): JSX.Element => (
  <span
    className={cn(
      "inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-600",
      className,
    )}
    data-testid={testId}
  >
    <Clock className="h-3 w-3" />
    Unavailable
  </span>
);
