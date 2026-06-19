export interface MobileTool {
  id: string;
  title: string;
  description: string;
  acceptedFormats: string[];
  maxFileSizeMB: number;
  outputFormat: string;
  category: string;
  iconName: string;
  serverToolType: string;
  isMerge?: boolean;
  multiFile?: boolean;
}

export const mobileTools: MobileTool[] = [
  // PDF Converters
  {
    id: "pdf-to-word",
    title: "PDF to Word",
    description: "Convert PDF documents to editable Word files",
    acceptedFormats: [".pdf"],
    maxFileSizeMB: 50,
    outputFormat: "DOCX",
    category: "PDF Converters",
    iconName: "file-text",
    serverToolType: "pdf_to_word",
  },
  {
    id: "pdf-to-excel",
    title: "PDF to Excel",
    description: "Extract data from PDF to Excel spreadsheets",
    acceptedFormats: [".pdf"],
    maxFileSizeMB: 50,
    outputFormat: "XLSX",
    category: "PDF Converters",
    iconName: "grid",
    serverToolType: "pdf_to_excel",
  },
  {
    id: "pdf-to-powerpoint",
    title: "PDF to PowerPoint",
    description: "Turn PDF files into editable PowerPoint slides",
    acceptedFormats: [".pdf"],
    maxFileSizeMB: 50,
    outputFormat: "PPTX",
    category: "PDF Converters",
    iconName: "monitor",
    serverToolType: "pdf_to_powerpoint",
  },
  {
    id: "pdf-to-images",
    title: "PDF to Images",
    description: "Convert PDF pages to image files",
    acceptedFormats: [".pdf"],
    maxFileSizeMB: 50,
    outputFormat: "JPG/PNG",
    category: "PDF Converters",
    iconName: "image",
    serverToolType: "pdf_to_images",
  },
  {
    id: "word-to-pdf",
    title: "Word to PDF",
    description: "Convert Word documents to PDF format",
    acceptedFormats: [".doc", ".docx"],
    maxFileSizeMB: 50,
    outputFormat: "PDF",
    category: "PDF Converters",
    iconName: "file-text",
    serverToolType: "word_to_pdf",
  },
  {
    id: "excel-to-pdf",
    title: "Excel to PDF",
    description: "Convert Excel files to PDF format",
    acceptedFormats: [".xls", ".xlsx"],
    maxFileSizeMB: 50,
    outputFormat: "PDF",
    category: "PDF Converters",
    iconName: "grid",
    serverToolType: "excel_to_pdf",
  },
  {
    id: "powerpoint-to-pdf",
    title: "PowerPoint to PDF",
    description: "Convert PowerPoint slideshows to PDF",
    acceptedFormats: [".ppt", ".pptx"],
    maxFileSizeMB: 100,
    outputFormat: "PDF",
    category: "PDF Converters",
    iconName: "monitor",
    serverToolType: "powerpoint_to_pdf",
  },
  {
    id: "images-to-pdf",
    title: "Images to PDF",
    description: "Create a PDF from multiple image files",
    acceptedFormats: [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"],
    maxFileSizeMB: 20,
    outputFormat: "PDF",
    category: "PDF Converters",
    iconName: "image",
    serverToolType: "images_to_pdf",
    multiFile: true,
  },

  // PDF Organize
  {
    id: "merge-pdfs",
    title: "Merge PDFs",
    description: "Combine multiple PDF files into one",
    acceptedFormats: [".pdf"],
    maxFileSizeMB: 100,
    outputFormat: "PDF",
    category: "Organize",
    iconName: "copy",
    serverToolType: "merge_pdfs",
    isMerge: true,
    multiFile: true,
  },
  {
    id: "split-pdf",
    title: "Split PDF",
    description: "Split PDF into separate pages or sections",
    acceptedFormats: [".pdf"],
    maxFileSizeMB: 100,
    outputFormat: "PDF",
    category: "Organize",
    iconName: "scissors",
    serverToolType: "split_pdf",
  },
  {
    id: "compress-pdf",
    title: "Compress PDF",
    description: "Reduce PDF file size while preserving quality",
    acceptedFormats: [".pdf"],
    maxFileSizeMB: 200,
    outputFormat: "PDF",
    category: "Organize",
    iconName: "minimize-2",
    serverToolType: "compress_pdf",
  },
  {
    id: "rotate-pdf",
    title: "Rotate PDF",
    description: "Rotate your PDF pages as needed",
    acceptedFormats: [".pdf"],
    maxFileSizeMB: 100,
    outputFormat: "PDF",
    category: "Organize",
    iconName: "rotate-cw",
    serverToolType: "rotate_pdf",
  },
  {
    id: "ocr-pdf",
    title: "OCR PDF",
    description: "Make scanned PDFs searchable with text recognition",
    acceptedFormats: [".pdf"],
    maxFileSizeMB: 100,
    outputFormat: "PDF",
    category: "Organize",
    iconName: "scan",
    serverToolType: "ocr_pdf",
  },

  // Image Tools
  {
    id: "resize-images",
    title: "Resize Images",
    description: "Change image dimensions or scale by percentage",
    acceptedFormats: [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"],
    maxFileSizeMB: 20,
    outputFormat: "Image",
    category: "Image Tools",
    iconName: "maximize-2",
    serverToolType: "resize_image",
  },
  {
    id: "rotate-images",
    title: "Rotate Images",
    description: "Rotate images by any angle",
    acceptedFormats: [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"],
    maxFileSizeMB: 20,
    outputFormat: "Image",
    category: "Image Tools",
    iconName: "rotate-cw",
    serverToolType: "rotate_image",
  },
  {
    id: "convert-image-format",
    title: "Convert Image",
    description: "Convert images between JPG, PNG, WebP, and more",
    acceptedFormats: [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".tiff"],
    maxFileSizeMB: 25,
    outputFormat: "Various",
    category: "Image Tools",
    iconName: "refresh-cw",
    serverToolType: "convert_image_format",
  },
  {
    id: "compress-images",
    title: "Compress Images",
    description: "Reduce image size without losing quality",
    acceptedFormats: [".jpg", ".jpeg", ".png", ".webp"],
    maxFileSizeMB: 25,
    outputFormat: "Image",
    category: "Image Tools",
    iconName: "minimize-2",
    serverToolType: "compress_image",
  },
  {
    id: "remove-background",
    title: "Remove Background",
    description: "Remove image backgrounds using AI",
    acceptedFormats: [".jpg", ".jpeg", ".png"],
    maxFileSizeMB: 15,
    outputFormat: "PNG",
    category: "Image Tools",
    iconName: "scissors",
    serverToolType: "remove_background",
  },
];

export const toolCategories = ["PDF Converters", "Organize", "Image Tools"] as const;

export function getToolById(id: string): MobileTool | undefined {
  return mobileTools.find((t) => t.id === id);
}

export function getToolsByCategory(category: string): MobileTool[] {
  return mobileTools.filter((t) => t.category === category);
}

export function validateFileExtension(filename: string, acceptedFormats: string[]): boolean {
  const ext = "." + filename.split(".").pop()?.toLowerCase();
  return acceptedFormats.includes(ext);
}

export function parseMaxSizeBytes(maxFileSizeMB: number): number {
  return maxFileSizeMB * 1024 * 1024;
}
