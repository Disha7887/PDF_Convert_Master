import React from "react";
import { Calendar, Clock, CheckCircle, Book, Heart, User, Shield, FileText, Copyright, DollarSign, Lock, X, AlertCircle, Gavel, MessageSquare, Edit, Phone } from "lucide-react";

export const TermsOfService = (): JSX.Element => {
  const tableOfContentsItems = [
    { icon: CheckCircle, text: "Acceptance of Terms" },
    { icon: Book, text: "Definitions" },
    { icon: Heart, text: "Description of Services" },
    { icon: User, text: "User Accounts" },
    { icon: Shield, text: "Acceptable Use Policy" },
    { icon: FileText, text: "User Content and Files" },
    { icon: Copyright, text: "Intellectual Property" },
    { icon: DollarSign, text: "Payment Terms" },
    { icon: Lock, text: "Privacy and Security" },
    { icon: X, text: "Termination" },
    { icon: AlertCircle, text: "Warranty Disclaimer" },
    { icon: Shield, text: "Limitation of Liability" },
    { icon: Gavel, text: "Indemnification" },
    { icon: Gavel, text: "Governing Law" },
    { icon: MessageSquare, text: "Dispute Resolution" },
    { icon: Edit, text: "Modifications" },
    { icon: Phone, text: "Contact Information" }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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

        {/* Main Content Layout */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Sidebar - Table of Contents */}
          <aside className="w-full lg:w-72 lg:sticky lg:top-8 lg:self-start">
            <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Table of Contents
              </h3>

              <nav className="space-y-2">
                {tableOfContentsItems.map((item, index) => (
                  <button
                    key={index}
                    className="w-full flex items-center gap-3 px-3 py-3 text-left text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <div className="flex items-center justify-center w-5 h-5 flex-shrink-0">
                      <item.icon className="w-[18.75px] h-[18px] text-gray-500" />
                    </div>
                    <span className="font-medium">{item.text}</span>
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1">
            <div className="bg-white rounded-lg shadow-sm p-8">
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-600 text-center">
                  Terms of Service content will be displayed here.
                </p>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};
