import React, { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, Shield, Zap, Download, X } from "lucide-react";
import { BouncingUploadIcon } from "@/components/ui/bouncing-upload-icon";

interface ToolConfig {
  id: string;
  name: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
  acceptedFormats: string[];
  maxFileSize: number; // in MB
}

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  toolConfig: ToolConfig;
  onFileUpload?: (files: File[]) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({ 
  isOpen,
  onClose,
  toolConfig, 
  onFileUpload 
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, [toolConfig]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
  }, [toolConfig]);

  const handleFiles = (files: File[]) => {
    // Filter files based on accepted formats
    const validFiles = files.filter(file => {
      const extension = '.' + file.name.split('.').pop()?.toLowerCase();
      return toolConfig.acceptedFormats.includes(extension);
    });

    if (validFiles.length !== files.length) {
      alert(`Some files were rejected. Only ${toolConfig.acceptedFormats.join(', ')} files are accepted.`);
    }

    setUploadedFiles(validFiles);
    onFileUpload?.(validFiles);
  };

  const handleSelectFiles = () => {
    fileInputRef.current?.click();
  };

  const handleStartConversion = async () => {
    setIsProcessing(true);
    
    // Simulate processing
    setTimeout(() => {
      setIsProcessing(false);
      alert(`Conversion completed! ${uploadedFiles.length} file(s) processed.`);
      handleClose();
    }, 2000);
  };

  const handleClose = () => {
    setUploadedFiles([]);
    setIsProcessing(false);
    setIsDragOver(false);
    onClose();
  };

  const getFileTypeText = () => {
    const formats = toolConfig.acceptedFormats.join(', ').toUpperCase();
    return formats.replace(/\./g, '');
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className={`w-12 h-12 rounded-2xl border-2 ${toolConfig.iconBg} flex items-center justify-center`}>
              {toolConfig.icon}
            </div>
            {toolConfig.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Description */}
          <p className="text-gray-600">
            {toolConfig.description}
          </p>

          {/* Upload Area */}
          <div
            className={`
              relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer
              ${isDragOver 
                ? 'border-red-400 bg-red-50' 
                : 'border-gray-300 hover:border-gray-400 bg-gray-50'
              }
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleSelectFiles}
          >
            {/* Upload Icon */}
            <div className="flex justify-center mb-4">
              <BouncingUploadIcon
                size="lg"
                animationSpeed="fast"
                bgColor="bg-red-100"
              />
            </div>

            {/* Upload Text */}
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Drop your {getFileTypeText()} file here
            </h3>
            <p className="text-gray-600 mb-4">
              or click to browse files
            </p>

            {/* Select Files Button */}
            <Button
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
              onClick={(e) => {
                e.stopPropagation();
                handleSelectFiles();
              }}
            >
              Select Files
            </Button>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple={toolConfig.id === "merge-pdfs"}
              accept={toolConfig.acceptedFormats.join(',')}
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* File Info */}
            <p className="text-xs text-gray-500 mt-3">
              Supported: {getFileTypeText()} • Max: {toolConfig.maxFileSize}MB
            </p>
          </div>

          {/* Uploaded Files Display */}
          {uploadedFiles.length > 0 && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2">
                Files Ready for Conversion:
              </h4>
              <ul className="space-y-1 mb-4">
                {uploadedFiles.map((file, index) => (
                  <li key={index} className="text-green-700 text-sm flex items-center justify-between">
                    <span>{file.name}</span>
                    <span className="text-xs text-green-600">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </li>
                ))}
              </ul>
              <Button 
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                onClick={handleStartConversion}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </div>
                ) : (
                  'Start Conversion'
                )}
              </Button>
            </div>
          )}

          {/* Features */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-2">
                <Shield className="w-4 h-4 text-blue-600" />
              </div>
              <h4 className="text-sm font-medium text-gray-900 mb-1">Secure</h4>
              <p className="text-xs text-gray-600">Browser processing</p>
            </div>

            <div className="text-center">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
                <Zap className="w-4 h-4 text-green-600" />
              </div>
              <h4 className="text-sm font-medium text-gray-900 mb-1">Fast</h4>
              <p className="text-xs text-gray-600">Lightning speed</p>
            </div>

            <div className="text-center">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-2">
                <Download className="w-4 h-4 text-purple-600" />
              </div>
              <h4 className="text-sm font-medium text-gray-900 mb-1">Easy</h4>
              <p className="text-xs text-gray-600">Instant download</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
