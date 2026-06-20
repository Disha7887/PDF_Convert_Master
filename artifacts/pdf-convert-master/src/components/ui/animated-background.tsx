import { motion, useReducedMotion } from "framer-motion";
import { AnimatedParticles } from "@/components/ui/animated-particles";

interface AnimatedBackgroundProps {
  /** Number of drifting particles rendered by AnimatedParticles. */
  particleCount?: number;
  className?: string;
}

/**
 * Shared animated page background: drifting blue gradient blurs, animated
 * outlined circles, floating dots and the particle field. All elements are
 * positioned with percentages so the background adapts to any section height,
 * and the whole layer is non-interactive (pointer-events-none, z-0) so it sits
 * behind section content.
 */
export const AnimatedBackground = ({
  particleCount = 28,
  className = "",
}: AnimatedBackgroundProps): JSX.Element => {
  const prefersReducedMotion = useReducedMotion();
  // Drifting gradient blurs ("bubbles") that move continuously via Framer Motion.
  const gradientBlurs = [
    {
      className:
        "absolute w-96 h-96 top-[8%] left-[6%] rounded-full blur-[32px] bg-[linear-gradient(135deg,rgba(247, 67, 61,0.15)_0%,rgba(247, 67, 61,0.15)_100%)]",
      animate: { x: [0, 220, 80, 0], y: [0, 120, 280, 0], scale: [1, 1.12, 0.92, 1] },
      transition: { duration: 24, repeat: Infinity, ease: "easeInOut" },
    },
    {
      className:
        "absolute w-80 h-80 top-[55%] right-[8%] rounded-full blur-[32px] bg-[linear-gradient(135deg,rgba(247, 67, 61,0.18)_0%,rgba(247, 67, 61,0.18)_100%)]",
      animate: { x: [0, -260, -90, 0], y: [0, -160, -50, 0], scale: [1, 0.9, 1.1, 1] },
      transition: { duration: 28, repeat: Infinity, ease: "easeInOut" },
    },
    {
      className:
        "absolute w-64 h-64 bottom-[10%] left-[16%] rounded-full blur-[32px] bg-[linear-gradient(135deg,rgba(247, 67, 61,0.22)_0%,rgba(247, 67, 61,0.22)_100%)]",
      animate: { x: [0, 180, 320, 0], y: [0, -120, -200, 0], scale: [1, 1.15, 1, 1] },
      transition: { duration: 20, repeat: Infinity, ease: "easeInOut" },
    },
  ];

  // Drifting outlined circles.
  const borderCircles = [
    {
      className:
        "absolute w-40 h-40 top-[20%] left-[22%] rounded-full border-2 border-solid border-[#f7433d4c]",
      animate: { x: [0, 140, 0], y: [0, -90, 0] },
      transition: { duration: 17, repeat: Infinity, ease: "easeInOut" },
    },
    {
      className:
        "absolute w-32 h-32 bottom-[14%] right-[18%] rounded-full border-2 border-solid border-[#f7433d66]",
      animate: { x: [0, -120, 0], y: [0, 80, 0] },
      transition: { duration: 21, repeat: Infinity, ease: "easeInOut" },
    },
    {
      className:
        "absolute w-48 h-48 top-[45%] right-[24%] rounded-full border-2 border-solid border-[#f7433d40]",
      animate: { x: [0, 100, 0], y: [0, 130, 0] },
      transition: { duration: 25, repeat: Infinity, ease: "easeInOut" },
    },
  ];

  // Drifting solid dots.
  const dotElements = [
    {
      className: "absolute w-4 h-4 top-[18%] left-[12%] bg-blue-300/50 rounded-full",
      animate: { x: [0, 60, 0], y: [0, 40, 0] },
      transition: { duration: 12, repeat: Infinity, ease: "easeInOut" },
    },
    {
      className: "absolute w-3 h-3 top-[38%] right-[10%] bg-[#f7433d66] rounded-full",
      animate: { x: [0, -50, 0], y: [0, 70, 0] },
      transition: { duration: 15, repeat: Infinity, ease: "easeInOut" },
    },
    {
      className: "absolute w-2 h-2 bottom-[22%] left-[20%] bg-[#f7433d80] rounded-full",
      animate: { x: [0, 80, 0], y: [0, -60, 0] },
      transition: { duration: 14, repeat: Infinity, ease: "easeInOut" },
    },
    {
      className: "absolute w-5 h-5 bottom-[30%] right-[14%] bg-[#f7433d59] rounded-full",
      animate: { x: [0, -90, 0], y: [0, -50, 0] },
      transition: { duration: 18, repeat: Infinity, ease: "easeInOut" },
    },
    {
      className: "absolute w-6 h-6 top-[62%] right-[28%] bg-[#f7433d4c] rounded-full",
      animate: { x: [0, 70, 0], y: [0, 90, 0] },
      transition: { duration: 16, repeat: Infinity, ease: "easeInOut" },
    },
  ];

  // Static rotated squares and vertical light lines for extra texture.
  const rotatedElements = [
    "absolute w-12 h-12 top-[30%] right-[16%] rotate-45 bg-[linear-gradient(135deg,rgba(247, 67, 61,0.2)_0%,rgba(0,0,0,0)_100%)]",
    "absolute w-8 h-8 top-[34%] right-[6%] rotate-45 bg-[linear-gradient(135deg,rgba(247, 67, 61,0.25)_0%,rgba(0,0,0,0)_100%)]",
    "absolute w-16 h-16 bottom-[16%] left-[38%] rotate-45 bg-[linear-gradient(135deg,rgba(247, 67, 61,0.15)_0%,rgba(0,0,0,0)_100%)]",
  ];

  const lineElements = [
    "absolute w-px h-32 top-[18%] left-[26%] bg-[linear-gradient(0deg,rgba(0,0,0,0)_0%,rgba(247, 67, 61,0.3)_50%,rgba(0,0,0,0)_100%)]",
    "absolute w-px h-24 bottom-[24%] right-[34%] bg-[linear-gradient(0deg,rgba(0,0,0,0)_0%,rgba(247, 67, 61,0.4)_50%,rgba(0,0,0,0)_100%)]",
    "absolute w-px h-28 top-[52%] right-[38%] bg-[linear-gradient(0deg,rgba(0,0,0,0)_0%,rgba(247, 67, 61,0.35)_50%,rgba(0,0,0,0)_100%)]",
  ];

  return (
    <div
      className={`absolute inset-0 overflow-hidden pointer-events-none z-0 ${className}`}
      aria-hidden="true"
    >
      <AnimatedParticles count={particleCount} />

      {gradientBlurs.map((blur, index) => (
        <motion.div
          key={`blur-${index}`}
          className={blur.className}
          {...(prefersReducedMotion
            ? {}
            : { animate: blur.animate, transition: blur.transition })}
        />
      ))}

      {borderCircles.map((circle, index) => (
        <motion.div
          key={`circle-${index}`}
          className={circle.className}
          {...(prefersReducedMotion
            ? {}
            : { animate: circle.animate, transition: circle.transition })}
        />
      ))}

      {dotElements.map((dot, index) => (
        <motion.div
          key={`dot-${index}`}
          className={dot.className}
          {...(prefersReducedMotion
            ? {}
            : { animate: dot.animate, transition: dot.transition })}
        />
      ))}

      {rotatedElements.map((className, index) => (
        <div key={`rotated-${index}`} className={className} />
      ))}

      {lineElements.map((className, index) => (
        <div key={`line-${index}`} className={className} />
      ))}
    </div>
  );
};
