import React, { useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { 
  Upload, 
  FileText, 
  Image, 
  FileSpreadsheet, 
  Presentation,
  Plus,
  CloudUpload,
  Sparkles
} from "lucide-react";
import { BouncingUploadIcon } from "@/components/ui/bouncing-upload-icon";

interface EnhancedUploadAreaProps {
  acceptedFormats: string[];
  maxFileSize: string;
  maxFiles?: number;
  onFilesSelected: (files: File[]) => void;
  isDragOver: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  isDisabled?: boolean;
  currentFileCount?: number;
  showAdvancedFeatures?: boolean;
}

export const EnhancedUploadArea: React.FC<EnhancedUploadAreaProps> = ({
  acceptedFormats,
  maxFileSize,
  maxFiles = 10,
  onFilesSelected,
  isDragOver,
  onDragOver,
  onDragLeave,
  onDrop,
  isDisabled = false,
  currentFileCount = 0,
  showAdvancedFeatures = true
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isHovering, setIsHovering] = useState(false);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onFilesSelected(files);
    }
    // Reset input to allow selecting the same files again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onFilesSelected]);

  const openFileDialog = () => {
    if (!isDisabled) {
      fileInputRef.current?.click();
    }
  };

  const getFileTypeIcon = (format: string) => {
    const ext = format.replace('.', '').toLowerCase();
    switch (ext) {
      case 'pdf':
        return <FileText className="w-6 h-6 text-red-500" />;
      case 'doc':
      case 'docx':
        return <FileText className="w-6 h-6 text-blue-500" />;
      case 'xls':
      case 'xlsx':
        return <FileSpreadsheet className="w-6 h-6 text-green-500" />;
      case 'ppt':
      case 'pptx':
        return <Presentation className="w-6 h-6 text-orange-500" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
        return <Image className="w-6 h-6 text-purple-500" />;
      default:
        return <FileText className="w-6 h-6 text-gray-500" />;
    }
  };

  const formatsList = acceptedFormats.map(f => f.replace('.', '').toUpperCase()).join(', ');
  const remainingSlots = maxFiles - currentFileCount;

  return (
    <div
      className={`
        relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 cursor-pointer
        ${isDragOver 
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/50 dark:border-blue-400 scale-105' 
          : isHovering && !isDisabled
          ? 'border-blue-400 bg-blue-25 dark:bg-blue-950/25 dark:border-blue-500'
          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        }
        ${isDisabled 
          ? 'opacity-50 cursor-not-allowed' 
          : 'hover:shadow-lg hover:scale-[1.02]'
        }
        bg-white dark:bg-gray-800
      `}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={openFileDialog}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFormats.join(',')}
        onChange={handleFileSelect}
        className="hidden"
        multiple
        disabled={isDisabled}
      />
      
      {/* Background Animation */}
      {isDragOver && (
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-2xl animate-pulse" />
      )}
      
      {/* Upload Icon */}
      <div className="flex justify-center mb-6">
        {isDragOver ? (
          <div className="relative">
            <CloudUpload className="w-16 h-16 text-blue-500 animate-bounce" />
            <Sparkles className="w-6 h-6 text-yellow-400 absolute -top-2 -right-2 animate-pulse" />
          </div>
        ) : (
          <BouncingUploadIcon
            size="xl"
            animationSpeed={isHovering ? "fast" : "normal"}
            bgColor="bg-blue-100 dark:bg-blue-900"
          />
        )}
      </div>
      
      {/* Main Text */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          {isDragOver 
            ? `Drop your ${formatsList} files here!` 
            : currentFileCount > 0 
            ? `Add more ${formatsList} files`
            : `Drop your ${formatsList} files here`
          }
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {isDragOver 
            ? 'Release to add files to your conversion queue'
            : 'or click to browse and select multiple files'
          }
        </p>
        
        {/* File Limit Info */}
        {remainingSlots > 0 ? (
          <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
            You can add {remainingSlots} more file{remainingSlots !== 1 ? 's' : ''} 
            {currentFileCount > 0 && ` (${currentFileCount}/${maxFiles} selected)`}
          </p>
        ) : (
          <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">
            Maximum files reached ({maxFiles}/{maxFiles})
          </p>
        )}
      </div>
      
      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-6">
        <Button 
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105"
          disabled={isDisabled || remainingSlots <= 0}
        >
          <Plus className="w-5 h-5 mr-2" />
          {currentFileCount > 0 ? 'Add More Files' : 'Select Files'}
        </Button>
        
        {showAdvancedFeatures && (
          <Button 
            variant="outline" 
            className="px-6 py-3 rounded-lg font-medium hover:scale-105 transition-all duration-200"
            disabled={isDisabled}
          >
            <Upload className="w-4 h-4 mr-2" />
            Browse Computer
          </Button>
        )}
      </div>
      
      {/* Supported Formats */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 font-medium">
          Supported formats:
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {acceptedFormats.map((format) => (
            <div 
              key={format}
              className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 rounded-full px-3 py-1"
            >
              {getFileTypeIcon(format)}
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                {format.replace('.', '').toUpperCase()}
              </span>
            </div>
          ))}
        </div>
        
        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <p>• Maximum file size: {maxFileSize} per file</p>
          <p>• Maximum {maxFiles} files at once</p>
          <p>• Files are processed securely and deleted after conversion</p>
        </div>
      </div>
      
      {/* Visual Enhancement */}
      {isDragOver && (
        <div className="absolute inset-4 border-2 border-dashed border-blue-400 rounded-xl opacity-50 animate-pulse" />
      )}
    </div>
  );
};