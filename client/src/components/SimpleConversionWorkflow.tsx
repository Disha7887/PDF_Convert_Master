import React, { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, FileText, Download, Loader2, CheckCircle } from "lucide-react";

interface SimpleConversionWorkflowProps {
  toolType: string;
  toolTitle: string;
  acceptedFormats: string[];
  maxFileSize: string;
  toolIcon: React.ReactNode;
}

interface SimpleFile {
  id: string;
  file: File;
  status: 'ready' | 'converting' | 'completed' | 'failed';
  jobId?: number;
  downloadUrl?: string;
  errorMessage?: string;
}

export const SimpleConversionWorkflow: React.FC<SimpleConversionWorkflowProps> = ({
  toolType,
  toolTitle,
  acceptedFormats,
  maxFileSize,
  toolIcon
}) => {
  const [files, setFiles] = useState<SimpleFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const generateFileId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const isValidFileType = (file: File) => {
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    return acceptedFormats.includes(extension);
  };

  const handleFileSelect = useCallback((selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newFiles = Array.from(selectedFiles).map(file => ({
      id: generateFileId(),
      file,
      status: isValidFileType(file) ? 'ready' as const : 'failed' as const,
      errorMessage: !isValidFileType(file) ? 'File type not supported' : undefined
    }));

    setFiles(prev => [...prev, ...newFiles]);
  }, [acceptedFormats]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const triggerDownload = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const convertFiles = async () => {
    const readyFiles = files.filter(f => f.status === 'ready');
    if (readyFiles.length === 0) return;

    setIsConverting(true);

    for (const file of readyFiles) {
      try {
        // Update file status to converting
        setFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, status: 'converting' } : f
        ));

        // Upload and convert
        const formData = new FormData();
        formData.append('file', file.file);
        formData.append('toolType', toolType.replace(/-/g, '_'));
        formData.append('fileName', file.file.name);
        formData.append('fileSize', file.file.size.toString());
        formData.append('options', JSON.stringify({}));

        const response = await fetch('/api/convert', {
          method: 'POST',
          body: formData,
        });

        const responseData = await response.json();
        if (!responseData.success) {
          throw new Error(responseData.error || 'Conversion failed');
        }

        const jobId = responseData.data.jobId;

        // Poll for completion
        let attempts = 0;
        const maxAttempts = 60;
        
        while (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          const statusResponse = await fetch(`/api/jobs/${jobId}`);
          const statusData = await statusResponse.json();
          
          if (statusData.success && statusData.data.status === 'completed') {
            const downloadUrl = `/api/download/${jobId}`;
            const filename = statusData.data.outputFilename || file.file.name;
            
            // Update file status
            setFiles(prev => prev.map(f => 
              f.id === file.id ? { 
                ...f, 
                status: 'completed', 
                jobId, 
                downloadUrl 
              } : f
            ));

            // Auto-download
            setTimeout(() => triggerDownload(downloadUrl, filename), 500);
            break;
          } else if (statusData.success && statusData.data.status === 'failed') {
            throw new Error(statusData.data.errorMessage || 'Conversion failed');
          }
          
          attempts++;
        }

        if (attempts >= maxAttempts) {
          throw new Error('Conversion timed out');
        }

      } catch (error) {
        setFiles(prev => prev.map(f => 
          f.id === file.id ? { 
            ...f, 
            status: 'failed', 
            errorMessage: error instanceof Error ? error.message : 'Conversion failed'
          } : f
        ));
      }
    }

    setIsConverting(false);
    
    const completedCount = files.filter(f => f.status === 'completed').length;
    if (completedCount > 0) {
      toast({
        title: "Conversion Complete!",
        description: `${completedCount} file${completedCount !== 1 ? 's' : ''} converted and downloaded`,
      });
    }
  };

  const readyFiles = files.filter(f => f.status === 'ready');
  const hasFiles = files.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        
        {/* Simple Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-blue-50 border-2 border-blue-200 rounded-2xl flex items-center justify-center">
              {toolIcon}
            </div>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">{toolTitle}</h1>
          <p className="text-gray-500 text-sm">
            {acceptedFormats.map(f => f.toUpperCase().replace('.', '')).join(', ')} files only
          </p>
        </div>

        {/* Clean Upload Area */}
        <div onDrop={handleDrop}
             onDragOver={handleDragOver}
             onDragLeave={handleDragLeave}
             className={`bg-white rounded-xl shadow-sm border-2 border-dashed p-8 text-center mb-6 transition-colors ${
               isDragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-200'
             }`}>
          
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Drop files here or click to browse
          </h3>
          <p className="text-gray-500 text-sm mb-6">
            Maximum file size: {maxFileSize}
          </p>
          
          <Button 
            onClick={() => fileInputRef.current?.click()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 rounded-lg"
          >
            Browse Files
          </Button>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={acceptedFormats.join(',')}
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />
        </div>

        {/* Simple File List */}
        {hasFiles && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="space-y-3">
              {files.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded">
                      {file.status === 'converting' && <Loader2 className="w-4 h-4 animate-spin text-blue-600" />}
                      {file.status === 'completed' && <CheckCircle className="w-4 h-4 text-green-600" />}
                      {file.status === 'ready' && <FileText className="w-4 h-4 text-gray-600" />}
                      {file.status === 'failed' && <X className="w-4 h-4 text-red-600" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{file.file.name}</p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.file.size)}
                        {file.errorMessage && <span className="text-red-500 ml-2">• {file.errorMessage}</span>}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {file.status === 'completed' && file.downloadUrl && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => triggerDownload(file.downloadUrl!, file.file.name)}
                        className="text-xs"
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Download
                      </Button>
                    )}
                    {file.status !== 'converting' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeFile(file.id)}
                        className="text-gray-400 hover:text-red-500 p-1"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Simple Convert Button */}
        {readyFiles.length > 0 && (
          <div className="text-center">
            <Button
              onClick={convertFiles}
              disabled={isConverting || readyFiles.length === 0}
              className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-3 text-lg rounded-lg disabled:opacity-50"
            >
              {isConverting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Converting...
                </>
              ) : (
                `Convert ${readyFiles.length} file${readyFiles.length !== 1 ? 's' : ''}`
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};