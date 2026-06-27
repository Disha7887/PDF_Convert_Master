import { ProcessingSpinner } from "@/components/processing-spinner"
import { cn } from "@/lib/utils"

// The shared loading indicator. Renders the app's "processing" Lottie animation
// so every loading state looks the same (replaces the old lucide spin icon).
function Spinner({ className }: { className?: string }) {
  return (
    <span role="status" aria-label="Loading" className="inline-flex">
      <ProcessingSpinner size={16} className={cn(className)} />
    </span>
  )
}

export { Spinner }
