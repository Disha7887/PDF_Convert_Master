import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useLocation } from "wouter";
import { Bell, Search, FileText, Activity, ArrowDown, Check, Home, BarChart3, Settings, Book, GitBranch, Wrench, Upload, Clock, ArrowUp, ArrowRight, ChevronDown, Eye } from "lucide-react";

export const APIReference: React.FC = () => {
  const [location, setLocation] = useLocation();

  const handleNavigation = (path: string) => {
    setLocation(path);
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
            </div>

            {/* Center - Plan and Manage */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center px-3 py-2 rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
                <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                <span className="text-sm font-medium text-blue-800">Pro Plan</span>
              </div>
              <Button variant="outline" className="text-sm">
                <svg className="w-4 h-4 mr-2" viewBox="0 0 15 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2.60961 9.04167V2.04167H1.44336V0.875H3.19273C3.35601 0.875 3.49402 0.931389 3.60675 1.04417C3.71949 1.15694 3.77586 1.295 3.77586 1.45833V8.45833H11.0299L12.1962 3.79167H4.94211V2.625H12.9426C13.1059 2.625 13.2439 2.68139 13.3566 2.79417C13.4693 2.90694 13.5257 3.045 13.5257 3.20833C13.5257 3.255 13.5179 3.30167 13.5024 3.34833L12.0446 9.18167C12.0135 9.31389 11.9454 9.42083 11.8405 9.5025C11.7355 9.58417 11.6169 9.625 11.4848 9.625H3.19273C3.02946 9.625 2.89145 9.56861 2.77872 9.45583C2.66598 9.34306 2.60961 9.205 2.60961 9.04167ZM3.77586 13.125C3.56593 13.125 3.37156 13.0725 3.19273 12.9675C3.01391 12.8625 2.87202 12.7206 2.76705 12.5417C2.66209 12.3628 2.60961 12.1683 2.60961 11.9583C2.60961 11.7483 2.66209 11.5539 2.76705 11.375C2.87202 11.1961 3.01391 11.0542 3.19273 10.9492C3.37156 10.8442 3.56593 10.7917 3.77586 10.7917C3.98578 10.7917 4.18016 10.8442 4.35898 10.9492C4.53781 11.0542 4.6797 11.1961 4.78467 11.375C4.88963 11.5539 4.94211 11.7483 4.94211 11.9583C4.94211 12.1683 4.88963 12.3628 4.78467 12.5417C4.6797 12.7206 4.53781 12.8625 4.35898 12.9675C4.18016 13.0725 3.98578 13.125 3.77586 13.125ZM10.7734 13.125C10.5634 13.125 10.3691 13.0725 10.1902 12.9675C10.0114 12.8625 9.86952 12.7206 9.76455 12.5417C9.65959 12.3628 9.60711 12.1683 9.60711 11.9583C9.60711 11.7483 9.65959 11.5539 9.76455 11.375C9.86952 11.1961 10.0114 11.0542 10.1902 10.9492C10.3691 10.8442 10.5634 10.7917 10.7734 10.7917C10.9833 10.7917 11.1777 10.8442 11.3565 10.9492C11.5353 11.0542 11.6772 11.1961 11.7822 11.375C11.8871 11.5539 11.9396 11.7483 11.9396 11.9583C11.9396 12.1683 11.8871 12.3628 11.7822 12.5417C11.6772 12.7206 11.5353 12.8625 11.3565 12.9675C11.1777 13.0725 10.9833 13.125 10.7734 13.125Z" fill="#374151"/>
                </svg>
                Manage Plan
              </Button>
            </div>

            {/* Right - Notifications and Profile */}
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 text-white text-xs rounded-full flex items-center justify-center">
                  2
                </span>
              </Button>
              <Button className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-lg flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-sm font-semibold">SJ</span>
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium">Sarah Johnson</p>
                  <p className="text-xs text-red-100">sarah@company.com</p>
                </div>
                <ChevronDown className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </header>

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

                <Button className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white justify-start p-3 rounded-lg shadow-md">
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
                  <CardContent className="space-y-3">
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
                  </CardContent>
                </Card>

                {/* Available Endpoints Card */}
                <Card className="h-fit">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Available Endpoints</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
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
                  </CardContent>
                </Card>
              </div>
            </div>
          </main>
        </div>
      </div>
    </DashboardLayout>
  );
};
