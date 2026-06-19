import { useReducedMotion } from "framer-motion";
import { LottieIcon } from "@/components/ui/lottie-icon";
import { toolConfigs, type ToolConfig } from "@/lib/toolConfig";

import wordFile from "@/assets/lottie/word-file.json";
import excelFile from "@/assets/lottie/excel-file-searching.json";
import ppt from "@/assets/lottie/ppt.json";
import pptToPdf from "@/assets/lottie/ppt_to_pdf.json";
import pdf from "@/assets/lottie/pdf.json";
import picture from "@/assets/lottie/picture.json";
import image from "@/assets/lottie/image.json";
import resize from "@/assets/lottie/resize.json";
import cropTool from "@/assets/lottie/crop-tool.json";
import rotateImage from "@/assets/lottie/rotate-image.json";
import compress from "@/assets/lottie/compress.json";
import aiUpscaling from "@/assets/lottie/ai-upscaling.json";
import bgRemover from "@/assets/lottie/bg_remover.json";
import pdfMerger from "@/assets/lottie/pdf_merger.json";
import pdfSplitter from "@/assets/lottie/pdf_splitter.json";
import pdfCompression from "@/assets/lottie/pdf_compression.json";
import pdfRotate from "@/assets/lottie/pdf_rotate.json";

/**
 * Maps each tool id to the Lottie animation the user provided. The filename of
 * each uploaded animation identifies its tool; document-format animations
 * (word/excel) are shared between the matching "PDF→X" and "X→PDF" tools, and
 * the generic picture/image animations cover the image<->pdf + format tools.
 */
export const TOOL_ANIMATIONS: Record<string, unknown> = {
  // PDF conversion
  "pdf-to-word": wordFile,
  "word-to-pdf": wordFile,
  "pdf-to-excel": excelFile,
  "excel-to-pdf": excelFile,
  "pdf-to-powerpoint": ppt,
  "powerpoint-to-pdf": pptToPdf,
  "html-to-pdf": pdf,
  "pdf-to-images": picture,
  "images-to-pdf": image,
  // Image tools
  "convert-image-format": image,
  "resize-images": resize,
  "crop-images": cropTool,
  "rotate-images": rotateImage,
  "compress-images": compress,
  "compress-image": compress,
  "upscale-images": aiUpscaling,
  "remove-background": bgRemover,
  // PDF management
  "merge-pdfs": pdfMerger,
  "split-pdf": pdfSplitter,
  "compress-pdf": pdfCompression,
  "rotate-pdf": pdfRotate,
};

export interface ToolLottieIconProps {
  toolId: string;
  /** Optional pre-resolved config; falls back to toolConfigs[toolId]. */
  config?: ToolConfig;
  /** Square pixel size for the animation. Defaults to 44. */
  size?: number;
  /** Loop the animation. Defaults to true. */
  loop?: boolean;
  /** Play only while hovered. Defaults to false. */
  playOnHover?: boolean;
  className?: string;
}

/**
 * Renders a tool's animated Lottie identity icon on its card. Falls back to the
 * tool's static lucide icon when there is no animation for the id or when the
 * user prefers reduced motion.
 */
export function ToolLottieIcon({
  toolId,
  config,
  size = 44,
  loop = true,
  playOnHover = false,
  className,
}: ToolLottieIconProps) {
  const reduceMotion = useReducedMotion();
  const animation = TOOL_ANIMATIONS[toolId];
  const cfg = config ?? toolConfigs[toolId];

  if (!animation || reduceMotion) {
    const Icon = cfg?.icon;
    if (!Icon) return null;
    return (
      <span
        className={className}
        style={{
          width: size,
          height: size,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon
          className={cfg?.iconColor}
          style={{ width: size * 0.62, height: size * 0.62 }}
        />
      </span>
    );
  }

  return (
    <LottieIcon
      animationData={animation}
      size={size}
      loop={loop}
      playOnHover={playOnHover}
      className={className}
    />
  );
}

export default ToolLottieIcon;
