import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useLocation } from "wouter";
import { Bell, Search, FileText, Activity, ArrowDown, Check, Home, BarChart3, Settings, Book, GitBranch, Wrench, Upload, Clock, ArrowUp, ArrowRight, ChevronDown, Eye, Star, Info, FileType, FileSpreadsheet, Presentation, FilePlus, Scissors, Archive, Lock, PenTool, ScanText, Edit, FileSignature } from "lucide-react";

interface ToolCardProps {
  title: string;
  description: string;
  popularity: number;
  icon: React.ReactNode;
  iconBg: string;
  isFavorite?: boolean;
}

const ToolCard: React.FC<ToolCardProps> = ({ title, description, popularity, icon, iconBg, isFavorite = false }) => {
  return (
    <Card className="relative">
      <CardContent className="p-6">
        <div className="pr-12">
          {/* Icon */}
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${iconBg}`}>
            {icon}
          </div>
          
          {/* Title */}
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
          
          {/* Description */}
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">{description}</p>
          
          {/* Popularity */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500">Popularity</span>
              <span className="text-xs text-gray-500">{popularity}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${
                  popularity >= 90 ? 'bg-blue-600' : 
                  popularity >= 80 ? 'bg-green-600' : 
                  popularity >= 70 ? 'bg-yellow-500' : 
                  'bg-gray-400'
                }`}
                style={{ width: `${popularity}%` }}
              ></div>
            </div>
          </div>
          
          {/* Buttons */}
          <div className="space-y-2">
            <Button variant="outline" className="w-full">
              Use Tool
            </Button>
            <Button variant="outline" className="w-full">
              <Info className="w-4 h-4 mr-2" />
            </Button>
          </div>
        </div>
        
        {/* Favorite button */}
        <Button 
          size="icon" 
          variant={isFavorite ? "default" : "outline"}
          className={`absolute top-4 right-4 ${isFavorite ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg' : ''}`}
        >
          <Star className={`w-4 h-4 ${isFavorite ? 'fill-white' : ''}`} />
        </Button>
      </CardContent>
    </Card>
  );
};

