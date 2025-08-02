import React from "react";
import { motion } from "framer-motion";
import { Upload } from "lucide-react";

interface BouncingUploadIconProps {
  className?: string;
  iconClassName?: string;
  alt?: string;
  src?: string;
  iconType?: "lucide" | "image";
  size?: "sm" | "md" | "lg" | "xl";
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
    lg: "w-20 h-20",
    xl: "w-24 h-24"
  };

  const iconSizeClasses = {
    sm: "w-5 h-5",
    md: "w-6 h-6",
    lg: "w-8 h-8", 
    xl: "w-10 h-10"
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
      scale: [1, 0.95, 1.1, 0.98, 1.05, 0.99, 1.02, 1],
      transition: {
        y: {
          duration: config.duration,
          ease: [0.25, 0.46, 0.45, 0.94], // Custom cubic-bezier for realistic bounce
          repeat: Infinity,
          repeatDelay: 0.8,
        },
        scale: {
          duration: config.duration,
          ease: "easeOut",
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
      {/* Shadow effect for depth */}
      <motion.div
        className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-2 w-8 h-2 bg-gray-400 rounded-full blur-sm`}
        variants={shadowVariants}
        animate="animate"
        initial={{ scale: 1, opacity: 0.3 }}
      />
      
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
          <Upload className={`${iconSizeClasses[size]} text-red-500 ${iconClassName}`} />
        )}
      </motion.div>
    </div>
  );
};
