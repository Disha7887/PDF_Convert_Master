import React from "react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

import { useLocation } from "wouter";
import { Bell, Search, FileText, Activity, ArrowDown, Check, Home, BarChart3, Settings, Book, GitBranch, Wrench, Upload, Clock, ArrowUp, ArrowRight, ChevronDown, Eye } from "lucide-react";

export const APISetup: React.FC = () => {
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

                <Button className="w-full justify-start p-3 rounded-lg shadow-md">
                  <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center mr-3">
                    <Settings className="w-5 h-5" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-sm font-medium">API Setup</p>
                    <p className="text-xs text-red-100">Integration guides</p>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-white"></div>
                </Button>

                <Button
                  variant="ghost"
                  className="w-full justify-start p-3"
                  onClick={() => handleNavigation('/dashboard/api-reference')}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center mr-3">
                    <Book className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-sm font-medium text-gray-700">API Reference</p>
                    <p className="text-xs text-gray-500">Documentation</p>
                  </div>
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
              <h1 className="text-2xl font-bold text-gray-900 mb-6">API Setup</h1>

              {/* Getting Started Section */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Getting Started</CardTitle>
                </CardHeader>
                <div>
                  <div className="space-y-4">
                    {/* Step 1 */}
                    <div className="flex items-start">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3 flex-shrink-0">
                        <span className="text-sm font-semibold text-blue-600">1</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base font-medium text-gray-900 mb-1">Generate API Key</h3>
                        <p className="text-sm text-gray-600">Create your API key from the dashboard to authenticate your requests.</p>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex items-start">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3 flex-shrink-0">
                        <span className="text-sm font-semibold text-blue-600">2</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base font-medium text-gray-900 mb-1">Configure Endpoints</h3>
                        <p className="text-sm text-gray-600">Set up your base URL and configure the endpoints for your application.</p>
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex items-start">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3 flex-shrink-0">
                        <span className="text-sm font-semibold text-blue-600">3</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base font-medium text-gray-900 mb-1">Test Integration</h3>
                        <p className="text-sm text-gray-600">Make your first API call to ensure everything is working correctly.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* API Key Management Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">API Key Management</CardTitle>
                </CardHeader>
                <div>
                  <div className="space-y-4">
                    {/* Production Key */}
                    <div className="p-4 rounded-lg bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-base font-medium text-gray-900 mb-2">Production Key</h3>
                          <div className="flex items-center space-x-2">
                            <p className="text-sm font-mono text-gray-600">sk_live_•••���••••••••••••••••••••••••</p>
                          </div>
                        </div>
                        <Button variant="outline" className="text-sm">
                          Regenerate
                        </Button>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Button variant="outline" className="text-sm">
                          <Eye className="w-4 h-4 mr-2" />
                          Reveal Key
                        </Button>
                      </div>
                    </div>

                    {/* Generate New Key Button */}
                    <Button variant="outline" className="w-full text-sm">
                      Generate New Key
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </main>
        </div>
      </div>
    
  );
};