export const LiveTools: React.FC = () => {
  const [location, setLocation] = useLocation();
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const handleNavigation = (path: string) => {
    setLocation(path);
  };

  const tools = [
    {
      title: "PDF to Word",
      description: "Convert PDF documents to editable Word files",
      popularity: 95,
      icon: <FileText className="w-5 h-5 text-blue-600" />,
      iconBg: "bg-blue-100",
      category: "convert",
      isFavorite: true
    },
    {
      title: "PDF to Excel",
      description: "Extract tables and data to Excel spreadsheets",
      popularity: 88,
      icon: <FileSpreadsheet className="w-5 h-5 text-green-600" />,
      iconBg: "bg-green-100",
      category: "convert"
    },
    {
      title: "PDF to PowerPoint",
      description: "Convert PDF presentations to PPT format",
      popularity: 75,
      icon: <Presentation className="w-5 h-5 text-orange-600" />,
      iconBg: "bg-orange-100",
      category: "convert"
    },
    {
      title: "Word to PDF",
      description: "Convert Word documents to PDF format",
      popularity: 92,
      icon: <FileText className="w-5 h-5 text-red-600" />,
      iconBg: "bg-red-100",
      category: "convert"
    },
    {
      title: "Merge PDFs",
      description: "Combine multiple PDF files into one document",
      popularity: 85,
      icon: <FilePlus className="w-5 h-5 text-purple-600" />,
      iconBg: "bg-purple-100",
      category: "manipulate",
      isFavorite: true
    },
    {
      title: "Split PDF",
      description: "Split large PDF files into smaller documents",
      popularity: 78,
      icon: <Scissors className="w-5 h-5 text-gray-900" />,
      iconBg: "bg-gray-100",
      category: "manipulate"
    },
    {
      title: "Compress PDF",
      description: "Reduce PDF file size while maintaining quality",
      popularity: 82,
      icon: <Archive className="w-5 h-5 text-yellow-600" />,
      iconBg: "bg-yellow-100",
      category: "manipulate"
    },
    {
      title: "PDF Password Protection",
      description: "Add password security to your PDF files",
      popularity: 70,
      icon: <Lock className="w-5 h-5 text-red-600" />,
      iconBg: "bg-red-100",
      category: "secure"
    },
    {
      title: "PDF Watermark",
      description: "Add watermarks and branding to PDFs",
      popularity: 65,
      icon: <PenTool className="w-5 h-5 text-gray-900" />,
      iconBg: "bg-gray-100",
      category: "manipulate"
    },
    {
      title: "OCR Text Recognition",
      description: "Extract text from scanned PDF documents",
      popularity: 73,
      icon: <ScanText className="w-5 h-5 text-gray-900" />,
      iconBg: "bg-gray-100",
      category: "manipulate"
    },
    {
      title: "PDF Form Filler",
      description: "Fill and edit PDF forms electronically",
      popularity: 68,
      icon: <Edit className="w-5 h-5 text-gray-900" />,
      iconBg: "bg-gray-100",
      category: "manipulate"
    },
    {
      title: "PDF Signature",
      description: "Add digital signatures to PDF documents",
      popularity: 77,
      icon: <FileSignature className="w-5 h-5 text-gray-900" />,
      iconBg: "bg-gray-100",
      category: "secure"
    }
  ];

  const favoriteTools = tools.filter(tool => tool.isFavorite);

  const filteredTools = tools.filter(tool => {
    const matchesSearch = tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === 'all' || tool.category === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const getToolCount = (category: string) => {
    return tools.filter(tool => category === 'all' || tool.category === category).length;
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
              <Button variant="outline" className="text-sm" onClick={() => handleNavigation('/dashboard/manage-plans')}>
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

        {/* Main Content */}
        <main className="flex-1 px-64 py-6">
          <div className="max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Live PDF Tools</h1>
                <p className="text-gray-600">Professional PDF conversion and manipulation tools</p>
              </div>
              
              {/* Search */}
              <div className="relative w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input 
                  placeholder="Search tools..." 
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex space-x-2 mb-6">
              <Button 
                variant={activeFilter === 'all' ? 'default' : 'outline'}
                className={activeFilter === 'all' ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg' : ''}
                onClick={() => setActiveFilter('all')}
              >
                All Tools ({getToolCount('all')})
              </Button>
              <Button 
                variant={activeFilter === 'convert' ? 'default' : 'outline'}
                onClick={() => setActiveFilter('convert')}
              >
                Convert ({getToolCount('convert')})
              </Button>
              <Button 
                variant={activeFilter === 'manipulate' ? 'default' : 'outline'}
                onClick={() => setActiveFilter('manipulate')}
              >
                Manipulate ({getToolCount('manipulate')})
              </Button>
              <Button 
                variant={activeFilter === 'secure' ? 'default' : 'outline'}
                onClick={() => setActiveFilter('secure')}
              >
                Secure ({getToolCount('secure')})
              </Button>
            </div>

            {/* Favorite Tools Section */}
            {favoriteTools.length > 0 && (
              <Card className="mb-6 border-red-200 bg-gradient-to-r from-red-50 to-red-50">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Star className="w-5 h-5 text-red-500 mr-2" />
                    Your Favorite Tools
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {favoriteTools.map((tool, index) => (
                      <div key={index} className="p-4 bg-white rounded-lg border border-red-200 text-center">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-3 ${tool.iconBg}`}>
                          {tool.icon}
                        </div>
                        <h3 className="text-sm font-medium text-gray-900">{tool.title}</h3>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tools Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredTools.map((tool, index) => (
                <ToolCard
                  key={index}
                  title={tool.title}
                  description={tool.description}
                  popularity={tool.popularity}
                  icon={tool.icon}
                  iconBg={tool.iconBg}
                  isFavorite={tool.isFavorite}
                />
              ))}
            </div>

            {filteredTools.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No tools found matching your search criteria.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </DashboardLayout>
  );
};
