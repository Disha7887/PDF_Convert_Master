import React from "react";
import { motion } from "framer-motion";
import { Upload } from "lucide-react";

interface BouncingUploadIconProps {
  className?: string;
  iconClassName?: string;
  alt?: string;
  src?: string;
  iconType?: "lucide" | "image";
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
  animationSpeed?: "slow" | "normal" | "fast";
  bgColor?: string;
}

export const BouncingUploadIcon: React.FC<BouncingUploadIconProps> = ({
  className = "",
  iconClassName = "",
  alt = "Upload icon",
  src,
  iconType = "lucide",
  size = "md",
  animationSpeed = "fast",
  bgColor = "bg-red-100"
}) => {
  // Size configurations
  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-16 h-16",
    lg: "w-24 h-24",
    xl: "w-32 h-32",
    "2xl": "w-40 h-40",
    "3xl": "w-48 h-48"
  };

  const iconSizeClasses = {
    sm: "w-5 h-5",
    md: "w-6 h-6",
    lg: "w-10 h-10",
    xl: "w-14 h-14",
    "2xl": "w-16 h-16",
    "3xl": "w-20 h-20"
  };

  // Animation speed configurations
  const speedConfig = {
    slow: { duration: 2.2, bounce: 0.4 },
    normal: { duration: 1.8, bounce: 0.5 },
    fast: { duration: 1.4, bounce: 0.6 }
  };

  const config = speedConfig[animationSpeed];

  // Physics-based bouncing animation that mimics a ball
  const bouncingVariants = {
    animate: {
      y: [0, -20, 0, -15, 0, -10, 0, -5, 0],
      transition: {
        y: {
          duration: config.duration,
          ease: [0.25, 0.46, 0.45, 0.94], // Custom cubic-bezier for realistic bounce
          repeat: Infinity,
          repeatDelay: 0.8,
        }
      }
    }
  };

  // Additional shadow animation for depth effect
  const shadowVariants = {
    animate: {
      scale: [1, 1.2, 0.8, 1.1, 0.85, 1.05, 0.9, 1],
      opacity: [0.3, 0.5, 0.2, 0.4, 0.25, 0.35, 0.28, 0.3],
      transition: {
        duration: config.duration,
        ease: "easeOut",
        repeat: Infinity,
        repeatDelay: 0.8,
      }
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Main bouncing icon container */}
      <motion.div
        className={`${sizeClasses[size]} rounded-full ${bgColor} flex items-center justify-center relative z-10 shadow-lg`}
        variants={bouncingVariants}
        animate="animate"
        initial={{ y: 0, scale: 1 }}
      >
        {iconType === "image" && src ? (
          <img
            className={`${iconClassName}`}
            alt={alt}
            src={src}
          />
        ) : (
          <Upload className={`${iconSizeClasses[size]} ${iconClassName || 'text-red-500'}`} />
        )}
      </motion.div>
    </div>
  );
};
