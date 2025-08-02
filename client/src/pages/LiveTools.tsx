import React, { useState } from "react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { UploadModal } from "@/components/UploadModal";
import { toolConfigs } from "@/components/UploadPage";

import { useLocation } from "wouter";
import { Bell, Search, FileText, Activity, ArrowDown, Check, Home, BarChart3, Settings, Book, GitBranch, Wrench, Upload, Clock, ArrowUp, ArrowRight, ChevronDown, Eye, Star, Info, FileType, FileSpreadsheet, Presentation, FilePlus, Scissors, Archive, Lock, PenTool, ScanText, Edit, FileSignature } from "lucide-react";

interface ToolCardProps {
  title: string;
  description: string;
  popularity: number;
  icon: React.ReactNode;
  iconBg: string;
  isFavorite?: boolean;
  uploadUrl?: string;
  toolId?: string;
  onUseToolClick?: (toolId: string) => void;
}

const ToolCard: React.FC<ToolCardProps> = ({ title, description, popularity, icon, iconBg, isFavorite = false, uploadUrl, toolId, onUseToolClick }) => {
  const [location, setLocation] = useLocation();
  return (
    <Card className="relative">
      <div className="p-6">
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
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                if (toolId && onUseToolClick) {
                  onUseToolClick(toolId);
                } else if (uploadUrl) {
                  setLocation(uploadUrl);
                }
              }}
            >
              Use Tool
            </Button>
            <Button variant="outline" className="w-full">
              <Info className="w-4 h-4 mr-2" />
              Learn More
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
      </div>
    </Card>
  );
};

export const LiveTools: React.FC = () => {
  const [location, setLocation] = useLocation();
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedToolId, setSelectedToolId] = useState<string | null>(null);

  const handleNavigation = (path: string) => {
    setLocation(path);
  };

  const handleUseToolClick = (toolId: string) => {
    setSelectedToolId(toolId);
    setIsUploadModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsUploadModalOpen(false);
    setSelectedToolId(null);
  };

  const handleFileUpload = (files: File[]) => {
    console.log(`Files uploaded for tool ${selectedToolId}:`, files);
  };

  const tools = [
    {
      title: "PDF to Word",
      description: "Convert PDF documents to editable Word files",
      popularity: 95,
      icon: <FileText className="w-5 h-5 text-blue-600" />,
      iconBg: "bg-blue-100",
      category: "convert",
      isFavorite: true,
      uploadUrl: "/upload/pdf-to-word",
      toolId: "pdf-to-word"
    },
    {
      title: "PDF to Excel",
      description: "Extract tables and data to Excel spreadsheets",
      popularity: 88,
      icon: <FileSpreadsheet className="w-5 h-5 text-green-600" />,
      iconBg: "bg-green-100",
      category: "convert",
      uploadUrl: "/upload/pdf-to-excel",
      toolId: "pdf-to-excel"
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
      category: "convert",
      uploadUrl: "/upload/word-to-pdf",
      toolId: "word-to-pdf"
    },
    {
      title: "Merge PDFs",
      description: "Combine multiple PDF files into one document",
      popularity: 85,
      icon: <FilePlus className="w-5 h-5 text-purple-600" />,
      iconBg: "bg-purple-100",
      category: "manipulate",
      isFavorite: true,
      uploadUrl: "/upload/merge-pdfs",
      toolId: "merge-pdfs"
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
    <>
      <div className="min-h-screen bg-gray-50">
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
                <div>
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
                </div>
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
                  uploadUrl={tool.uploadUrl}
                  toolId={tool.toolId}
                  onUseToolClick={handleUseToolClick}
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

      {/* Upload Modal */}
      {selectedToolId && (
        <UploadModal
          isOpen={isUploadModalOpen}
          onClose={handleCloseModal}
          toolConfig={toolConfigs[selectedToolId]}
          onFileUpload={handleFileUpload}
        />
      )}
    </>
  );
};
