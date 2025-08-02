import React, { useMemo, memo } from "react";
import { motion } from "framer-motion";

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  opacity: number;
  duration: number;
  delay: number;
  direction: 'up' | 'down' | 'left' | 'right' | 'diagonal-up' | 'diagonal-down';
}

interface AnimatedParticlesProps {
  count?: number;
  className?: string;
  mobileCount?: number;
}

export const AnimatedParticles: React.FC<AnimatedParticlesProps> = memo(({
  count = 50,
  mobileCount,
  className = ""
}) => {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const effectiveCount = isMobile ? (mobileCount || Math.floor(count * 0.6)) : count;

  const particles = useMemo(() => {
    const particleArray: Particle[] = [];
    
    const colors = [
      'rgba(239, 68, 68, 0.3)',   // Red
      'rgba(249, 115, 22, 0.25)', // Orange
      'rgba(236, 72, 153, 0.2)',  // Pink
      'rgba(59, 130, 246, 0.15)', // Blue
      'rgba(168, 85, 247, 0.1)',  // Purple
      'rgba(255, 255, 255, 0.1)', // White
    ];

    const directions: Particle['direction'][] = [
      'up', 'down', 'left', 'right', 'diagonal-up', 'diagonal-down'
    ];

    for (let i = 0; i < effectiveCount; i++) {
      particleArray.push({
        id: i,
        x: Math.random() * 100, // Percentage
        y: Math.random() * 100, // Percentage
        size: Math.random() * 4 + 1, // 1px to 5px
        color: colors[Math.floor(Math.random() * colors.length)],
        opacity: Math.random() * 0.6 + 0.1, // 0.1 to 0.7
        duration: Math.random() * 20 + 15, // 15s to 35s
        delay: Math.random() * 10, // 0s to 10s
        direction: directions[Math.floor(Math.random() * directions.length)]
      });
    }
    
    return particleArray;
  }, [effectiveCount]);

  const getAnimationVariants = (particle: Particle) => {
    const moveDistance = 100; // pixels
    
    const movements = {
      up: { y: [-moveDistance, moveDistance] },
      down: { y: [moveDistance, -moveDistance] },
      left: { x: [-moveDistance, moveDistance] },
      right: { x: [moveDistance, -moveDistance] },
      'diagonal-up': { 
        x: [-moveDistance * 0.7, moveDistance * 0.7], 
        y: [-moveDistance * 0.7, moveDistance * 0.7] 
      },
      'diagonal-down': { 
        x: [moveDistance * 0.7, -moveDistance * 0.7], 
        y: [-moveDistance * 0.7, moveDistance * 0.7] 
      }
    };

    return {
      animate: {
        ...movements[particle.direction],
        opacity: [particle.opacity * 0.3, particle.opacity, particle.opacity * 0.3],
        transition: {
          duration: particle.duration,
          repeat: Infinity,
          repeatType: "reverse" as const,
          ease: "easeInOut",
          delay: particle.delay,
        }
      }
    };
  };

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none z-0 ${className}`}>
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full particle-layer"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            backgroundColor: particle.color,
            filter: 'blur(0.5px)',
          }}
          variants={getAnimationVariants(particle)}
          animate="animate"
          initial={{ opacity: 0 }}
        />
      ))}
      
      {/* Floating lines */}
      {Array.from({ length: 8 }).map((_, i) => (
        <motion.div
          key={`line-${i}`}
          className="absolute particle-layer"
          style={{
            left: `${Math.random() * 90}%`,
            top: `${Math.random() * 90}%`,
            width: `${Math.random() * 40 + 20}px`,
            height: '1px',
            background: `linear-gradient(90deg, transparent, ${
              ['rgba(239, 68, 68, 0.2)', 'rgba(249, 115, 22, 0.15)', 'rgba(255, 255, 255, 0.1)'][Math.floor(Math.random() * 3)]
            }, transparent)`,
            transform: `rotate(${Math.random() * 360}deg)`,
          }}
          animate={{
            opacity: [0, 0.8, 0],
            scale: [0.8, 1.2, 0.8],
            rotate: [0, 360],
          }}
          transition={{
            duration: Math.random() * 15 + 20,
            repeat: Infinity,
            ease: "easeInOut",
            delay: Math.random() * 5,
          }}
        />
      ))}

      {/* Pulsing dots */}
      {Array.from({ length: 12 }).map((_, i) => (
        <motion.div
          key={`pulse-dot-${i}`}
          className="absolute rounded-full particle-layer"
          style={{
            left: `${Math.random() * 95}%`,
            top: `${Math.random() * 95}%`,
            width: `${Math.random() * 3 + 2}px`,
            height: `${Math.random() * 3 + 2}px`,
            backgroundColor: [
              'rgba(239, 68, 68, 0.4)', 
              'rgba(249, 115, 22, 0.3)', 
              'rgba(255, 255, 255, 0.2)'
            ][Math.floor(Math.random() * 3)],
          }}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.2, 0.8, 0.2],
          }}
          transition={{
            duration: Math.random() * 3 + 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: Math.random() * 2,
          }}
        />
      ))}
    </div>
  );
});
