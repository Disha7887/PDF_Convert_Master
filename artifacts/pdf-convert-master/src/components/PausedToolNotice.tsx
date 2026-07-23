import React from "react";
import { Clock } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

/**
 * Friendly full-card notice shown on a tool's upload page when an admin has
 * temporarily paused that tool. Replaces the dropzone so visitors learn the
 * tool is unavailable BEFORE uploading a file (the server also rejects paused
 * conversions as a backstop).
 */
export const PausedToolNotice: React.FC<{ toolTitle: string }> = ({ toolTitle }) => {
  const [, setLocation] = useLocation();
  return (
    <div
      className="bg-white rounded-2xl shadow-xl border border-gray-200 px-6 py-12 flex flex-col items-center text-center"
      data-testid="notice-tool-paused"
    >
      <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-amber-50 border border-amber-200 mb-4">
        <Clock className="w-7 h-7 text-amber-500" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">
        Temporarily unavailable
      </h2>
      <p className="text-sm text-gray-600 max-w-md mb-6">
        {toolTitle} is paused for maintenance right now. Please check back
        soon — in the meantime, all our other tools are ready to go.
      </p>
      <Button
        onClick={() => setLocation("/tools")}
        className="h-11 px-6 bg-[#f7433d] hover:bg-[#e03a35] text-white font-semibold rounded-full"
        data-testid="button-paused-browse-tools"
      >
        Browse other tools
      </Button>
    </div>
  );
};
