import React, { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  FileCheck,
  Settings,
  Trash2,
  RefreshCw
} from "lucide-react";
import { EnhancedUploadArea } from "@/components/ui/enhanced-upload-area";
import { FileItem } from "@/components/ui/file-item";

interface ConversionWorkflowProps {
  toolType: string;
  toolTitle: string;
  toolDescription: string;
  acceptedFormats: string[];
  maxFileSize: string;
  outputFormat: string;
  toolIcon: React.ReactNode;
  iconBg: string;
}

interface FileUpload {
  id: string;
  file: File;
  status: 'pending' | 'validating' | 'valid' | 'invalid' | 'converting' | 'completed' | 'failed';
  progress: number;
  jobId?: number;
  errorMessage?: string;
  validationMessage?: string;
  downloadUrl?: string;
}

type ConversionStage = 'upload' | 'files-selected' | 'converting' | 'completed' | 'error';

export const ConversionWorkflow: React.FC<ConversionWorkflowProps> = ({
  toolType,
  toolTitle,
  toolDescription,
  acceptedFormats,
  maxFileSize,
  outputFormat,
  toolIcon,
  iconBg
}) => {
  const [stage, setStage] = useState<ConversionStage>('upload');
  const [selectedFiles, setSelectedFiles] = useState<FileUpload[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);
  const [isConverting, setIsConverting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const maxFiles = 10;
  const maxSizeInBytes = parseFloat(maxFileSize) * 1024 * 1024;

  const generateFileId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

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
    if (files.length > 0) {
      handleFilesSelection(files);
    }
  }, [selectedFiles]);

  const handleFilesSelection = useCallback((newFiles: File[]) => {
    const remainingSlots = maxFiles - selectedFiles.length;
    const filesToAdd = newFiles.slice(0, remainingSlots);
    
    if (filesToAdd.length === 0) {
      toast({
        title: "Maximum files reached",
        description: `You can only select up to ${maxFiles} files at once`,
        variant: "destructive"
      });
      return;
    }

    const validatedFiles: FileUpload[] = filesToAdd.map(file => {
      const fileUpload: FileUpload = {
        id: generateFileId(),
        file,
        status: 'validating',
        progress: 0
      };

      // Validate file format
      const extension = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!acceptedFormats.includes(extension)) {
        fileUpload.status = 'invalid';
        fileUpload.errorMessage = `Invalid file format. Expected: ${acceptedFormats.join(', ')}`;
        return fileUpload;
      }

      // Validate file size
      if (file.size > maxSizeInBytes) {
        fileUpload.status = 'invalid';
        fileUpload.errorMessage = `File size exceeds ${maxFileSize}`;
        return fileUpload;
      }

      // File is valid
      fileUpload.status = 'valid';
      fileUpload.validationMessage = 'Ready for conversion';
      return fileUpload;
    });

    setSelectedFiles(prev => [...prev, ...validatedFiles]);
    setStage('files-selected');
    setErrorMessage(null);
    
    const validCount = validatedFiles.filter(f => f.status === 'valid').length;
    const invalidCount = validatedFiles.filter(f => f.status === 'invalid').length;
    
    toast({
      title: `${validCount} file${validCount !== 1 ? 's' : ''} added`,
      description: invalidCount > 0 
        ? `${invalidCount} file${invalidCount !== 1 ? 's' : ''} had validation errors`
        : "Files are ready for conversion",
      variant: invalidCount > 0 ? "destructive" : "default"
    });
  }, [selectedFiles, maxFiles, acceptedFormats, maxSizeInBytes, maxFileSize, toast]);

  const removeFile = useCallback((index: number) => {
    const fileToRemove = selectedFiles[index];
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    
    if (selectedFiles.length === 1) {
      setStage('upload');
    }
    
    toast({
      title: "File removed",
      description: `${fileToRemove.file.name} has been removed`,
    });
  }, [selectedFiles]);

  const clearAllFiles = useCallback(() => {
    setSelectedFiles([]);
    setStage('upload');
    setBatchProgress(0);
    setIsConverting(false);
    setErrorMessage(null);
    
    toast({
      title: "All files cleared",
      description: "File selection has been reset",
    });
  }, []);

  const startBatchConversion = async () => {
    const validFiles = selectedFiles.filter(f => f.status === 'valid');
    if (validFiles.length === 0) return;

    setStage('converting');
    setIsConverting(true);
    setBatchProgress(0);
    setErrorMessage(null);

    // Mark all valid files as converting
    setSelectedFiles(prev => prev.map(file => 
      file.status === 'valid' 
        ? { ...file, status: 'converting', progress: 0 }
        : file
    ));

    try {
      // Process all files and wait for completion
      await Promise.all(validFiles.map((fileUpload, index) => 
        processIndividualFile(fileUpload, index, validFiles.length)
      ));

      // Note: completion state will be set by checkBatchCompletion
      // after all individual files are actually completed
      
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Batch conversion failed');
      setStage('error');
      setIsConverting(false);
      
      toast({
        title: "Conversion Failed",
        description: "Please try again or contact support",
        variant: "destructive",
      });
    }
  };

  const processIndividualFile = async (fileUpload: FileUpload, index: number, total: number) => {
    return new Promise<void>((resolve, reject) => {
      const processFile = async () => {
        try {
          // Create FormData for file upload
          const formData = new FormData();
          formData.append('file', fileUpload.file);
          formData.append('toolType', toolType.replace(/-/g, '_'));
          formData.append('fileName', fileUpload.file.name);
          formData.append('fileSize', fileUpload.file.size.toString());
          formData.append('options', JSON.stringify({}));

          // Start conversion job with file upload
          const response = await fetch('/api/convert', {
            method: 'POST',
            body: formData,
          });

          const responseData = await response.json();

          if (!responseData.success) {
            throw new Error(responseData.error || 'Conversion failed');
          }

          const jobData = responseData.data;
          
          // Start polling and wait for completion
          await pollJobStatus(fileUpload.id, jobData.jobId, resolve, reject);
          
        } catch (error) {
          // Mark file as failed
          setSelectedFiles(prev => prev.map(f => 
            f.id === fileUpload.id 
              ? { 
                  ...f, 
                  status: 'failed' as const, 
                  errorMessage: error instanceof Error ? error.message : 'Conversion failed'
                }
              : f
          ));
          reject(error);
        }
      };
      processFile();
    });
  };

  const pollJobStatus = async (fileId: string, jobId: number, resolve?: () => void, reject?: (error: any) => void) => {
    let attempts = 0;
    const maxAttempts = 60; // 90 seconds max (optimized for faster processing)
    
    const poll = async (): Promise<void> => {
      try {
        const response = await fetch(`/api/jobs/${jobId}`);
        const responseData = await response.json();
        
        if (!responseData.success) {
          throw new Error('Failed to get job status');
        }

        const job = responseData.data;
        
        if (job.status === 'completed') {
          // File completed successfully
          setSelectedFiles(prev => {
            const updated = prev.map(f => 
              f.id === fileId 
                ? { 
                    ...f, 
                    status: 'completed' as const, 
                    progress: 100,
                    downloadUrl: `/api/download/${jobId}`
                  }
                : f
            );
            
            // Check if this was the last file to complete
            setTimeout(() => checkBatchCompletion(updated), 100);
            return updated;
          });
          
          resolve?.();
          return;
        } else if (job.status === 'failed') {
          // File failed
          setSelectedFiles(prev => {
            const updated = prev.map(f => 
              f.id === fileId 
                ? { 
                    ...f, 
                    status: 'failed' as const, 
                    errorMessage: job.errorMessage || 'Conversion failed'
                  }
                : f
            );
            
            // Check batch completion even with failures
            setTimeout(() => checkBatchCompletion(updated), 100);
            return updated;
          });
          
          reject?.(new Error(job.errorMessage || 'Conversion failed'));
          return;
        } else if (job.status === 'processing') {
          // Update progress - more responsive progress calculation
          const baseProgress = 10; // Start at 10%
          const progressIncrement = Math.min((attempts * 3), 85); // 3% per attempt, max 85%
          const progress = Math.min(baseProgress + progressIncrement, 95); // Cap at 95% until completion
          
          setSelectedFiles(prev => prev.map(f => 
            f.id === fileId ? { ...f, progress } : f
          ));
        }

        // Continue polling if not finished
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 1500);
        } else {
          // Timeout - mark as failed
          console.error(`Job ${jobId} timed out after ${maxAttempts} attempts`);
          const timeoutError = new Error('Processing took longer than expected');
          setSelectedFiles(prev => {
            const updated = prev.map(f => 
              f.id === fileId 
                ? { 
                    ...f, 
                    status: 'failed' as const, 
                    errorMessage: timeoutError.message 
                  }
                : f
            );
            
            setTimeout(() => checkBatchCompletion(updated), 100);
            return updated;
          });
          
          reject?.(timeoutError);
        }
      } catch (error) {
        console.error(`Polling error for job ${jobId} (attempt ${attempts}):`, error);
        
        // Only mark as failed if we've exhausted all attempts or it's a final timeout
        if (attempts >= maxAttempts - 1) {
          const apiError = new Error(`Unable to check status after ${maxAttempts} attempts`);
          setSelectedFiles(prev => {
            const updated = prev.map(f => 
              f.id === fileId 
                ? { 
                    ...f, 
                    status: 'failed' as const, 
                    errorMessage: apiError.message 
                  }
                : f
            );
            
            setTimeout(() => checkBatchCompletion(updated), 100);
            return updated;
          });
          
          reject?.(apiError);
        } else {
          // Continue polling on temporary errors
          console.log(`Retrying status check for job ${jobId}, attempt ${attempts + 1}/${maxAttempts}`);
          attempts++;
          setTimeout(poll, 2000); // Longer delay on error
        }
      }
    };

    // Start polling after 500ms
    setTimeout(poll, 500);
  };

  const downloadIndividualFile = (index: number) => {
    const file = selectedFiles[index];
    if (file?.downloadUrl) {
      window.open(file.downloadUrl, '_blank');
      
      toast({
        title: "Download Started",
        description: `${file.file.name} is being downloaded`,
      });
    }
  };

  const downloadAllFiles = () => {
    const completedFiles = selectedFiles.filter(f => f.status === 'completed' && f.downloadUrl);
    
    completedFiles.forEach((file, index) => {
      setTimeout(() => {
        if (file.downloadUrl) {
          window.open(file.downloadUrl, '_blank');
        }
      }, index * 500);
    });
    
    toast({
      title: "Downloads Started",
      description: `${completedFiles.length} file${completedFiles.length !== 1 ? 's' : ''} are being downloaded`,
    });
  };

  const checkBatchCompletion = (files: FileUpload[]) => {
    const convertingFiles = files.filter(f => f.status === 'converting');
    const completedFiles = files.filter(f => f.status === 'completed');
    const failedFiles = files.filter(f => f.status === 'failed');
    const totalProcessingFiles = convertingFiles.length + completedFiles.length + failedFiles.length;
    
    // Update batch progress
    if (totalProcessingFiles > 0) {
      const progress = Math.round(((completedFiles.length + failedFiles.length) / totalProcessingFiles) * 100);
      setBatchProgress(progress);
    }
    
    // Check if all files are done processing (completed or failed)
    if (convertingFiles.length === 0 && totalProcessingFiles > 0) {
      // All files are done
      setStage('completed');
      setBatchProgress(100);
      setIsConverting(false);
      
      // Show completion toast with actual counts
      toast({
        title: "Conversions Complete!",
        description: `${completedFiles.length} file${completedFiles.length !== 1 ? 's' : ''} converted successfully. Download buttons are now available.`,
      });
      
      if (failedFiles.length > 0) {
        // Also show failure notification if some failed
        setTimeout(() => {
          toast({
            title: "Some files failed",
            description: `${failedFiles.length} file${failedFiles.length !== 1 ? 's' : ''} could not be converted`,
            variant: "destructive",
          });
        }, 1000);
      }
    }
  };

  const resetWorkflow = () => {
    setStage('upload');
    setSelectedFiles([]);
    setBatchProgress(0);
    setIsConverting(false);
    setErrorMessage(null);
    setIsDragOver(false);
  };

  const validFilesCount = selectedFiles.filter(f => f.status === 'valid').length;
  const completedFilesCount = selectedFiles.filter(f => f.status === 'completed').length;
  const hasValidFiles = validFilesCount > 0;
  const hasCompletedFiles = completedFilesCount > 0;

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className={`w-16 h-16 rounded-2xl border-2 ${iconBg} flex items-center justify-center shadow-lg`}>
            {toolIcon}
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{toolTitle}</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">{toolDescription}</p>
      </div>

      {/* Main Workflow Card */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        
        {/* Progress Indicator */}
        <div className="px-6 py-4 bg-gray-50 border-b">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-4">
              <div className={`flex items-center space-x-2 ${stage === 'upload' || stage === 'files-selected' ? 'text-blue-600' : stage === 'converting' ? 'text-yellow-600' : stage === 'completed' ? 'text-green-600' : 'text-red-600'}`}>
                {stage === 'upload' && <Upload className="w-4 h-4" />}
                {stage === 'files-selected' && <FileCheck className="w-4 h-4" />}
                {stage === 'converting' && <Settings className="w-4 h-4 animate-spin" />}
                {stage === 'completed' && <CheckCircle className="w-4 h-4" />}
                {stage === 'error' && <AlertCircle className="w-4 h-4" />}
                <span className="text-sm font-medium capitalize">{stage}</span>
              </div>
            </div>
            {selectedFiles.length > 0 && (
              <div className="text-sm text-gray-500">
                {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
              </div>
            )}
          </div>
          
          {stage === 'converting' && (
            <Progress value={batchProgress} className="h-2" />
          )}
        </div>

        {/* Content Area */}
        <div className="p-8">
          
          {/* Upload Stage */}
          {stage === 'upload' && (
            <EnhancedUploadArea
              acceptedFormats={acceptedFormats}
              maxFileSize={maxFileSize}
              maxFiles={maxFiles}
              onFilesSelected={handleFilesSelection}
              isDragOver={isDragOver}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              currentFileCount={selectedFiles.length}
              showAdvancedFeatures={true}
            />
          )}

          {/* Files Selected Stage */}
          {stage === 'files-selected' && selectedFiles.length > 0 && (
            <div className="space-y-6">
              {/* File Management Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {selectedFiles.length} File{selectedFiles.length !== 1 ? 's' : ''} Selected
                  </h3>
                  <p className="text-gray-600">
                    {validFilesCount} ready • {selectedFiles.length - validFilesCount} with issues
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={clearAllFiles}
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Clear All
                  </Button>
                </div>
              </div>

              {/* File List */}
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {selectedFiles.map((fileUpload, index) => (
                  <FileItem
                    key={fileUpload.id}
                    file={fileUpload.file}
                    index={index}
                    status={fileUpload.status}
                    progress={fileUpload.progress}
                    errorMessage={fileUpload.errorMessage}
                    validationMessage={fileUpload.validationMessage}
                    downloadUrl={fileUpload.downloadUrl}
                    onRemove={removeFile}
                    onDownload={downloadIndividualFile}
                  />
                ))}
              </div>

              {/* Add More Files Area */}
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-4">
                <EnhancedUploadArea
                  acceptedFormats={acceptedFormats}
                  maxFileSize={maxFileSize}
                  maxFiles={maxFiles}
                  onFilesSelected={handleFilesSelection}
                  isDragOver={isDragOver}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  currentFileCount={selectedFiles.length}
                  showAdvancedFeatures={false}
                />
              </div>

              {/* Action Buttons */}
              {hasValidFiles && (
                <div className="flex justify-center space-x-4 pt-4">
                  <Button
                    onClick={startBatchConversion}
                    className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3"
                    disabled={isConverting}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Convert {validFilesCount} File{validFilesCount !== 1 ? 's' : ''} to {outputFormat.toUpperCase()}
                  </Button>
                  <Button
                    onClick={resetWorkflow}
                    variant="outline"
                    className="px-8 py-3"
                    disabled={isConverting}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Start Over
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Converting Stage */}
          {stage === 'converting' && (
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <Settings className="w-16 h-16 text-orange-600 animate-spin" />
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">Converting Files...</h3>
                <p className="text-gray-600">Please wait while we process your files</p>
              </div>
              
              {/* File List During Conversion */}
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {selectedFiles.map((fileUpload, index) => (
                  <FileItem
                    key={fileUpload.id}
                    file={fileUpload.file}
                    index={index}
                    status={fileUpload.status}
                    progress={fileUpload.progress}
                    errorMessage={fileUpload.errorMessage}
                    validationMessage={fileUpload.validationMessage}
                    downloadUrl={fileUpload.downloadUrl}
                    onRemove={removeFile}
                    onDownload={downloadIndividualFile}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Completed Stage */}
          {stage === 'completed' && (
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <CheckCircle className="w-16 h-16 text-green-600" />
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">Conversion Complete!</h3>
                <p className="text-gray-600">Your files have been successfully converted</p>
              </div>
              
              {/* File List After Completion */}
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {selectedFiles.map((fileUpload, index) => (
                  <FileItem
                    key={fileUpload.id}
                    file={fileUpload.file}
                    index={index}
                    status={fileUpload.status}
                    progress={fileUpload.progress}
                    errorMessage={fileUpload.errorMessage}
                    validationMessage={fileUpload.validationMessage}
                    downloadUrl={fileUpload.downloadUrl}
                    onRemove={removeFile}
                    onDownload={downloadIndividualFile}
                  />
                ))}
              </div>

              {/* Download Actions */}
              {hasCompletedFiles && (
                <div className="flex justify-center space-x-4 pt-4">
                  <Button
                    onClick={downloadAllFiles}
                    className="bg-green-600 hover:bg-green-700 text-white px-8 py-3"
                  >
                    Download All Files
                  </Button>
                  <Button
                    onClick={resetWorkflow}
                    variant="outline"
                    className="px-8 py-3"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Convert More Files
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Error Stage */}
          {stage === 'error' && errorMessage && (
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <AlertCircle className="w-16 h-16 text-red-600" />
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">Conversion Failed</h3>
                <p className="text-red-600">{errorMessage}</p>
              </div>
              <Button
                onClick={resetWorkflow}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
              >
                Try Again
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};