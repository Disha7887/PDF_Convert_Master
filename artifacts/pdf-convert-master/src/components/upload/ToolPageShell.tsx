import React from "react";
import { ShieldCheck } from "lucide-react";
import { AnimatedBackground } from "@/components/ui/animated-background";

export interface ToolPageShellProps {
  /** Page heading. */
  title: string;
  /** Sub-heading shown under the title. */
  description: string;
  /** The icon element (already colored) rendered inside the rounded box. */
  icon: React.ReactNode;
  /** Tailwind border + background classes for the rounded icon box. */
  iconBoxClassName?: string;
  /** Optional assurance line under the description (hidden when omitted). */
  trustText?: React.ReactNode;
  /** Container max-width class. Defaults to max-w-5xl. */
  maxWidth?: string;
  /** Particle density for the animated background. */
  particleCount?: number;
  children: React.ReactNode;
}

/**
 * Shared page chrome for every tool page (PDF editor, image tools, conversion
 * workflow). Puts the homepage animated background behind a centered icon +
 * title + description header, with the tool's content sitting on top at z-10.
 * Content should stay on a solid white card for contrast against the background.
 */
export const ToolPageShell: React.FC<ToolPageShellProps> = ({
  title,
  description,
  icon,
  iconBoxClassName = "border-blue-100 bg-blue-50",
  trustText,
  maxWidth = "max-w-5xl",
  particleCount = 14,
  children,
}) => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-white">
      <AnimatedBackground particleCount={particleCount} className="opacity-60" />
      <div className={`relative z-10 w-full ${maxWidth} mx-auto px-4 sm:px-6 py-10`}>
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div
              className={`w-16 h-16 flex items-center justify-center rounded-2xl border-2 shadow-sm ${iconBoxClassName}`}
            >
              {icon}
            </div>
          </div>
          <h1
            className="text-3xl font-bold text-gray-900 mb-2"
            data-testid="text-tool-title"
          >
            {title}
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">{description}</p>
          {trustText && (
            <p className="inline-flex items-center gap-1.5 text-xs text-gray-400 mt-3">
              <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
              {trustText}
            </p>
          )}
        </div>
        {children}
      </div>
    </div>
  );
};

export default ToolPageShell;
