import React from "react";
import { Calendar, Clock } from "lucide-react";

export const TermsOfService = (): JSX.Element => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            Terms of Service
          </h1>
          
          {/* Subtitle */}
          <div className="max-w-4xl mx-auto mb-12">
            <p className="text-lg text-gray-600 leading-relaxed mb-1">
              Please read these Terms of Service carefully before using PDF Convert Master services provided
            </p>
            <p className="text-lg text-gray-600 leading-relaxed">
              by Mizan Store Ltd.
            </p>
          </div>
          
          {/* Date Information Card */}
          <div className="max-w-3xl mx-auto">
            <div className="bg-white/70 backdrop-blur-sm border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                {/* Last Updated */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-6 h-6">
                    <Calendar className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-sm text-gray-600">
                    Last Updated: January 15, 2024
                  </span>
                </div>
                
                {/* Effective Date */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-6 h-6">
                    <Clock className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-sm text-gray-600">
                    Effective Date: January 15, 2024
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Content will be added here when user provides more content */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="prose prose-gray max-w-none">
            <p className="text-gray-600 text-center">
              Terms of Service content will be displayed here.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
