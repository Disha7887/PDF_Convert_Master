import { 
  FileText, 
  FileSpreadsheet, 
  Presentation, 
  Image, 
  Code, 
  Copy, 
  Scissors, 
  Archive, 
  RotateCw,
  Minimize2,
  RefreshCw,
  Maximize2,
  TrendingUp,
  Crop
} from "lucide-react";

export interface ToolConfig {
  id: string;
  title: string;
  description: string;
  acceptedFormats: string[];
  maxFileSize: string;
  buttonText: string;
  dropAreaText: string;
  fileTypeHint: string;
  outputFormat: string;
  icon: React.ComponentType<any>;
  iconColor: string;
  iconBgColor: string;
  iconBorderColor: string;
  category: string;
  route?: string;
}

export const toolConfigs: Record<string, ToolConfig> = {
  // PDF CONVERSION TOOLS
  "pdf-to-word": {
    id: "pdf-to-word",
    title: "PDF to Word",
    description: "Convert PDF documents to editable Word files",
    acceptedFormats: [".pdf"],
    maxFileSize: "50MB",
    buttonText: "Select PDF Files",
    dropAreaText: "Drop your PDF files here",
    fileTypeHint: "Supports: PDF files up to 50MB each",
    outputFormat: "DOCX",
    icon: FileText,
    iconColor: "text-blue-600",
    iconBgColor: "bg-blue-50",
    iconBorderColor: "border-blue-200",
    category: "Convert",
    route: "/upload/pdf-to-word"
  },
  "pdf-to-excel": {
    id: "pdf-to-excel",
    title: "PDF to Excel", 
    description: "Extract data from PDF to Excel spreadsheets",
    acceptedFormats: [".pdf"],
    maxFileSize: "50MB",
    buttonText: "Select PDF Files",
    dropAreaText: "Drop your PDF files here",
    fileTypeHint: "Supports: PDF files up to 50MB each",
    outputFormat: "XLSX",
    icon: FileSpreadsheet,
    iconColor: "text-green-600",
    iconBgColor: "bg-green-50",
    iconBorderColor: "border-green-200",
    category: "Convert",
    route: "/upload/pdf-to-excel"
  },
  "pdf-to-powerpoint": {
    id: "pdf-to-powerpoint",
    title: "PDF to PowerPoint",
    description: "Turn your PDF files into editable PowerPoint PPT and PPTX files",
    acceptedFormats: [".pdf"],
    maxFileSize: "50MB", 
    buttonText: "Select PDF Files",
    dropAreaText: "Drop your PDF files here",
    fileTypeHint: "Supports: PDF files up to 50MB each",
    outputFormat: "PPTX",
    icon: Presentation,
    iconColor: "text-orange-600",
    iconBgColor: "bg-orange-50",
    iconBorderColor: "border-orange-200",
    category: "Convert",
    route: "/upload/pdf-to-powerpoint"
  },
  "pdf-to-images": {
    id: "pdf-to-images",
    title: "PDF to Images",
    description: "Convert PDF pages to image files",
    acceptedFormats: [".pdf"],
    maxFileSize: "50MB",
    buttonText: "Select PDF Files",
    dropAreaText: "Drop your PDF files here", 
    fileTypeHint: "Supports: PDF files up to 50MB each",
    outputFormat: "JPG/PNG",
    icon: Image,
    iconColor: "text-pink-600",
    iconBgColor: "bg-pink-50",
    iconBorderColor: "border-pink-200",
    category: "Convert",
    route: "/upload/pdf-to-images"
  },
  "word-to-pdf": {
    id: "word-to-pdf",
    title: "Word to PDF",
    description: "Convert Word documents to PDF format",
    acceptedFormats: [".doc", ".docx"],
    maxFileSize: "50MB",
    buttonText: "Select Word Documents",
    dropAreaText: "Drop your Word documents here",
    fileTypeHint: "Supports: DOC, DOCX files up to 50MB each",
    outputFormat: "PDF",
    icon: FileText,
    iconColor: "text-blue-500",
    iconBgColor: "bg-blue-50",
    iconBorderColor: "border-blue-200",
    category: "Convert",
    route: "/upload/word-to-pdf"
  },
  "excel-to-pdf": {
    id: "excel-to-pdf",
    title: "Excel to PDF",
    description: "Convert Excel files to PDF format",
    acceptedFormats: [".xls", ".xlsx"],
    maxFileSize: "50MB",
    buttonText: "Select Excel Files",
    dropAreaText: "Drop your Excel files here",
    fileTypeHint: "Supports: XLS, XLSX files up to 50MB each",
    outputFormat: "PDF",
    icon: FileSpreadsheet,
    iconColor: "text-green-500",
    iconBgColor: "bg-green-50",
    iconBorderColor: "border-green-200",
    category: "Convert",
    route: "/upload/excel-to-pdf"
  },
  "powerpoint-to-pdf": {
    id: "powerpoint-to-pdf",
    title: "PowerPoint to PDF",
    description: "Make PPT and PPTX slideshows easy to view by converting them to PDF",
    acceptedFormats: [".ppt", ".pptx"],
    maxFileSize: "100MB",
    buttonText: "Select PowerPoint Files",
    dropAreaText: "Drop your PowerPoint files here",
    fileTypeHint: "Supports: PPT, PPTX files up to 100MB each",
    outputFormat: "PDF",
    icon: Presentation,
    iconColor: "text-orange-500",
    iconBgColor: "bg-orange-50",
    iconBorderColor: "border-orange-200",
    category: "Convert",
    route: "/upload/powerpoint-to-pdf"
  },
  "html-to-pdf": {
    id: "html-to-pdf",
    title: "HTML to PDF",
    description: "Convert webpages in HTML to PDF with a click",
    acceptedFormats: [".html", ".htm"],
    maxFileSize: "10MB",
    buttonText: "Select HTML Files",
    dropAreaText: "Drop your HTML files here",
    fileTypeHint: "Supports: HTML, HTM files up to 10MB each",
    outputFormat: "PDF",
    icon: Code,
    iconColor: "text-purple-500",
    iconBgColor: "bg-purple-50",
    iconBorderColor: "border-purple-200",
    category: "Convert",
    route: "/upload/html-to-pdf"
  },

  // IMAGE PROCESSING TOOLS
  "images-to-pdf": {
    id: "images-to-pdf",
    title: "Images to PDF",
    description: "Create PDF from multiple image files",
    acceptedFormats: [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"],
    maxFileSize: "20MB",
    buttonText: "Select Images",
    dropAreaText: "Drop your images here",
    fileTypeHint: "Supports: JPG, PNG, GIF, BMP, WebP up to 20MB each",
    outputFormat: "PDF",
    icon: Image,
    iconColor: "text-purple-500",
    iconBgColor: "bg-purple-50",
    iconBorderColor: "border-purple-200",
    category: "Convert",
    route: "/upload/images-to-pdf"
  },
  "resize-images": {
    id: "resize-images",
    title: "Resize Images",
    description: "Change image dimensions, scale by percentage, or use preset sizes",
    acceptedFormats: [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"],
    maxFileSize: "20MB",
    buttonText: "Select Images",
    dropAreaText: "Drop your images here",
    fileTypeHint: "Supports: JPG, PNG, GIF, BMP, WebP up to 20MB each",
    outputFormat: "Same Format",
    icon: Maximize2,
    iconColor: "text-teal-500",
    iconBgColor: "bg-teal-50",
    iconBorderColor: "border-teal-200",
    category: "Image Tools",
    route: "/upload/resize-image"
  },
  "crop-images": {
    id: "crop-images", 
    title: "Crop Images",
    description: "Cut specific parts of images with freeform or preset ratios",
    acceptedFormats: [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"],
    maxFileSize: "20MB",
    buttonText: "Select Images",
    dropAreaText: "Drop your images here",
    fileTypeHint: "Supports: JPG, PNG, GIF, BMP, WebP up to 20MB each",
    outputFormat: "Same Format",
    icon: Crop,
    iconColor: "text-amber-500",
    iconBgColor: "bg-amber-50",
    iconBorderColor: "border-amber-200",
    category: "Image Tools",
    route: "/upload/crop-image"
  },
  "rotate-images": {
    id: "rotate-images",
    title: "Rotate Images", 
    description: "Rotate images by any angle with automatic background fill",
    acceptedFormats: [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"],
    maxFileSize: "20MB",
    buttonText: "Select Images",
    dropAreaText: "Drop your images here",
    fileTypeHint: "Supports: JPG, PNG, GIF, BMP, WebP up to 20MB each",
    outputFormat: "Same Format",
    icon: RefreshCw,
    iconColor: "text-pink-500",
    iconBgColor: "bg-pink-50",
    iconBorderColor: "border-pink-200",
    category: "Image Tools",
    route: "/upload/rotate-image"
  },
  "convert-image-format": {
    id: "convert-image-format",
    title: "Convert Image Format",
    description: "Convert between JPG, PNG, WebP, GIF, BMP with quality settings",
    acceptedFormats: [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".tiff"],
    maxFileSize: "25MB",
    buttonText: "Select Images",
    dropAreaText: "Drop your images here", 
    fileTypeHint: "Supports: JPG, PNG, GIF, BMP, WebP, TIFF up to 25MB each",
    outputFormat: "Various Formats",
    icon: RefreshCw,
    iconColor: "text-indigo-500",
    iconBgColor: "bg-indigo-50",
    iconBorderColor: "border-indigo-200",
    category: "Image Tools",
    route: "/upload/convert-image-format"
  },
  "compress-images": {
    id: "compress-images",
    title: "Compress Images",
    description: "Reduce image file size without losing quality for web optimization",
    acceptedFormats: [".jpg", ".jpeg", ".png", ".webp"],
    maxFileSize: "25MB",
    buttonText: "Select Images",
    dropAreaText: "Drop your images here",
    fileTypeHint: "Supports: JPG, PNG, WebP up to 25MB each",
    outputFormat: "Compressed Images",
    icon: Minimize2,
    iconColor: "text-cyan-500",
    iconBgColor: "bg-cyan-50",
    iconBorderColor: "border-cyan-200",
    category: "Image Tools",
    route: "/upload/compress-image"
  },
  "upscale-images": {
    id: "upscale-images",
    title: "Upscale Images",
    description: "Enhance image resolution using AI technology up to 4x",
    acceptedFormats: [".jpg", ".jpeg", ".png", ".webp"],
    maxFileSize: "10MB",
    buttonText: "Select Images",
    dropAreaText: "Drop your images here",
    fileTypeHint: "Supports: JPG, PNG, WebP up to 10MB each",
    outputFormat: "High-res Images",
    icon: TrendingUp,
    iconColor: "text-emerald-500",
    iconBgColor: "bg-emerald-50",
    iconBorderColor: "border-emerald-200",
    category: "Image Tools",
    route: "/upload/upscale-image"
  },
  "remove-background": {
    id: "remove-background",
    title: "Remove Background",
    description: "Remove image backgrounds automatically using AI technology",
    acceptedFormats: [".jpg", ".jpeg", ".png"],
    maxFileSize: "15MB",
    buttonText: "Select Images",
    dropAreaText: "Drop your images here",
    fileTypeHint: "Supports: JPG, PNG up to 15MB each",
    outputFormat: "PNG with Transparency",
    icon: Scissors,
    iconColor: "text-violet-500",
    iconBgColor: "bg-violet-50",
    iconBorderColor: "border-violet-200",
    category: "Image Tools",
    route: "/upload/remove-background"
  },

  // PDF MANAGEMENT TOOLS
  "merge-pdfs": {
    id: "merge-pdfs",
    title: "PDF Merger",
    description: "Combine multiple PDF files into one",
    acceptedFormats: [".pdf"],
    maxFileSize: "100MB",
    buttonText: "Select PDF Files",
    dropAreaText: "Drop your PDF files here",
    fileTypeHint: "Supports: PDF files up to 100MB each",
    outputFormat: "Merged PDF",
    icon: Copy,
    iconColor: "text-blue-600",
    iconBgColor: "bg-blue-50",
    iconBorderColor: "border-blue-200",
    category: "Organize",
    route: "/upload/merge-pdfs"
  },
  "split-pdf": {
    id: "split-pdf",
    title: "PDF Splitter",
    description: "Split PDF into separate pages or sections",
    acceptedFormats: [".pdf"],
    maxFileSize: "100MB",
    buttonText: "Select PDF Files",
    dropAreaText: "Drop your PDF files here",
    fileTypeHint: "Supports: PDF files up to 100MB each",
    outputFormat: "PDF Files",
    icon: Scissors,
    iconColor: "text-red-600",
    iconBgColor: "bg-red-50",
    iconBorderColor: "border-red-200",
    category: "Organize",
    route: "/upload/split-pdf"
  },
  "compress-pdf": {
    id: "compress-pdf",
    title: "Compress PDF",
    description: "Reduce file size while optimizing for maximal PDF quality",
    acceptedFormats: [".pdf"],
    maxFileSize: "200MB",
    buttonText: "Select PDF Files",
    dropAreaText: "Drop your PDF files here",
    fileTypeHint: "Supports: PDF files up to 200MB each",
    outputFormat: "Compressed PDF",
    icon: Archive,
    iconColor: "text-green-600",
    iconBgColor: "bg-green-50",
    iconBorderColor: "border-green-200",
    category: "Edit",
    route: "/upload/compress-pdf"
  },
  "rotate-pdf": {
    id: "rotate-pdf",
    title: "Rotate PDF",
    description: "Rotate your PDFs the way you need them",
    acceptedFormats: [".pdf"],
    maxFileSize: "100MB",
    buttonText: "Select PDF Files",
    dropAreaText: "Drop your PDF files here",
    fileTypeHint: "Supports: PDF files up to 100MB each",
    outputFormat: "Rotated PDF",
    icon: RotateCw,
    iconColor: "text-purple-600",
    iconBgColor: "bg-purple-50",
    iconBorderColor: "border-purple-200",
    category: "Organize",
    route: "/upload/rotate-pdf"
  }
};

// Helper function to get tool config by title
export const getToolConfigByTitle = (title: string): ToolConfig | null => {
  const toolKey = Object.keys(toolConfigs).find(key => 
    toolConfigs[key].title === title
  );
  return toolKey ? toolConfigs[toolKey] : null;
};

// Helper function to validate file type
export const validateFileType = (file: File, acceptedFormats: string[]): boolean => {
  const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
  return acceptedFormats.includes(fileExtension);
};

// Helper function to get file type error message
export const getFileTypeErrorMessage = (acceptedFormats: string[]): string => {
  const formatList = acceptedFormats.map(f => f.toUpperCase().replace('.', '')).join(', ');
  return `Please select ${formatList} files only. The selected file type is not supported.`;
};