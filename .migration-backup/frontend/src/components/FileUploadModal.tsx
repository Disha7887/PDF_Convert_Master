import React, { useState, useCallback } from "react";
import { X, Upload, Shield, Zap, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BouncingUploadIcon } from "@/components/ui/bouncing-upload-icon";

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  toolTitle: string;
  toolDescription: string;
  toolIcon: React.ReactNode;
  toolIconBgColor: string;
  toolIconBorderColor: string;
}

export const FileUploadModal: React.FC<FileUploadModalProps> = ({
  isOpen,
  onClose,
  toolTitle,
  toolDescription,
  toolIcon,
  toolIconBgColor,
  toolIconBorderColor,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    setSelectedFiles(files);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles(files);
    }
  }, []);

  const getFileTypeText = () => {
    if (toolTitle.toLowerCase().includes('repair')) {
      return 'Drop your corrupted PDF here';
    }
    if (toolTitle.toLowerCase().includes('pdf')) {
      return 'Drop your PDF files here';
    }
    return 'Drop your files here';
  };

  const getButtonText = () => {
    if (toolTitle.toLowerCase().includes('pdf')) {
      return 'Select PDF File';
    }
    return 'Select Files';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl shadow-2xl">
          {/* Close Button */}
          <div className="absolute top-4 right-4 z-10">
            <Button
              onClick={onClose}
              variant="outline"
              size="icon"
              className="w-8 h-8 rounded-full bg-red-50 border-red-200 hover:bg-red-100"
            >
              <X className="w-4 h-4 text-red-500" />
            </Button>
          </div>

          {/* Content */}
          <div className="px-4 py-8 sm:px-6">
            <div className="w-full">
              
              {/* Header */}
              <div className="text-center mb-6">
                {/* Tool Icon */}
                <div className="flex justify-center mb-4">
                  <div className={`w-12 h-12 p-2 flex items-center justify-center rounded-xl border-2 ${toolIconBorderColor} ${toolIconBgColor} shadow-lg`}>
                    <div className="w-6 h-6 flex items-center justify-center">
                      {toolIcon}
                    </div>
                  </div>
                </div>

                {/* Title */}
                <h1 className="text-xl font-bold text-gray-900 mb-3">
                  {toolTitle}
                </h1>

                {/* Description */}
                <p className="text-sm text-gray-600 px-2">
                  {toolDescription}
                </p>
              </div>

              {/* Upload Area */}
              <div className="mb-6">
                <div
                  className={`relative w-full h-48 p-4 border-2 border-dashed rounded-xl transition-all duration-200 ${
                    isDragOver
                      ? 'border-red-400 bg-red-50'
                      : 'border-gray-300 bg-white'
                  } shadow-lg hover:shadow-xl`}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  {/* Upload Icon */}
                  <div className="flex justify-center mb-3">
                    <BouncingUploadIcon
                      size="md"
                      animationSpeed="fast"
                      bgColor="bg-red-50"
                    />
                  </div>

                  {/* Upload Text */}
                  <div className="text-center mb-3">
                    <h3 className="text-base font-bold text-gray-900 mb-1">
                      {getFileTypeText()}
                    </h3>
                    <p className="text-xs text-gray-500 mb-3">
                      or click to browse files
                    </p>
                  </div>

                  {/* File Input Button - Centered and properly positioned */}
                  <div className="flex justify-center">
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        multiple
                        accept=".pdf"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <div className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium text-sm rounded-lg shadow-lg hover:shadow-xl transition-all">
                        {getButtonText()}
                      </div>
                    </label>
                  </div>

                  {/* Selected Files */}
                  {selectedFiles.length > 0 && (
                    <div className="mt-3 text-center">
                      <p className="text-xs text-gray-600">
                        {selectedFiles.length} file(s) selected
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Features */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Secure Processing */}
                <div className="bg-white rounded-lg p-3 shadow-md hover:shadow-lg transition-shadow">
                  <div className="flex justify-center mb-2">
                    <div className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-50">
                      <Shield className="w-3 h-3 text-blue-600" />
                    </div>
                  </div>
                  <h3 className="text-xs font-semibold text-gray-900 text-center mb-1">
                    Secure Processing
                  </h3>
                  <p className="text-[10px] text-gray-600 text-center leading-relaxed">
                    Your files are processed securely and deleted after conversion
                  </p>
                </div>

                {/* Fast Conversion */}
                <div className="bg-white rounded-lg p-3 shadow-md hover:shadow-lg transition-shadow">
                  <div className="flex justify-center mb-2">
                    <div className="w-8 h-8 flex items-center justify-center rounded-full bg-green-50">
                      <Zap className="w-3 h-3 text-green-600" />
                    </div>
                  </div>
                  <h3 className="text-xs font-semibold text-gray-900 text-center mb-1">
                    Fast Conversion
                  </h3>
                  <p className="text-[10px] text-gray-600 text-center leading-relaxed">
                    Lightning-fast processing with high-quality results
                  </p>
                </div>

                {/* Easy Download */}
                <div className="bg-white rounded-lg p-3 shadow-md hover:shadow-lg transition-shadow">
                  <div className="flex justify-center mb-2">
                    <div className="w-8 h-8 flex items-center justify-center rounded-full bg-purple-50">
                      <Download className="w-3 h-3 text-purple-600" />
                    </div>
                  </div>
                  <h3 className="text-xs font-semibold text-gray-900 text-center mb-1">
                    Easy Download
                  </h3>
                  <p className="text-[10px] text-gray-600 text-center leading-relaxed">
                    Download your converted files instantly after processing
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
