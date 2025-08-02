import React from "react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

import { useLocation } from "wouter";
import { Bell, Search, FileText, FileX, Activity, Link, Home, BarChart3, Settings, Book, GitBranch, Wrench, Upload, Clock, ArrowUp, ArrowDown, Play, Square, Check, ArrowRight, ChevronDown } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  trend?: string;
  trendPositive?: boolean;
  iconBg: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon, trend, trendPositive, iconBg }) => {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {trend && (
            <p className={`text-sm mt-2 ${trendPositive ? 'text-green-600' : 'text-gray-500'}`}>
              {trend}
            </p>
          )}
          {subtitle && !trend && (
            <p className="text-sm text-gray-500 mt-2">{subtitle}</p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${iconBg}`}>
          {icon}
        </div>
      </div>
    </Card>
  );
};

interface ToolCardProps {
  title: string;
  uses: string;
  icon: React.ReactNode;
  iconBg: string;
}

const ToolCard: React.FC<ToolCardProps> = ({ title, uses, icon, iconBg }) => {
  return (
    <Button variant="outline" className="h-auto p-4 flex flex-col items-center justify-center space-y-3">
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${iconBg}`}>
        {icon}
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-gray-900">{title}</p>
        <p className="text-xs text-gray-500">{uses}</p>
      </div>
    </Button>
  );
};

interface ActivityItemProps {
  title: string;
  description: string;
  time: string;
  status: 'completed' | 'processing' | 'failed';
}

const ActivityItem: React.FC<ActivityItemProps> = ({ title, description, time, status }) => {
  const statusColors = {
    completed: 'bg-green-100 text-green-800',
    processing: 'bg-blue-100 text-blue-800',
    failed: 'bg-red-100 text-red-800'
  };

  return (
    <div className="flex items-center p-3 rounded-lg">
      <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center mr-4">
        <Check className="w-4 h-4 text-green-600" />
      </div>
      <div className="flex-1">
        <p className="text-base font-medium text-gray-900">{title}</p>
        <p className="text-sm text-gray-600 truncate">{description}</p>
      </div>
      <div className="text-right ml-4">
        <p className="text-sm text-gray-500">{time}</p>
        <Badge className={`text-xs ${statusColors[status]}`}>
          {status}
        </Badge>
      </div>
    </div>
  );
};

export const Dashboard: React.FC = () => {
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
              <Button className="w-full justify-start p-3 rounded-lg shadow-md">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center mr-3">
                  <Home className="w-5 h-5" />
                </div>
                <div className="text-left flex-1">
                  <p className="text-sm font-medium">Home</p>
                  <p className="text-xs text-red-100">Dashboard overview</p>
                </div>
                <div className="w-2 h-2 rounded-full bg-white"></div>
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
            {/* Welcome Section */}
            <div className="mb-6 p-8 rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white relative overflow-hidden">
              {/* Background decorative elements */}
              <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 transform translate-x-32 -translate-y-32"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white/5 transform -translate-x-24 translate-y-24"></div>
              
              <div className="relative">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">Welcome back, Sarah Johnson!</h1>
                    <p className="text-blue-100 text-lg mb-1">Ready to convert your PDFs? You're on the Pro Plan.</p>
                    <p className="text-blue-200 text-sm">Thursday, July 31, 2025 • 08:33 AM</p>
                  </div>
                  <div className="flex space-x-4">
                    <Button className="bg-white/20 border border-white/30 text-white hover:bg-white/30">
                      Upload New PDF
                    </Button>
                    <Button className="bg-white/20 border border-white/30 text-white hover:bg-white/30">
                      View All Tools
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <StatCard
                title="Files Converted"
                value="2,847"
                trend="+12%"
                trendPositive={true}
                icon={<FileText className="w-5 h-5 text-blue-600" />}
                iconBg="bg-blue-100"
              />
              <StatCard
                title="API Calls Remaining"
                value="47,153"
                subtitle="3,847 used"
                icon={<Activity className="w-5 h-5 text-purple-600" />}
                iconBg="bg-purple-100"
              />
              <StatCard
                title="Storage Used"
                value="45.2 GB"
                subtitle="of 100 GB"
                icon={<ArrowDown className="w-5 h-5 text-orange-600" />}
                iconBg="bg-orange-100"
              />
              <StatCard
                title="Active Integrations"
                value="8"
                trend="+2 this month"
                trendPositive={true}
                icon={<Link className="w-5 h-5 text-green-600" />}
                iconBg="bg-green-100"
              />
            </div>

            {/* Most Used Tools */}
            <Card className="mb-6">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl font-bold">Most Used Tools</CardTitle>
                <Button variant="outline">View All Tools</Button>
              </CardHeader>
              <div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <ToolCard
                    title="PDF to Word"
                    uses="1,247 uses"
                    icon={<FileText className="w-5 h-5 text-blue-600" />}
                    iconBg="bg-blue-100"
                  />
                  <ToolCard
                    title="PDF to Excel"
                    uses="892 uses"
                    icon={<FileX className="w-5 h-5 text-green-600" />}
                    iconBg="bg-green-100"
                  />
                  <ToolCard
                    title="Merge PDFs"
                    uses="654 uses"
                    icon={<Square className="w-5 h-5 text-purple-600" />}
                    iconBg="bg-purple-100"
                  />
                  <ToolCard
                    title="Compress PDF"
                    uses="543 uses"
                    icon={<ArrowDown className="w-5 h-5 text-orange-600" />}
                    iconBg="bg-orange-100"
                  />
                  <ToolCard
                    title="Split PDF"
                    uses="432 uses"
                    icon={<Activity className="w-5 h-5 text-red-600" />}
                    iconBg="bg-red-100"
                  />
                  <ToolCard
                    title="PDF Signature"
                    uses="321 uses"
                    icon={<Play className="w-5 h-5 text-gray-600" />}
                    iconBg="bg-gray-100"
                  />
                </div>
              </div>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl font-bold">Recent Activity</CardTitle>
                <Button variant="outline">View Full History</Button>
              </CardHeader>
              <div>
                <div className="space-y-4">
                  <ActivityItem
                    title="PDF to Word conversion"
                    description="quarterly-report.pdf"
                    time="2 minutes ago"
                    status="completed"
                  />
                  <ActivityItem
                    title="API key regenerated"
                    description="Production environment"
                    time="1 hour ago"
                    status="completed"
                  />
                  <ActivityItem
                    title="Bulk PDF merge"
                    description="12 files processed"
                    time="3 hours ago"
                    status="completed"
                  />
                  <ActivityItem
                    title="OCR processing"
                    description="scanned-document.pdf"
                    time="5 hours ago"
                    status="completed"
                  />
                  <ActivityItem
                    title="PDF compression"
                    description="large-presentation.pdf"
                    time="1 day ago"
                    status="completed"
                  />
                </div>
              </div>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};
