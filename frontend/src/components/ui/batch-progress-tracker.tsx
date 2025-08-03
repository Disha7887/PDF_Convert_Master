import React from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Download,
  Archive,
  Pause,
  Play,
  Square
} from "lucide-react";

interface BatchJob {
  id: string;
  fileName: string;
  status: 'pending' | 'converting' | 'completed' | 'failed';
  progress: number;
  errorMessage?: string;
}

interface BatchProgressTrackerProps {
  jobs: BatchJob[];
  overallProgress: number;
  isRunning: boolean;
  isPaused: boolean;
  onPause?: () => void;
  onResume?: () => void;
  onStop?: () => void;
  onDownloadAll?: () => void;
  onDownloadIndividual?: (jobId: string) => void;
  showIndividualDownloads?: boolean;
}

export const BatchProgressTracker: React.FC<BatchProgressTrackerProps> = ({
  jobs,
  overallProgress,
  isRunning,
  isPaused,
  onPause,
  onResume,
  onStop,
  onDownloadAll,
  onDownloadIndividual,
  showIndividualDownloads = true
}) => {
  const completedJobs = jobs.filter(job => job.status === 'completed').length;
  const failedJobs = jobs.filter(job => job.status === 'failed').length;
  const totalJobs = jobs.length;
  const currentJob = jobs.find(job => job.status === 'converting');

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'converting':
        return <Loader2 className="w-4 h-4 text-yellow-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <div className="w-4 h-4 rounded-full border-2 border-gray-300 dark:border-gray-600" />;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Batch Conversion Progress
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {completedJobs} of {totalJobs} files completed
            {failedJobs > 0 && ` • ${failedJobs} failed`}
          </p>
        </div>
        
        {/* Control Buttons */}
        <div className="flex items-center space-x-2">
          {isRunning && !isPaused && onPause && (
            <Button size="sm" variant="outline" onClick={onPause}>
              <Pause className="w-4 h-4 mr-1" />
              Pause
            </Button>
          )}
          
          {isPaused && onResume && (
            <Button size="sm" variant="outline" onClick={onResume}>
              <Play className="w-4 h-4 mr-1" />
              Resume
            </Button>
          )}
          
          {(isRunning || isPaused) && onStop && (
            <Button size="sm" variant="outline" onClick={onStop}>
              <Square className="w-4 h-4 mr-1" />
              Stop
            </Button>
          )}
          
          {completedJobs > 0 && onDownloadAll && (
            <Button size="sm" onClick={onDownloadAll}>
              <Archive className="w-4 h-4 mr-1" />
              Download All ({completedJobs})
            </Button>
          )}
        </div>
      </div>

      {/* Overall Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
          <span>Overall Progress</span>
          <span>{Math.round(overallProgress)}%</span>
        </div>
        <Progress value={overallProgress} className="h-3" />
      </div>

      {/* Current Job Status */}
      {currentJob && (
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-3">
            <Loader2 className="w-5 h-5 text-yellow-500 animate-spin" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Currently converting: {currentJob.fileName}
              </p>
              <div className="flex items-center space-x-4 mt-2">
                <div className="flex-1">
                  <Progress value={currentJob.progress} className="h-2" />
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {currentJob.progress}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Job List */}
      <div className="space-y-3 max-h-60 overflow-y-auto">
        {jobs.map((job, index) => (
          <div 
            key={job.id}
            className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="flex-shrink-0">
              {getStatusIcon(job.status)}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {job.fileName}
              </p>
              {job.status === 'converting' && (
                <div className="flex items-center space-x-2 mt-1">
                  <Progress value={job.progress} className="h-1 flex-1" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {job.progress}%
                  </span>
                </div>
              )}
              {job.status === 'failed' && job.errorMessage && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  {job.errorMessage}
                </p>
              )}
            </div>
            
            {/* Individual Download */}
            {job.status === 'completed' && showIndividualDownloads && onDownloadIndividual && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDownloadIndividual(job.id)}
                className="h-8 w-8 p-0"
              >
                <Download className="w-4 h-4" />
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-green-600">{completedJobs}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Completed</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-600">
              {jobs.filter(j => j.status === 'converting' || j.status === 'pending').length}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Remaining</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600">{failedJobs}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Failed</div>
          </div>
        </div>
      </div>
    </div>
  );
};