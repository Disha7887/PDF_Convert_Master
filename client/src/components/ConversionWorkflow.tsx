import React, { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { 
  Upload, 
  FileText, 
  Download, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  FileCheck,
  Settings,
  Clock,
  Trash2,
  Archive,
  RefreshCw
} from "lucide-react";
import { BouncingUploadIcon } from "@/components/ui/bouncing-upload-icon";
import { EnhancedUploadArea } from "@/components/ui/enhanced-upload-area";
import { FileItem } from "@/components/ui/file-item";
import { BatchProgressTracker } from "@/components/ui/batch-progress-tracker";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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

interface ConversionJob {
  jobId: number;
  status: string;
  inputFilename: string;
  outputFilename?: string;
  processingTime?: number;
  errorMessage?: string;
  downloadUrl?: string;
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
  job?: ConversionJob;
}

interface BatchJob {
  id: string;
  fileName: string;
  status: 'pending' | 'converting' | 'completed' | 'failed';
  progress: number;
  errorMessage?: string;
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
  const [isPaused, setIsPaused] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
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
    setIsPaused(false);
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
      // Process files one by one (can be enhanced for parallel processing)
      for (let i = 0; i < validFiles.length; i++) {
        const fileUpload = validFiles[i];
        await processIndividualFile(fileUpload, i, validFiles.length);
      }

      // Wait for all state updates to complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check completion status using state callback to get current state
      setSelectedFiles(currentFiles => {
        const completedFiles = currentFiles.filter(f => f.status === 'completed');
        const failedFiles = currentFiles.filter(f => f.status === 'failed');
        const processedFiles = validFiles.length;
        
        if (completedFiles.length === processedFiles) {
          setStage('completed');
          setBatchProgress(100);
          
          toast({
            title: "All Conversions Complete!",
            description: `${completedFiles.length} file${completedFiles.length !== 1 ? 's' : ''} converted successfully`,
          });
        } else if (completedFiles.length + failedFiles.length === processedFiles) {
          // Some completed, some failed
          setStage('completed');
          setBatchProgress(100);
          
          toast({
            title: "Batch Conversion Finished",
            description: `${completedFiles.length} completed, ${failedFiles.length} failed`,
            variant: failedFiles.length > 0 ? "destructive" : "default"
          });
        } else {
          // Still processing or unknown state - wait a bit more
          setTimeout(() => {
            setSelectedFiles(finalFiles => {
              const finalCompleted = finalFiles.filter(f => f.status === 'completed');
              const finalFailed = finalFiles.filter(f => f.status === 'failed');
              
              setStage('completed');
              setBatchProgress(100);
              
              toast({
                title: "Batch Conversion Finished",
                description: `${finalCompleted.length} completed, ${finalFailed.length} failed`,
                variant: finalFailed.length > 0 ? "destructive" : "default"
              });
              
              return finalFiles;
            });
          }, 1000);
        }
        
        return currentFiles;
      });

    } catch (error) {
      console.error('Batch conversion error:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Batch conversion failed');
      setStage('error');
      
      toast({
        title: "Conversion Failed",
        description: "Please try again or contact support",
        variant: "destructive",
      });
    } finally {
      setIsConverting(false);
    }
  };

  const processIndividualFile = async (fileUpload: FileUpload, index: number, total: number) => {
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
      
      // Update file with job info
      setSelectedFiles(prev => prev.map(f => 
        f.id === fileUpload.id 
          ? { ...f, jobId: jobData.jobId, job: jobData }
          : f
      ));

      // Poll for job status
      await pollIndividualJobStatus(fileUpload.id, jobData.jobId, index, total);
      
    } catch (error) {
      console.error(`Conversion error for ${fileUpload.file.name}:`, error);
      
      // Mark file as failed
      setSelectedFiles(prev => prev.map(f => 
        f.id === fileUpload.id 
          ? { 
              ...f, 
              status: 'failed', 
              errorMessage: error instanceof Error ? error.message : 'Conversion failed'
            }
          : f
      ));
    }
  };

  const pollIndividualJobStatus = async (fileId: string, jobId: number, fileIndex: number, totalFiles: number) => {
    let attempts = 0;
    const maxAttempts = 60; // 2 minutes max
    
    const poll = async () => {
      try {
        const response = await fetch(`/api/jobs/${jobId}`);
        const responseData = await response.json();
        
        if (!responseData.success) {
          throw new Error('Failed to get job status');
        }

        const job = responseData.data;
        
        // Update file progress based on status
        setSelectedFiles(prev => prev.map(f => {
          if (f.id === fileId) {
            if (job.status === 'processing') {
              const progress = Math.min(30 + (attempts * 2), 90);
              return { ...f, progress, job };
            } else if (job.status === 'completed') {
              return { 
                ...f, 
                status: 'completed', 
                progress: 100, 
                job,
                downloadUrl: `/api/download/${jobId}`
              };
            } else if (job.status === 'failed') {
              return { 
                ...f, 
                status: 'failed', 
                errorMessage: job.errorMessage || 'Conversion failed',
                job 
              };
            }
          }
          return f;
        }));

        // Update overall batch progress
        const currentProgress = ((fileIndex) / totalFiles) * 100 + (Math.min(30 + (attempts * 2), 90) / totalFiles);
        setBatchProgress(Math.min(currentProgress, 100));

        if (job.status === 'completed' || job.status === 'failed') {
          return; // Job finished
        }

        // Continue polling
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 2000); // Poll every 2 seconds
        } else {
          // Mark as failed due to timeout
          setSelectedFiles(prev => prev.map(f => 
            f.id === fileId 
              ? { 
                  ...f, 
                  status: 'failed', 
                  errorMessage: 'Conversion timed out. Please try again.' 
                }
              : f
          ));
        }
      } catch (error) {
        console.error('Polling error:', error);
        setSelectedFiles(prev => prev.map(f => 
          f.id === fileId 
            ? { 
                ...f, 
                status: 'failed', 
                errorMessage: 'Failed to check conversion status' 
              }
            : f
        ));
      }
    };

    // Initial delay before polling
    setTimeout(poll, 1000);
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
      }, index * 500); // Stagger downloads by 500ms
    });
    
    toast({
      title: "Downloads Started",
      description: `${completedFiles.length} file${completedFiles.length !== 1 ? 's' : ''} are being downloaded`,
    });
  };

  const resetWorkflow = () => {
    setStage('upload');
    setSelectedFiles([]);
    setBatchProgress(0);
    setIsConverting(false);
    setIsPaused(false);
    setErrorMessage(null);
    setIsDragOver(false);
  };

  const pauseConversion = () => {
    setIsPaused(true);
    toast({
      title: "Conversion Paused",
      description: "You can resume the conversion anytime",
    });
  };

  const resumeConversion = () => {
    setIsPaused(false);
    toast({
      title: "Conversion Resumed",
      description: "Continuing with the conversion process",
    });
  };

  const stopConversion = () => {
    setIsConverting(false);
    setIsPaused(false);
    setStage('files-selected');
    
    // Reset all converting files back to valid
    setSelectedFiles(prev => prev.map(f => 
      f.status === 'converting' 
        ? { ...f, status: 'valid', progress: 0 }
        : f
    ));
    
    toast({
      title: "Conversion Stopped",
      description: "You can restart the conversion anytime",
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getBatchJobs = (): BatchJob[] => {
    return selectedFiles.map(file => ({
      id: file.id,
      fileName: file.file.name,
      status: file.status === 'valid' ? 'pending' : 
               file.status === 'converting' ? 'converting' : 
               file.status === 'completed' ? 'completed' : 'failed',
      progress: file.progress,
      errorMessage: file.errorMessage
    }));
  };

  const validFilesCount = selectedFiles.filter(f => f.status === 'valid').length;
  const completedFilesCount = selectedFiles.filter(f => f.status === 'completed').length;
  const hasValidFiles = validFilesCount > 0;
  const hasCompletedFiles = completedFilesCount > 0;
  const allFilesCompleted = selectedFiles.length > 0 && completedFilesCount === selectedFiles.length;

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
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    {selectedFiles.length} File{selectedFiles.length !== 1 ? 's' : ''} Selected
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
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
              <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-4">
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
                    {isConverting ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Settings className="w-4 h-4 mr-2" />
                    )}
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
            <div className="space-y-6">
              <BatchProgressTracker
                jobs={getBatchJobs()}
                overallProgress={batchProgress}
                isRunning={isConverting}
                isPaused={isPaused}
                onPause={pauseConversion}
                onResume={resumeConversion}
                onStop={stopConversion}
                onDownloadAll={downloadAllFiles}
                onDownloadIndividual={(jobId: string) => {
                  const fileIndex = selectedFiles.findIndex(f => f.id === jobId);
                  if (fileIndex !== -1) downloadIndividualFile(fileIndex);
                }}
                showIndividualDownloads={true}
              />
              
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span>Each file usually takes 30-60 seconds to convert</span>
                </div>
              </div>
            </div>
          )}

          {/* Completed Stage */}
          {(stage === 'completed' || hasCompletedFiles) && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                </div>
                
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {allFilesCompleted ? 'All Conversions Complete!' : 'Conversions Complete!'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  {completedFilesCount} file{completedFilesCount !== 1 ? 's' : ''} successfully converted to {outputFormat.toUpperCase()}
                </p>
              </div>

              {/* Completed Files List */}
              <div className="space-y-3">
                {selectedFiles.filter(f => f.status === 'completed').map((fileUpload, index) => (
                  <FileItem
                    key={fileUpload.id}
                    file={fileUpload.file}
                    index={selectedFiles.indexOf(fileUpload)}
                    status={fileUpload.status}
                    progress={fileUpload.progress}
                    downloadUrl={fileUpload.downloadUrl}
                    onRemove={removeFile}
                    onDownload={downloadIndividualFile}
                  />
                ))}
              </div>
              
              <div className="flex justify-center space-x-4">
                {hasCompletedFiles && (
                  <Button
                    onClick={downloadAllFiles}
                    className="bg-green-600 hover:bg-green-700 text-white px-8 py-3"
                  >
                    <Archive className="w-4 h-4 mr-2" />
                    Download All Files ({completedFilesCount})
                  </Button>
                )}
                <Button
                  onClick={resetWorkflow}
                  variant="outline"
                  className="px-8 py-3"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Convert More Files
                </Button>
              </div>
            </div>
          )}

          {/* Error Stage */}
          {stage === 'error' && (
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Conversion Failed
              </h3>
              
              {errorMessage && (
                <Alert className="max-w-md mx-auto mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              )}
              
              <div className="flex justify-center space-x-4">
                <Button
                  onClick={resetWorkflow}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
                >
                  Try Again
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Features Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="bg-white rounded-lg p-6 shadow-md">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
            High Quality
          </h3>
          <p className="text-gray-600 text-center text-sm">
            Professional-grade conversion with layout preservation
          </p>
        </div>
        
        <div className="bg-white rounded-lg p-6 shadow-md">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
            Secure & Private
          </h3>
          <p className="text-gray-600 text-center text-sm">
            Files are processed securely and deleted after conversion
          </p>
        </div>
        
        <div className="bg-white rounded-lg p-6 shadow-md">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
              <Download className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
            Instant Download
          </h3>
          <p className="text-gray-600 text-center text-sm">
            Download your converted files immediately after processing
          </p>
        </div>
      </div>
    </div>
  );
};