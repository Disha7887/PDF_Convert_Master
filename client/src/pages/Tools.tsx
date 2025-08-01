import React, { useState } from "react";
import { Button } from "@/components/ui/button";
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
  Presentation
} from "lucide-react";

interface ToolCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  iconBgColor: string;
  iconBorderColor: string;
  category: string;
}

const ToolCard: React.FC<ToolCardProps> = ({ title, description, icon, iconBgColor, iconBorderColor }) => {
  return (
    <div className="w-[290px] h-[344.5px] p-8 bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
      <div className="flex flex-col h-full">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className={`w-20 h-20 p-1 flex items-center justify-center rounded-2xl border ${iconBorderColor} ${iconBgColor}`}>
            <div className="w-9 h-10 flex items-center justify-center">
              {icon}
            </div>
          </div>
        </div>
        
        {/* Title */}
        <h3 className="text-xl font-bold text-gray-900 text-center mb-3">
          {title}
        </h3>
        
        {/* Description */}
        <p className="text-sm text-gray-600 text-center mb-8 flex-grow flex items-center justify-center">
          {description}
        </p>
        
        {/* Button */}
        <Button className="w-full h-14 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-xl shadow-lg transition-all">
          <Upload className="w-4 h-4 mr-2" />
          Select Files
        </Button>
      </div>
    </div>
  );
};

