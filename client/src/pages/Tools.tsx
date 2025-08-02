import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileUploadModal } from "@/components/FileUploadModal";
import { toolConfigs, type ToolConfig } from "@/lib/toolConfig";
import { useLocation } from "wouter";
import {
  Upload,
  FileText,
  Copy,
  Scissors,
  Archive,
  Shield,
  Download,
  RotateCw,
  Hash,
  Scan,
  Eye,
  Lock,
  FileStack,
  Wrench,
  Edit3,
  Palette,
  Crop,
  Split,
  Layers,
  PenTool,
  Image,
  Camera,
  Globe,
  Settings,
  BookOpen,
  Presentation,
  Maximize,
  ZoomIn,
  Eraser,
  RefreshCw,
  Monitor
} from "lucide-react";

interface ToolCardProps {
  toolConfig: ToolConfig;
  onSelectFiles: () => void;
  onNavigateToTool?: () => void;
}

const ToolCard: React.FC<ToolCardProps> = ({ toolConfig, onSelectFiles, onNavigateToTool }) => {
  const IconComponent = toolConfig.icon;
  
  const handleCardClick = () => {
    if (toolConfig.route && onNavigateToTool) {
      onNavigateToTool();
    } else {
      onSelectFiles();
    }
  };

  const getFormatIcons = () => {
    const formats = toolConfig.acceptedFormats.map(f => f.replace('.', '').toUpperCase());
    return formats.slice(0, 3).join(', ') + (formats.length > 3 ? '...' : '');
  };

  return (
    <div className="w-full max-w-[290px] h-[380px] p-6 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02]">
      <div className="flex flex-col h-full">
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className={`w-16 h-16 p-1 flex items-center justify-center rounded-2xl border ${toolConfig.iconBorderColor} ${toolConfig.iconBgColor} shadow-md`}>
            <div className="w-8 h-8 flex items-center justify-center">
              <IconComponent className={`w-9 h-9 ${toolConfig.iconColor}`} />
            </div>
          </div>
        </div>
        
        {/* Title */}
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 text-center mb-3">
          {toolConfig.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-4 flex-grow flex items-center justify-center px-2">
          {toolConfig.description}
        </p>
        
        {/* File Type Hint */}
        <div className="text-center mb-4">
          <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2 border">
            <span className="font-medium">Accepts:</span> {getFormatIcons()}
          </div>
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Max: {toolConfig.maxFileSize}
          </div>
        </div>
        
        {/* Button */}
        <Button
          onClick={handleCardClick}
          className="w-full h-14 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 dark:from-blue-600 dark:to-blue-700 text-white font-semibold rounded-xl shadow-lg transition-all hover:shadow-xl"
        >
          <Upload className="w-4 h-4 mr-2" />
          {toolConfig.buttonText}
        </Button>
      </div>
    </div>
  );
};

export const Tools: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState("Convert");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState<ToolConfig | null>(null);
  const [, setLocation] = useLocation();

  const handleSelectFiles = (toolConfig: ToolConfig) => {
    setSelectedTool(toolConfig);
    setIsModalOpen(true);
  };

  const handleNavigateToTool = (toolConfig: ToolConfig) => {
    if (toolConfig.route) {
      setLocation(toolConfig.route);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTool(null);
  };

  // Get tools from configuration that match our 20 main tools
  const mainToolKeys = [
    'pdf-to-word', 'pdf-to-excel', 'pdf-to-powerpoint', 'pdf-to-images',
    'word-to-pdf', 'excel-to-pdf', 'powerpoint-to-pdf', 'html-to-pdf',
    'images-to-pdf', 'resize-images', 'crop-images', 'rotate-images',
    'convert-image-format', 'compress-images', 'upscale-images', 'remove-background',
    'merge-pdfs', 'split-pdf', 'compress-pdf', 'rotate-pdf'
  ];

  const toolsData = mainToolKeys.map(key => toolConfigs[key]).filter(Boolean);

  const filterButtons = ["All Tools", "Convert", "Edit", "Organize", "Security", "Image Tools"];

  const filteredTools = activeFilter === "All Tools"
    ? toolsData
    : toolsData.filter(tool => tool.category === activeFilter);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Filter Buttons */}
      <div className="w-full py-8 px-4 sm:px-8 lg:px-20">
        <div className="max-w-screen-xl mx-auto">
          <div className="flex justify-center gap-2 sm:gap-3 flex-wrap pb-8">
            {filterButtons.map((buttonName, index) => (
              <Button
                key={index}
                variant={activeFilter === buttonName ? "default" : "outline"}
                className={`px-3 sm:px-6 py-2 sm:py-3 rounded-full font-medium text-sm sm:text-base ${
                  activeFilter === buttonName
                    ? "bg-blue-600 text-white shadow-lg hover:bg-blue-700"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
                onClick={() => setActiveFilter(buttonName)}
              >
                {buttonName}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Tools Grid */}
      <div className="w-full px-4 sm:px-8 lg:px-20 pb-16">
        <div className="max-w-screen-xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8 place-items-center">
            {filteredTools.map((tool, index) => (
              <ToolCard
                key={index}
                toolConfig={tool}
                onSelectFiles={() => handleSelectFiles(tool)}
                onNavigateToTool={() => handleNavigateToTool(tool)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* File Upload Modal */}
      {selectedTool && (
        <FileUploadModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          toolTitle={selectedTool.title}
          toolDescription={selectedTool.description}
          toolIcon={React.createElement(selectedTool.icon, { className: `w-6 h-6 ${selectedTool.iconColor}` })}
          toolIconBgColor={selectedTool.iconBgColor}
          toolIconBorderColor={selectedTool.iconBorderColor}
        />
      )}
    </div>
  );
};
