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
  Clock
} from "lucide-react";
import { BouncingUploadIcon } from "@/components/ui/bouncing-upload-icon";
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

type ConversionStage = 'upload' | 'ready' | 'converting' | 'completed' | 'error';

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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [progress, setProgress] = useState(0);
  const [conversionJob, setConversionJob] = useState<ConversionJob | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
      handleFileSelection(files[0]);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelection(files[0]);
    }
  }, []);

  const handleFileSelection = (file: File) => {
    // Validate file format
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!acceptedFormats.includes(extension)) {
      setErrorMessage(`Invalid file format. Please select a ${acceptedFormats.join(', ')} file.`);
      setStage('error');
      return;
    }

    // Validate file size
    const maxSizeInBytes = parseFloat(maxFileSize) * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      setErrorMessage(`File size exceeds ${maxFileSize}. Please select a smaller file.`);
      setStage('error');
      return;
    }

    setSelectedFile(file);
    setStage('ready');
    setErrorMessage(null);
    
    toast({
      title: "File Selected",
      description: `${file.name} is ready for conversion`,
    });
  };

  const startConversion = async () => {
    if (!selectedFile) return;

    setStage('converting');
    setProgress(0);
    setErrorMessage(null);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('toolType', toolType.replace(/-/g, '_')); // Convert kebab-case to snake_case
      formData.append('fileName', selectedFile.name);
      formData.append('fileSize', selectedFile.size.toString());
      formData.append('options', JSON.stringify({}));

      // Start conversion job with file upload
      const response = await fetch('/api/convert', {
        method: 'POST',
        body: formData, // Using FormData for file upload
      });

      const responseData = await response.json();

      if (!responseData.success) {
        throw new Error(responseData.error || 'Conversion failed');
      }

      const jobData = responseData.data;
      setConversionJob(jobData);

      // Poll for job status
      pollJobStatus(jobData.jobId);
      
      toast({
        title: "Conversion Started",
        description: "Your file is being processed...",
      });

    } catch (error) {
      console.error('Conversion error:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Conversion failed');
      setStage('error');
      
      toast({
        title: "Conversion Failed",
        description: "Please try again or contact support",
        variant: "destructive",
      });
    }
  };

  const pollJobStatus = async (jobId: number) => {
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
        setConversionJob(job);

        // Update progress based on status
        if (job.status === 'processing') {
          setProgress(Math.min(30 + (attempts * 2), 90));
        } else if (job.status === 'completed') {
          setProgress(100);
          setStage('completed');
          
          toast({
            title: "Conversion Complete!",
            description: "Your file is ready for download",
          });
          return;
        } else if (job.status === 'failed') {
          setErrorMessage(job.errorMessage || 'Conversion failed');
          setStage('error');
          return;
        }

        // Continue polling
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 2000); // Poll every 2 seconds
        } else {
          setErrorMessage('Conversion is taking longer than expected. Please try again.');
          setStage('error');
        }
      } catch (error) {
        console.error('Polling error:', error);
        setErrorMessage('Failed to check conversion status');
        setStage('error');
      }
    };

    // Initial delay before polling
    setTimeout(poll, 1000);
  };

  const downloadFile = () => {
    if (conversionJob?.downloadUrl) {
      // In a real implementation, this would trigger a file download
      window.open(conversionJob.downloadUrl, '_blank');
      
      toast({
        title: "Download Started",
        description: "Your converted file is being downloaded",
      });
    }
  };

  const resetWorkflow = () => {
    setStage('upload');
    setSelectedFile(null);
    setProgress(0);
    setConversionJob(null);
    setErrorMessage(null);
    setIsDragOver(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

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
              <div className={`flex items-center space-x-2 ${stage === 'upload' || stage === 'ready' ? 'text-blue-600' : stage === 'converting' ? 'text-yellow-600' : stage === 'completed' ? 'text-green-600' : 'text-red-600'}`}>
                {stage === 'upload' && <Upload className="w-4 h-4" />}
                {stage === 'ready' && <FileCheck className="w-4 h-4" />}
                {stage === 'converting' && <Settings className="w-4 h-4 animate-spin" />}
                {stage === 'completed' && <CheckCircle className="w-4 h-4" />}
                {stage === 'error' && <AlertCircle className="w-4 h-4" />}
                <span className="text-sm font-medium capitalize">{stage}</span>
              </div>
            </div>
            {selectedFile && (
              <div className="text-sm text-gray-500">
                {selectedFile.name} ({formatFileSize(selectedFile.size)})
              </div>
            )}
          </div>
          
          {stage === 'converting' && (
            <Progress value={progress} className="h-2" />
          )}
        </div>

        {/* Content Area */}
        <div className="p-8">
          
          {/* Upload Stage */}
          {stage === 'upload' && (
            <div
              className={`
                relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200 cursor-pointer
                ${isDragOver 
                  ? 'border-blue-400 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
                }
              `}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={acceptedFormats.join(',')}
                onChange={handleFileSelect}
                className="hidden"
              />
              
              <div className="flex justify-center mb-6">
                <BouncingUploadIcon
                  size="xl"
                  animationSpeed="fast"
                  bgColor="bg-blue-100"
                />
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Drop your {acceptedFormats.join(', ').replace(/\./g, '').toUpperCase()} file here
              </h3>
              <p className="text-gray-600 mb-6">
                or click to browse files
              </p>
              
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3">
                Select File
              </Button>
              
              <div className="mt-4 text-sm text-gray-500">
                Maximum file size: {maxFileSize}
              </div>
            </div>
          )}

          {/* Ready Stage */}
          {stage === 'ready' && selectedFile && (
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <FileCheck className="w-8 h-8 text-green-600" />
                </div>
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                File Ready for Conversion
              </h3>
              <p className="text-gray-600 mb-2">
                {selectedFile.name} ({formatFileSize(selectedFile.size)})
              </p>
              <p className="text-sm text-gray-500 mb-8">
                Will be converted to {outputFormat.toUpperCase()} format
              </p>
              
              <div className="flex justify-center space-x-4">
                <Button
                  onClick={startConversion}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3"
                >
                  Convert to {outputFormat.toUpperCase()}
                </Button>
                <Button
                  onClick={resetWorkflow}
                  variant="outline"
                  className="px-8 py-3"
                >
                  Choose Different File
                </Button>
              </div>
            </div>
          )}

          {/* Converting Stage */}
          {stage === 'converting' && (
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-yellow-600 animate-spin" />
                </div>
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Converting Your File...
              </h3>
              <p className="text-gray-600 mb-4">
                Processing {selectedFile?.name}
              </p>
              
              <div className="max-w-md mx-auto mb-6">
                <div className="flex justify-between text-sm text-gray-500 mb-2">
                  <span>Progress</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-3" />
              </div>
              
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                <span>This usually takes 30-60 seconds</span>
              </div>
            </div>
          )}

          {/* Completed Stage */}
          {stage === 'completed' && conversionJob && (
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Conversion Complete!
              </h3>
              <p className="text-gray-600 mb-2">
                Your file has been successfully converted
              </p>
              {conversionJob.outputFilename && (
                <p className="text-sm text-gray-500 mb-8">
                  {conversionJob.outputFilename}
                </p>
              )}
              
              <div className="flex justify-center space-x-4">
                <Button
                  onClick={downloadFile}
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-3"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download {outputFormat.toUpperCase()}
                </Button>
                <Button
                  onClick={resetWorkflow}
                  variant="outline"
                  className="px-8 py-3"
                >
                  Convert Another File
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