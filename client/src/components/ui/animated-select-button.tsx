import React from "react";
import { Button } from "./button";
import { cn } from "../../lib/utils";

interface AnimatedSelectButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
}

export const AnimatedSelectButton = React.forwardRef<
  HTMLButtonElement,
  AnimatedSelectButtonProps
>(({ className, children, size = "default", ...props }, ref) => {
  return (
    <Button
      ref={ref}
      size={size}
      className={cn(
        "relative overflow-hidden",
        "bg-gradient-to-r from-red-600 via-red-600 to-red-700",
        "hover:from-red-700 hover:via-red-700 hover:to-red-800",
        "transition-all duration-300 ease-out",
        "shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98]",
        "border-0 outline-none",
        "before:absolute before:inset-0",
        "before:bg-gradient-to-r before:from-transparent before:via-white/25 before:to-transparent",
        "before:w-[25%] before:h-full",
        "before:animate-[shimmer_1.5s_ease-in-out_infinite]",
        "before:transform before:skew-x-[15deg]",
        "before:blur-[0.5px]",
        "after:absolute after:inset-0",
        "after:bg-gradient-to-r after:from-red-500/20 after:via-red-400/30 after:to-red-500/20",
        "after:opacity-0 hover:after:opacity-100 after:transition-opacity after:duration-300",
        className
      )}
      {...props}
    >
      <span className="relative z-10 flex items-center text-white font-semibold drop-shadow-sm">
        {children}
      </span>
    </Button>
  );
});

AnimatedSelectButton.displayName = "AnimatedSelectButton";