export const Tools: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState("All Tools");

  const toolsData = [
    {
      title: "PDF to Word",
      description: "Convert PDF documents to editable Word files",
      icon: <BookOpen className="w-9 h-9 text-blue-600" />,
      iconBgColor: "bg-blue-50",
      iconBorderColor: "border-blue-200",
      category: "Convert"
    },
    {
      title: "Word to PDF",
      description: "Convert Word documents to PDF format",
      icon: <BookOpen className="w-9 h-9 text-red-500" />,
      iconBgColor: "bg-red-50",
      iconBorderColor: "border-red-200",
      category: "Convert"
    },
    {
      title: "PDF to Excel",
      description: "Extract data from PDF to Excel spreadsheets",
      icon: <FileStack className="w-9 h-9 text-green-600" />,
      iconBgColor: "bg-green-50",
      iconBorderColor: "border-green-200",
      category: "Convert"
    },
    {
      title: "Excel to PDF",
      description: "Convert Excel files to PDF format",
      icon: <FileStack className="w-9 h-9 text-cyan-600" />,
      iconBgColor: "bg-cyan-50",
      iconBorderColor: "border-cyan-200",
      category: "Convert"
    },
    {
      title: "PDF to Images",
      description: "Convert PDF pages to image files",
      icon: <Image className="w-9 h-9 text-pink-600" />,
      iconBgColor: "bg-pink-50",
      iconBorderColor: "border-pink-200",
      category: "Convert"
    },
    {
      title: "Images to PDF",
      description: "Create PDF from multiple image files",
      icon: <Image className="w-9 h-9 text-yellow-600" />,
      iconBgColor: "bg-yellow-50",
      iconBorderColor: "border-yellow-200",
      category: "Convert"
    },
    {
      title: "HTML to PDF",
      description: "Convert webpages in HTML to PDF with a click",
      icon: <Globe className="w-9 h-9 text-yellow-600" />,
      iconBgColor: "bg-yellow-50",
      iconBorderColor: "border-yellow-200",
      category: "Convert"
    },
    {
      title: "PDF to PDF/A",
      description: "Transform your PDF to PDF/A, the ISO-standardized version",
      icon: <FileStack className="w-9 h-9 text-teal-600" />,
      iconBgColor: "bg-teal-50",
      iconBorderColor: "border-teal-200",
      category: "Convert"
    },
    {
      title: "Scan to PDF",
      description: "Capture document scans from your mobile device",
      icon: <Scan className="w-9 h-9 text-orange-600" />,
      iconBgColor: "bg-orange-50",
      iconBorderColor: "border-orange-200",
      category: "Convert"
    },
    {
      title: "PDF to PowerPoint",
      description: "Turn your PDF files into editable PowerPoint PPT and PPTX files",
      icon: <Presentation className="w-9 h-9 text-orange-600" />,
      iconBgColor: "bg-orange-50",
      iconBorderColor: "border-orange-200",
      category: "Convert"
    },
    {
      title: "PowerPoint to PDF",
      description: "Make PPT and PPTX slideshows easy to view by converting them to PDF",
      icon: <Presentation className="w-9 h-9 text-orange-600" />,
      iconBgColor: "bg-orange-50",
      iconBorderColor: "border-orange-200",
      category: "Convert"
    },
    {
      title: "PDF to JPG",
      description: "Convert each PDF page into a JPG or extract all images contained in a PDF",
      icon: <Image className="w-9 h-9 text-yellow-600" />,
      iconBgColor: "bg-yellow-50",
      iconBorderColor: "border-yellow-200",
      category: "Convert"
    },
    {
      title: "JPG to PDF",
      description: "Convert JPG images to PDF in seconds. Easily adjust orientation and margins",
      icon: <Image className="w-9 h-9 text-yellow-600" />,
      iconBgColor: "bg-yellow-50",
      iconBorderColor: "border-yellow-200",
      category: "Convert"
    },
    {
      title: "PDF Merger",
      description: "Combine multiple PDF files into one",
      icon: <Copy className="w-9 h-9 text-green-600" />,
      iconBgColor: "bg-green-50",
      iconBorderColor: "border-green-200",
      category: "Organize"
    },
    {
      title: "PDF Splitter",
      description: "Split PDF into separate pages or sections",
      icon: <Scissors className="w-9 h-9 text-purple-600" />,
      iconBgColor: "bg-purple-50",
      iconBorderColor: "border-purple-200",
      category: "Organize"
    },
    {
      title: "PDF Compressor",
      description: "Reduce PDF file size without quality loss",
      icon: <Archive className="w-9 h-9 text-orange-600" />,
      iconBgColor: "bg-orange-50",
      iconBorderColor: "border-orange-200",
      category: "Organize"
    },
    {
      title: "PDF Protector",
      description: "Add password protection to PDF files",
      icon: <Shield className="w-9 h-9 text-indigo-600" />,
      iconBgColor: "bg-indigo-50",
      iconBorderColor: "border-indigo-200",
      category: "Security"
    },
    {
      title: "PDF Editor",
      description: "Edit text and images in PDF documents",
      icon: <Edit3 className="w-9 h-9 text-purple-600" />,
      iconBgColor: "bg-purple-50",
      iconBorderColor: "border-purple-200",
      category: "Edit"
    },
    {
      title: "PDF Organizer",
      description: "Reorder and organize PDF pages",
      icon: <Layers className="w-9 h-9 text-teal-600" />,
      iconBgColor: "bg-teal-50",
      iconBorderColor: "border-teal-200",
      category: "Organize"
    },
    {
      title: "Sign PDF",
      description: "Add yourself or request electronic signatures from others",
      icon: <PenTool className="w-9 h-9 text-blue-600" />,
      iconBgColor: "bg-blue-50",
      iconBorderColor: "border-blue-200",
      category: "Edit"
    },
    {
      title: "Watermark",
      description: "Stamp an image or text over your PDF in seconds",
      icon: <Palette className="w-9 h-9 text-purple-600" />,
      iconBgColor: "bg-purple-50",
      iconBorderColor: "border-purple-200",
      category: "Edit"
    },
    {
      title: "Rotate PDF",
      description: "Rotate your PDFs the way you need them",
      icon: <RotateCw className="w-9 h-9 text-green-600" />,
      iconBgColor: "bg-green-50",
      iconBorderColor: "border-green-200",
      category: "Organize"
    },
    {
      title: "Unlock PDF",
      description: "Remove PDF password security, giving you freedom to use your PDFs",
      icon: <Lock className="w-9 h-9 text-blue-600" />,
      iconBgColor: "bg-blue-50",
      iconBorderColor: "border-blue-200",
      category: "Security"
    },
    {
      title: "Protect PDF",
      description: "Protect PDF files with a password to prevent unauthorized access",
      icon: <Shield className="w-9 h-9 text-indigo-600" />,
      iconBgColor: "bg-indigo-50",
      iconBorderColor: "border-indigo-200",
      category: "Security"
    }
  ];

  const filterButtons = ["All Tools", "Convert", "Edit", "Organize", "Security"];

  const filteredTools = activeFilter === "All Tools"
    ? toolsData
    : toolsData.filter(tool => tool.category === activeFilter);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Filter Buttons */}
      <div className="w-full py-8 px-20">
        <div className="max-w-screen-xl mx-auto px-6">
          <div className="flex justify-center gap-3 flex-wrap pb-8">
            {filterButtons.map((buttonName, index) => (
              <Button
                key={index}
                variant={activeFilter === buttonName ? "default" : "outline"}
                className={`px-6 py-3 rounded-full font-medium ${
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
      <div className="w-full px-20 pb-16">
        <div className="max-w-screen-xl mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center">
            {filteredTools.map((tool, index) => (
              <ToolCard
                key={index}
                title={tool.title}
                description={tool.description}
                icon={tool.icon}
                iconBgColor={tool.iconBgColor}
                iconBorderColor={tool.iconBorderColor}
                category={tool.category}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
