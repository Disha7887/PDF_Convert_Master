import React from "react";
import { ToolPageShell } from "@/components/upload/ToolPageShell";

interface ImageToolShellProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
  children: React.ReactNode;
}

export const ImageToolShell: React.FC<ImageToolShellProps> = ({
  title,
  description,
  icon,
  iconBg,
  children,
}) => {
  return (
    <ToolPageShell
      title={title}
      description={description}
      icon={icon}
      iconBoxClassName={iconBg}
    >
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-5 md:p-8">
        {children}
      </div>
    </ToolPageShell>
  );
};
