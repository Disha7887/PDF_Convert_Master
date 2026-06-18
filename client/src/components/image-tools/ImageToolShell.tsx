import React from "react";

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="w-full max-w-5xl mx-auto p-4 md:p-6">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div
              className={`w-16 h-16 rounded-2xl border-2 ${iconBg} flex items-center justify-center shadow-lg`}
            >
              {icon}
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2" data-testid="text-tool-title">
            {title}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">{description}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-5 md:p-8">
          {children}
        </div>
      </div>
    </div>
  );
};
