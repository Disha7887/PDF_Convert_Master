/**
 * Static map from tool id → bundled Lottie animation. Mirrors the web app's
 * `TOOL_ANIMATIONS` map (`src/components/tool-lottie-icon.tsx`). Metro requires
 * static `require` paths, so every animation is listed explicitly.
 */
export const TOOL_ANIMATIONS: Record<string, unknown> = {
  // PDF conversion
  "pdf-to-word": require("../../assets/lottie/pdf-to-word.json"),
  "word-to-pdf": require("../../assets/lottie/word-file.json"),
  "pdf-to-excel": require("../../assets/lottie/pdf-to-excel.json"),
  "excel-to-pdf": require("../../assets/lottie/excel-file-scanning.json"),
  "pdf-to-powerpoint": require("../../assets/lottie/ppt.json"),
  "powerpoint-to-pdf": require("../../assets/lottie/ppt_to_pdf.json"),
  "html-to-pdf": require("../../assets/lottie/pdf.json"),
  "pdf-to-images": require("../../assets/lottie/picture.json"),
  "images-to-pdf": require("../../assets/lottie/image.json"),
  // Image tools
  "convert-image-format": require("../../assets/lottie/convert-image.json"),
  "resize-images": require("../../assets/lottie/resize.json"),
  "crop-images": require("../../assets/lottie/crop-tool.json"),
  "rotate-images": require("../../assets/lottie/rotate-image.json"),
  "compress-images": require("../../assets/lottie/compress.json"),
  "upscale-images": require("../../assets/lottie/ai-upscaling.json"),
  "remove-background": require("../../assets/lottie/remove-image.json"),
  // PDF management
  "merge-pdfs": require("../../assets/lottie/pdf_merger.json"),
  "split-pdf": require("../../assets/lottie/pdf_splitter.json"),
  "compress-pdf": require("../../assets/lottie/pdf_compression.json"),
  "rotate-pdf": require("../../assets/lottie/pdf_rotate.json"),
  // PDF editor
  "edit-pdf": require("../../assets/lottie/edit-pdf.json"),
  "crop-pdf": require("../../assets/lottie/crop-pdf.json"),
  "sign-pdf": require("../../assets/lottie/signature-pdf.json"),
  "watermark-pdf": require("../../assets/lottie/watermark-pdf.json"),
  "add-image-pdf": require("../../assets/lottie/add-image-to-pdf.json"),
  "delete-pages-pdf": require("../../assets/lottie/delete-page.json"),
  "ocr-pdf": require("../../assets/lottie/ocr-pdf.json"),
  "restore-document": require("../../assets/lottie/restore-trash.json"),
  "lock-pdf": require("../../assets/lottie/lock.json"),
  "unlock-pdf": require("../../assets/lottie/unlock.json"),
};
