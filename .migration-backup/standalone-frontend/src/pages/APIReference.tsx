import React from "react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

import { useLocation } from "wouter";
import { Bell, Search, FileText, Activity, ArrowDown, Check, Home, BarChart3, Settings, Book, GitBranch, Wrench, Upload, Clock, ArrowUp, ArrowRight, ChevronDown, Eye } from "lucide-react";

export const APIReference: React.FC = () => {
  const [location, setLocation] = useLocation();

  const handleNavigation = (path: string) => {
    setLocation(path);
  };

  return (
    
      <div className="min-h-screen bg-gray-50">
        <div className="flex">
          {/* Sidebar */}
          <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
            <div className="p-4">
              {/* Search */}
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input placeholder="Search tools..." className="pl-10" />
              </div>

              {/* Navigation */}
              <nav className="space-y-2">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start p-3"
                  onClick={() => handleNavigation('/dashboard')}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center mr-3">
                    <Home className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-sm font-medium text-gray-700">Home</p>
                    <p className="text-xs text-gray-500">Dashboard overview</p>
                  </div>
                </Button>

                <Button 
                  variant="ghost" 
                  className="w-full justify-start p-3"
                  onClick={() => handleNavigation('/dashboard/usage')}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center mr-3">
                    <BarChart3 className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-sm font-medium text-gray-700">Total Usage</p>
                    <p className="text-xs text-gray-500">Usage statistics</p>
                  </div>
                </Button>

                <Button 
                  variant="ghost" 
                  className="w-full justify-start p-3"
                  onClick={() => handleNavigation('/dashboard/api-setup')}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center mr-3">
                    <Settings className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-sm font-medium text-gray-700">API Setup</p>
                    <p className="text-xs text-gray-500">Integration guides</p>
                  </div>
                </Button>

                <Button className="w-full justify-start p-3 rounded-lg shadow-md">
                  <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center mr-3">
                    <Book className="w-5 h-5" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-sm font-medium">API Reference</p>
                    <p className="text-xs text-red-100">Documentation</p>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-white"></div>
                </Button>

                <Button
                  variant="ghost"
                  className="w-full justify-start p-3"
                  onClick={() => handleNavigation('/dashboard/manage-plans')}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center mr-3">
                    <GitBranch className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-sm font-medium text-gray-700">View Plans</p>
                    <p className="text-xs text-gray-500">Pricing and upgrades</p>
                  </div>
                </Button>

                <Button variant="ghost" className="w-full justify-start p-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center mr-3">
                    <FileText className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-sm font-medium text-gray-700">API Documentation</p>
                    <p className="text-xs text-gray-500">Complete API docs</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                </Button>

                <Button
                  variant="ghost"
                  className="w-full justify-start p-3"
                  onClick={() => handleNavigation('/dashboard/live-tools')}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center mr-3">
                    <Wrench className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-sm font-medium text-gray-700">Live Tools</p>
                    <p className="text-xs text-gray-500">PDF conversion tools</p>
                  </div>
                </Button>
              </nav>

              {/* Quick Actions */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Quick Actions
                </h3>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    <Upload className="w-5 h-5 mr-3 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">Upload PDF</span>
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Clock className="w-5 h-5 mr-3 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">View History</span>
                  </Button>
                </div>
              </div>

              {/* Upgrade Plan */}
              <div className="mt-8 p-4 rounded-xl border border-red-200 bg-gradient-to-r from-red-50 to-red-50">
                <div className="flex items-center mb-2">
                  <ArrowUp className="w-4 h-4 text-red-600 mr-2" />
                  <h3 className="text-sm font-semibold text-red-900">Upgrade Plan</h3>
                </div>
                <p className="text-xs text-red-700 mb-3">
                  Get unlimited conversions and advanced features
                </p>
                <Button
                  variant="outline"
                  className="w-full text-sm"
                  onClick={() => handleNavigation('/dashboard/manage-plans')}
                >
                  View Plans
                </Button>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 p-6">
            <div className="max-w-7xl mx-auto">
              {/* Page Header */}
              <h1 className="text-2xl font-bold text-gray-900 mb-6">API Reference</h1>

              {/* Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Quick Reference Card */}
                <Card className="h-fit">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Quick Reference</CardTitle>
                  </CardHeader>
                  <div className="p-6 pt-0 space-y-3">
                    {/* Base URL */}
                    <div className="p-3 rounded-lg bg-gray-50">
                      <div className="mb-2">
                        <p className="text-base font-medium text-gray-900">Base URL</p>
                      </div>
                      <p className="text-sm font-mono text-gray-600">https://api.pdfconverter.com/v1</p>
                    </div>

                    {/* Authentication */}
                    <div className="p-3 rounded-lg bg-gray-50">
                      <div className="mb-2">
                        <p className="text-base font-medium text-gray-900">Authentication</p>
                      </div>
                      <p className="text-sm text-gray-600">Bearer Token in Authorization header</p>
                    </div>

                    {/* Rate Limit */}
                    <div className="p-3 rounded-lg bg-gray-50">
                      <div className="mb-2">
                        <p className="text-base font-medium text-gray-900">Rate Limit</p>
                      </div>
                      <p className="text-sm text-gray-600">1000 requests per minute</p>
                    </div>
                  </div>
                </Card>

                {/* Available Endpoints Card */}
                <Card className="h-fit">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Available Endpoints</CardTitle>
                  </CardHeader>
                  <div className="p-6 pt-0 space-y-2">
                    {/* PDF to Word Endpoint */}
                    <div className="p-2 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-mono text-gray-900">POST /convert/pdf-to-word</span>
                        <Badge className="bg-green-100 text-green-700 border-green-200">Available</Badge>
                      </div>
                    </div>

                    {/* PDF to Excel Endpoint */}
                    <div className="p-2 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-mono text-gray-900">POST /convert/pdf-to-excel</span>
                        <Badge className="bg-green-100 text-green-700 border-green-200">Available</Badge>
                      </div>
                    </div>

                    {/* Merge Endpoint */}
                    <div className="p-2 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-mono text-gray-900">POST /merge</span>
                        <Badge className="bg-green-100 text-green-700 border-green-200">Available</Badge>
                      </div>
                    </div>

                    {/* Split Endpoint */}
                    <div className="p-2 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-mono text-gray-900">POST /split</span>
                        <Badge className="bg-green-100 text-green-700 border-green-200">Available</Badge>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </main>
        </div>
      </div>
    
  );
};
