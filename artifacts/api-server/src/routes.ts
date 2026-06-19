import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { randomUUID } from "crypto";
import { storage } from "./storage";
import { 
  fileConversionRequestSchema,
  ToolType,
  ToolCategory
} from "@workspace/db";
import { z } from "zod";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import fs from "fs/promises";
import path from "path";
import { promisify } from "util";
import sharp from "sharp";
import { register, signin, getCurrentUser, authenticateUser } from "./auth";
import { authenticateApiKey } from "./middlewares/apiKeyMiddleware";
import { generateApiKey, hashApiKey } from "./utils/generateApiKey";
import mammoth from "mammoth";
import * as xlsx from "xlsx";
import { execSync } from "child_process";
import puppeteer from "puppeteer";
import { PDFParse } from "pdf-parse";
import { Document, Packer, Paragraph, TextRun, PageBreak } from "docx";
import pptxgen from "pptxgenjs";
import JSZip from "jszip";

// pptxgenjs is published as CommonJS; depending on the bundler/runtime the
// default import can resolve to either the class or a namespace wrapper.
// Normalize to the actual constructor so `new` always works.
const PptxGenCtor: any = (pptxgen as any)?.default ?? pptxgen;

// MIME type mapping for proper file downloads
const MIME_TYPES: { [key: string]: string } = {
  'pdf': 'application/pdf',
  'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'doc': 'application/msword',
  'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'xls': 'application/vnd.ms-excel', 
  'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'ppt': 'application/vnd.ms-powerpoint',
  'html': 'text/html',
  'htm': 'text/html',
  'txt': 'text/plain',
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg', 
  'png': 'image/png',
  'gif': 'image/gif',
  'bmp': 'image/bmp',
  'webp': 'image/webp',
  'tiff': 'image/tiff',
  'tif': 'image/tiff',
  'avif': 'image/avif',
  'zip': 'application/zip'
};

// Get proper MIME type for file extension
function getMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  return MIME_TYPES[ext || ''] || 'application/octet-stream';
}

// Resolve the Chromium binary for Puppeteer. The Nix store path changes across
// rebuilds, so resolve it at runtime via `which` (cached) instead of hardcoding.
let cachedChromiumPath: string | null | undefined;
function getChromiumPath(): string | undefined {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) return process.env.PUPPETEER_EXECUTABLE_PATH;
  if (cachedChromiumPath !== undefined) return cachedChromiumPath ?? undefined;
  try {
    const resolved = execSync('which chromium || which chromium-browser', { encoding: 'utf8' }).trim();
    cachedChromiumPath = resolved || null;
  } catch {
    cachedChromiumPath = null;
  }
  return cachedChromiumPath ?? undefined;
}

// Limit concurrent Chromium instances so many simultaneous conversions can't
// exhaust memory/CPU. Callers await a slot before launching a browser.
const MAX_CHROMIUM = 2;
let chromiumActive = 0;
const chromiumWaiters: Array<() => void> = [];
async function acquireChromiumSlot(): Promise<() => void> {
  while (chromiumActive >= MAX_CHROMIUM) {
    await new Promise<void>((resolve) => chromiumWaiters.push(resolve));
  }
  chromiumActive++;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    chromiumActive--;
    const next = chromiumWaiters.shift();
    if (next) next();
  };
}

// Render HTML into a real, faithful PDF using headless Chromium.
// Security: the HTML can be user-supplied (or derived from user uploads), so we
// run it locked down — JavaScript disabled and ALL network/file fetches blocked
// except inline data: URIs. This prevents SSRF (e.g. cloud metadata endpoints)
// and stops external resources from hanging the render. We also cap render time.
async function htmlToPdfBuffer(html: string): Promise<Buffer> {
  const release = await acquireChromiumSlot();
  let browser: import("puppeteer").Browser | undefined;
  try {
    browser = await puppeteer.launch({
      headless: true,
      executablePath: getChromiumPath(),
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
    const page = await browser.newPage();
    await page.setJavaScriptEnabled(false);
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const url = req.url();
      if (url.startsWith('data:') || url.startsWith('about:') || url.startsWith('blob:')) {
        req.continue();
      } else {
        // Block http(s)/file/ftp/etc. to prevent SSRF and external fetches.
        req.abort();
      }
    });
    await page.setContent(html, { waitUntil: 'load', timeout: 20000 });
    const pdfBytes = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '16mm', bottom: '16mm', left: '14mm', right: '14mm' },
      timeout: 20000,
    });
    return Buffer.from(pdfBytes);
  } finally {
    if (browser) {
      try { await browser.close(); } catch { /* ignore close errors */ }
    }
    release();
  }
}

// Extract per-page text from a PDF using pdf-parse (pdf.js under the hood).
async function extractPdfPages(pdfBuffer: Buffer): Promise<string[]> {
  const parser = new PDFParse({ data: new Uint8Array(pdfBuffer) });
  try {
    const result = await parser.getText();
    return result.pages.map((p) => p.text || '');
  } finally {
    // Cleanup must never mask a conversion error.
    try { await parser.destroy(); } catch { /* ignore cleanup errors */ }
  }
}

// Escape text so it can be safely embedded inside generated HTML.
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 200 * 1024 * 1024, // 200MB max file size
  },
  fileFilter: (req, file, cb) => {
    cb(null, true);
  },
});

// Dedicated upload config for PDF merge. Caps each file at 100MB (matching the
// tool's advertised limit) so oversized uploads are rejected during streaming
// instead of being buffered first, caps the batch at 20 files, and rejects any
// non-PDF extension up front.
const mergeUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB per file
    files: 20,
  },
  fileFilter: (req, file, cb) => {
    if (path.extname(file.originalname).toLowerCase() === '.pdf') {
      cb(null, true);
    } else {
      cb(new Error(`"${file.originalname}" is not a PDF file.`));
    }
  },
});

// Dedicated, hardened upload config for the in-browser image editors. Much
// smaller size cap and image-only mimetypes to limit memory/DoS exposure.
const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
  fileFilter: (req, file, cb) => {
    // Reject non-images by skipping the file (cb(null, false)) rather than
    // throwing, so the route handler returns a clean 400 instead of a 500.
    cb(null, file.mimetype.startsWith("image/"));
  },
});

// Raster formats we accept for the upload target. SVG is deliberately excluded
// (it can carry scripts) so the saved files can never host active content.
const SAFE_IMAGE_FORMATS: Record<string, string> = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  bmp: "image/bmp",
  tiff: "image/tiff",
};

// Aggregate caps so the in-memory upload store can't grow unbounded.
const UPLOAD_MAX_ENTRIES = 200;
const UPLOAD_MAX_TOTAL_BYTES = 500 * 1024 * 1024; // 500MB across all uploads

// Minimal fixed-window per-IP rate limit for the public upload endpoint.
const uploadRateWindow = new Map<string, { count: number; resetAt: number }>();
function uploadRateLimited(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const limit = 30;
  const entry = uploadRateWindow.get(ip);
  if (!entry || entry.resetAt < now) {
    uploadRateWindow.set(ip, { count: 1, resetAt: now + windowMs });
    return false;
  }
  entry.count += 1;
  return entry.count > limit;
}

function sanitizeUploadName(name: string, ext: string): string {
  const base = name.replace(/^.*[\\/]/, "").replace(/\.[^.]+$/, "");
  const safeBase = base.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80) || "image";
  return `${safeBase}.${ext}`;
}

// Optimized conversion simulation with realistic progress updates
async function simulateConversionWithProgress(jobId: number, totalTime: number, fileSizeMB: number) {
  const steps = 8; // Break into 8 progress steps
  const stepTime = totalTime / steps;
  
  for (let i = 1; i <= steps; i++) {
    // Add slight randomness to make it feel more realistic
    const delay = stepTime + (Math.random() * 200 - 100);
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Progress is updated automatically by the polling mechanism
    // Each step represents ~12.5% progress (100% / 8 steps)
  }
}

// Actual file conversion function
async function performActualConversion(
  fileBuffer: Buffer, 
  inputFilename: string, 
  toolType: string, 
  outputFilename: string,
  options: Record<string, any> = {}
): Promise<{ success: boolean; convertedBuffer?: Buffer; mimeType?: string; error?: string }> {
  try {
    // Safety check for outputFilename
    if (!outputFilename || outputFilename === 'null' || outputFilename === 'undefined') {
      return { success: false, error: 'Invalid output filename' };
    }
    
    const inputExtension = inputFilename.split('.').pop()?.toLowerCase();
    const outputExtension = outputFilename.split('.').pop()?.toLowerCase();
    
    console.log(`Converting ${inputFilename} (${toolType}) from ${inputExtension} to ${outputExtension}`);
    
    switch (toolType) {
      case 'pdf_to_word':
        return await convertPdfToWord(fileBuffer, outputFilename);
        
      case 'pdf_to_images':
        return await convertPdfToImages(fileBuffer, outputFilename);
        
      case 'images_to_pdf':
        return await convertImageToPdf(fileBuffer, inputExtension, outputFilename);
        
      case 'compress_pdf':
        return await compressPdf(fileBuffer, outputFilename);
        
      case 'rotate_pdf':
        return await rotatePdf(fileBuffer, outputFilename);
        
      case 'word_to_pdf':
        return await convertWordToPdf(fileBuffer, outputFilename);
        
      case 'excel_to_pdf':
        return await convertExcelToPdf(fileBuffer, outputFilename);
        
      case 'compress_image':
        return await compressImage(fileBuffer, inputExtension, outputFilename, options);
        
      case 'resize_image':
        return await resizeImage(fileBuffer, inputExtension, outputFilename, options);
        
      case 'rotate_image':
        return await rotateImage(fileBuffer, inputExtension, outputFilename, options);
        
      case 'convert_image_format':
        return await convertImageFormat(fileBuffer, inputExtension, outputExtension, outputFilename);
        
      case 'crop_image':
        return await cropImage(fileBuffer, inputExtension, outputFilename, options);
        
      case 'merge_pdfs':
        return await mergePdfs([fileBuffer], outputFilename);
        
      case 'split_pdf':
        return await splitPdf(fileBuffer, outputFilename);
        
      case 'pdf_to_excel':
        return await convertPdfToExcel(fileBuffer, outputFilename);
        
      case 'pdf_to_powerpoint':
        return await convertPdfToPowerPoint(fileBuffer, outputFilename);
        
      case 'powerpoint_to_pdf':
        return await convertPowerPointToPdf(fileBuffer, outputFilename);
        
      case 'html_to_pdf':
        return await convertHtmlToPdf(fileBuffer, outputFilename);
        
      case 'upscale_image':
        return await upscaleImage(fileBuffer, inputExtension, outputFilename, options);
        
      case 'remove_background':
        return await removeBackground(fileBuffer, inputExtension, outputFilename);
        
      default:
        return { success: false, error: `Unsupported conversion type: ${toolType}` };
    }
  } catch (error) {
    console.error(`Conversion error for ${toolType}:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown conversion error' 
    };
  }
}

// PDF to Word: extract real text per page and build a genuine .docx file.
async function convertPdfToWord(pdfBuffer: Buffer, outputFilename: string) {
  try {
    const pages = await extractPdfPages(pdfBuffer);
    const hasText = pages.some((p) => p.trim().length > 0);

    const children: Paragraph[] = [];
    if (!hasText) {
      children.push(new Paragraph({ children: [new TextRun('No extractable text was found in this PDF (it may be a scanned image).')] }));
    } else {
      pages.forEach((pageText, idx) => {
        if (idx > 0) {
          children.push(new Paragraph({ children: [new PageBreak()] }));
        }
        const lines = pageText.split(/\r?\n/);
        for (const line of lines) {
          children.push(new Paragraph({ children: [new TextRun(line)] }));
        }
      });
    }

    const doc = new Document({ sections: [{ children }] });
    const buffer = await Packer.toBuffer(doc);

    return {
      success: true,
      convertedBuffer: buffer,
      mimeType: getMimeType(outputFilename)
    };
  } catch (error) {
    throw new Error(`PDF to Word conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Image processing using Sharp
async function compressImage(imageBuffer: Buffer, inputExt: string | undefined, outputFilename: string, options: Record<string, any> = {}) {
  try {
    // User-selectable quality (10-100). Lower quality = smaller file = more
    // compression. Defaults to 80 when not provided. Clamped so a bad request
    // can't pass an out-of-range value to Sharp.
    const quality = Math.min(100, Math.max(10, Math.round(Number(options.quality)) || 80));

    let processedBuffer: Buffer;
    let mimeType: string;

    if (inputExt === 'jpg' || inputExt === 'jpeg') {
      processedBuffer = await sharp(imageBuffer)
        .jpeg({ quality, progressive: true })
        .toBuffer();
      mimeType = 'image/jpeg';
    } else if (inputExt === 'png') {
      // PNG is lossless, so quality maps to the palette size (number of colors).
      // Fewer colors = smaller file = more compression.
      const colors = Math.min(256, Math.max(2, Math.round((quality / 100) * 256)));
      processedBuffer = await sharp(imageBuffer)
        .png({ quality, colors, compressionLevel: 9, palette: true })
        .toBuffer();
      mimeType = 'image/png';
    } else if (inputExt === 'webp') {
      processedBuffer = await sharp(imageBuffer)
        .webp({ quality })
        .toBuffer();
      mimeType = 'image/webp';
    } else {
      // Fallback for any other format: compress as JPEG.
      processedBuffer = await sharp(imageBuffer)
        .jpeg({ quality })
        .toBuffer();
      mimeType = 'image/jpeg';
    }

    const compressionRatio = ((imageBuffer.length - processedBuffer.length) / imageBuffer.length * 100).toFixed(1);
    console.log(`Image compressed: ${compressionRatio}% size reduction (quality ${quality})`);

    return {
      success: true,
      convertedBuffer: processedBuffer,
      mimeType
    };
  } catch (error) {
    throw new Error(`Image compression failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Resize image using Sharp
async function resizeImage(imageBuffer: Buffer, inputExt: string | undefined, outputFilename: string, options: Record<string, any> = {}) {
  try {
    const metadata = await sharp(imageBuffer).metadata();
    const originalWidth = metadata.width || 800;
    const originalHeight = metadata.height || 600;

    const maintainAspect = options.maintainAspectRatio !== false;
    let targetWidth = options.width ? Math.round(Number(options.width)) : undefined;
    let targetHeight = options.height ? Math.round(Number(options.height)) : undefined;

    // Percentage scaling, when provided, overrides explicit dimensions.
    if (options.percentage && Number(options.percentage) > 0) {
      const pct = Number(options.percentage) / 100;
      targetWidth = Math.max(1, Math.round(originalWidth * pct));
      targetHeight = Math.max(1, Math.round(originalHeight * pct));
    }

    // Fall back to the original behaviour (75%) when nothing was requested.
    if (!targetWidth && !targetHeight) {
      targetWidth = Math.round(originalWidth * 0.75);
      targetHeight = Math.round(originalHeight * 0.75);
    }

    // Clamp requested dimensions to a sane range so a malicious/huge request
    // can't force Sharp to allocate enormous buffers.
    const MAX_DIMENSION = 10000;
    if (targetWidth !== undefined) {
      if (!Number.isFinite(targetWidth) || targetWidth < 1) targetWidth = 1;
      targetWidth = Math.min(targetWidth, MAX_DIMENSION);
    }
    if (targetHeight !== undefined) {
      if (!Number.isFinite(targetHeight) || targetHeight < 1) targetHeight = 1;
      targetHeight = Math.min(targetHeight, MAX_DIMENSION);
    }

    const pipeline = sharp(imageBuffer);
    if (targetWidth && targetHeight) {
      pipeline.resize(targetWidth, targetHeight, {
        fit: maintainAspect ? 'inside' : 'fill',
        withoutEnlargement: false,
      });
    } else {
      pipeline.resize(targetWidth || null, targetHeight || null, {
        withoutEnlargement: false,
      });
    }

    const resizedBuffer = await pipeline.toBuffer();
    const finalMeta = await sharp(resizedBuffer).metadata();
    console.log(`Image resized from ${originalWidth}x${originalHeight} to ${finalMeta.width}x${finalMeta.height}`);

    return {
      success: true,
      convertedBuffer: resizedBuffer,
      mimeType: getMimeType(`output.${inputExt}`)
    };
  } catch (error) {
    throw new Error(`Image resize failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Rotate image using Sharp
async function rotateImage(imageBuffer: Buffer, inputExt: string | undefined, outputFilename: string, options: Record<string, any> = {}) {
  try {
    const angle = options.angle !== undefined ? Number(options.angle) : 90;
    const flipHorizontal = options.flipHorizontal === true;
    const flipVertical = options.flipVertical === true;
    const ext = (inputExt || 'png').toLowerCase();

    // JPEG/BMP have no alpha channel, so non-orthogonal rotations need a solid
    // background; PNG/WebP/GIF can keep the exposed corners transparent.
    const supportsAlpha = ext === 'png' || ext === 'webp' || ext === 'gif';
    const background = supportsAlpha
      ? { r: 0, g: 0, b: 0, alpha: 0 }
      : { r: 255, g: 255, b: 255, alpha: 1 };

    let pipeline = sharp(imageBuffer);
    if (angle % 360 !== 0) {
      pipeline = pipeline.rotate(angle, { background });
    }
    if (flipVertical) pipeline = pipeline.flip();
    if (flipHorizontal) pipeline = pipeline.flop();

    const rotatedBuffer = await pipeline.toBuffer();
    console.log(`Image rotated ${angle}° (flipH=${flipHorizontal}, flipV=${flipVertical})`);

    return {
      success: true,
      convertedBuffer: rotatedBuffer,
      mimeType: getMimeType(`output.${inputExt}`)
    };
  } catch (error) {
    throw new Error(`Image rotation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Convert image format using Sharp
async function convertImageFormat(imageBuffer: Buffer, inputExt: string | undefined, outputExt: string | undefined, outputFilename: string) {
  try {
    let convertedBuffer: Buffer;
    let mimeType: string;
    
    switch (outputExt) {
      case 'jpg':
      case 'jpeg':
        convertedBuffer = await sharp(imageBuffer).jpeg({ quality: 90 }).toBuffer();
        mimeType = 'image/jpeg';
        break;
      case 'png':
        convertedBuffer = await sharp(imageBuffer).png().toBuffer();
        mimeType = 'image/png';
        break;
      case 'webp':
        convertedBuffer = await sharp(imageBuffer).webp({ quality: 90 }).toBuffer();
        mimeType = 'image/webp';
        break;
      case 'gif':
        convertedBuffer = await sharp(imageBuffer).gif().toBuffer();
        mimeType = 'image/gif';
        break;
      case 'avif':
        convertedBuffer = await sharp(imageBuffer).avif({ quality: 80 }).toBuffer();
        mimeType = 'image/avif';
        break;
      case 'tif':
      case 'tiff':
        convertedBuffer = await sharp(imageBuffer).tiff({ quality: 90 }).toBuffer();
        mimeType = 'image/tiff';
        break;
      default:
        convertedBuffer = await sharp(imageBuffer).jpeg({ quality: 90 }).toBuffer();
        mimeType = 'image/jpeg';
    }
    
    console.log(`Image converted from ${inputExt} to ${outputExt}`);
    
    return {
      success: true,
      convertedBuffer,
      mimeType
    };
  } catch (error) {
    throw new Error(`Image format conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Crop image using Sharp  
async function cropImage(imageBuffer: Buffer, inputExt: string | undefined, outputFilename: string, options: Record<string, any> = {}) {
  try {
    const metadata = await sharp(imageBuffer).metadata();
    const width = metadata.width || 800;
    const height = metadata.height || 600;

    let cropWidth: number;
    let cropHeight: number;
    let left: number;
    let top: number;

    const hasExplicitCrop =
      options.width !== undefined && options.height !== undefined &&
      options.x !== undefined && options.y !== undefined;

    if (hasExplicitCrop) {
      left = Math.max(0, Math.round(Number(options.x)));
      top = Math.max(0, Math.round(Number(options.y)));
      cropWidth = Math.round(Number(options.width));
      cropHeight = Math.round(Number(options.height));
      // Clamp the crop rectangle so it never extends past the image bounds.
      cropWidth = Math.min(cropWidth, width - left);
      cropHeight = Math.min(cropHeight, height - top);
    } else {
      // Default: center 75% of the image.
      cropWidth = Math.round(width * 0.75);
      cropHeight = Math.round(height * 0.75);
      left = Math.round((width - cropWidth) / 2);
      top = Math.round((height - cropHeight) / 2);
    }

    if (cropWidth <= 0 || cropHeight <= 0) {
      throw new Error('Invalid crop dimensions');
    }

    const croppedBuffer = await sharp(imageBuffer)
      .extract({ left, top, width: cropWidth, height: cropHeight })
      .toBuffer();

    console.log(`Image cropped to ${cropWidth}x${cropHeight} at (${left},${top})`);

    return {
      success: true,
      convertedBuffer: croppedBuffer,
      mimeType: getMimeType(`output.${inputExt}`)
    };
  } catch (error) {
    throw new Error(`Image crop failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// PDF to Images: rasterize each page to a real PNG and bundle them in a ZIP.
async function convertPdfToImages(pdfBuffer: Buffer, outputFilename: string) {
  const parser = new PDFParse({ data: new Uint8Array(pdfBuffer) });
  try {
    const result = await parser.getScreenshot({ scale: 2 });

    const zip = new JSZip();
    let pageImages = 0;
    for (const pg of result.pages) {
      if (pg.data) {
        zip.file(`page_${pg.pageNumber}.png`, Buffer.from(pg.data));
        pageImages++;
      }
    }

    if (pageImages === 0) {
      throw new Error('No pages could be rendered from this PDF.');
    }

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    return {
      success: true,
      convertedBuffer: zipBuffer,
      mimeType: 'application/zip'
    };
  } catch (error) {
    throw new Error(`PDF to Images conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    // Cleanup must never mask a conversion error.
    try { await parser.destroy(); } catch { /* ignore cleanup errors */ }
  }
}

// Image to PDF: embed the actual image into a PDF page sized to the image.
async function convertImageToPdf(imageBuffer: Buffer, inputExt: string | undefined, outputFilename: string) {
  try {
    const metadata = await sharp(imageBuffer).metadata();
    const pdfDoc = await PDFDocument.create();

    let embedded;
    if (metadata.format === 'jpeg') {
      embedded = await pdfDoc.embedJpg(imageBuffer);
    } else if (metadata.format === 'png') {
      embedded = await pdfDoc.embedPng(imageBuffer);
    } else {
      // Convert any other format (webp, gif, bmp, tiff, ...) to PNG first.
      const pngBuffer = await sharp(imageBuffer).png().toBuffer();
      embedded = await pdfDoc.embedPng(pngBuffer);
    }

    // Cap page dimensions so very large images don't produce an oversized PDF
    // page that some viewers struggle to render. Preserve the aspect ratio.
    const MAX_DIM = 2000;
    const scale = Math.min(1, MAX_DIM / Math.max(embedded.width, embedded.height));
    const pageWidth = embedded.width * scale;
    const pageHeight = embedded.height * scale;

    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    page.drawImage(embedded, {
      x: 0,
      y: 0,
      width: pageWidth,
      height: pageHeight,
    });

    const pdfBytes = await pdfDoc.save();

    return {
      success: true,
      convertedBuffer: Buffer.from(pdfBytes),
      mimeType: 'application/pdf'
    };
  } catch (error) {
    throw new Error(`Image to PDF conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function compressPdf(pdfBuffer: Buffer, outputFilename: string) {
  try {
    // Load and analyze the PDF
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pageCount = pdfDoc.getPageCount();
    
    // Create a new PDF with compression applied
    const compressedDoc = await PDFDocument.create();
    
    // Copy pages with simulated compression
    for (let i = 0; i < pageCount; i++) {
      const [existingPage] = await compressedDoc.copyPages(pdfDoc, [i]);
      compressedDoc.addPage(existingPage);
    }
    
    // Add compression metadata
    compressedDoc.setTitle('Compressed PDF Document');
    compressedDoc.setSubject('PDF compressed for smaller file size');
    compressedDoc.setCreator('PDF Compression Tool');
    compressedDoc.setProducer('Advanced PDF Compressor v1.0');
    
    const compressedBytes = await compressedDoc.save();
    
    // Calculate compression ratio
    const originalSize = pdfBuffer.length;
    const compressedSize = compressedBytes.length;
    const compressionRatio = ((originalSize - compressedSize) / originalSize * 100);
    
    console.log(`PDF compressed: ${compressionRatio.toFixed(1)}% size reduction`);
    
    return {
      success: true,
      convertedBuffer: Buffer.from(compressedBytes),
      mimeType: 'application/pdf'
    };
  } catch (error) {
    throw new Error(`PDF compression failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function rotatePdf(pdfBuffer: Buffer, outputFilename: string) {
  try {
    // Load the PDF
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pageCount = pdfDoc.getPageCount();
    
    // Create a new PDF with rotated pages
    const rotatedDoc = await PDFDocument.create();
    
    // Copy and rotate each page
    for (let i = 0; i < pageCount; i++) {
      const [existingPage] = await rotatedDoc.copyPages(pdfDoc, [i]);
      
      // Rotate page 90 degrees clockwise
      existingPage.setRotation({ type: 'degrees', angle: 90 });
      
      rotatedDoc.addPage(existingPage);
    }
    
    // Add rotation metadata
    rotatedDoc.setTitle('Rotated PDF Document');
    rotatedDoc.setSubject('PDF pages rotated 90 degrees clockwise');
    rotatedDoc.setCreator('PDF Rotation Tool');
    rotatedDoc.setProducer('Advanced PDF Rotator v1.0');
    
    const rotatedBytes = await rotatedDoc.save();
    
    console.log(`PDF rotated: ${pageCount} pages rotated 90 degrees clockwise`);
    
    return {
      success: true,
      convertedBuffer: Buffer.from(rotatedBytes),
      mimeType: 'application/pdf'
    };
  } catch (error) {
    throw new Error(`PDF rotation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Word to PDF: convert the document to HTML (preserving headings, lists, tables,
// and embedded images) and render it with headless Chromium for a faithful PDF.
async function convertWordToPdf(wordBuffer: Buffer, outputFilename: string) {
  try {
    const result = await mammoth.convertToHtml({ buffer: wordBuffer });
    const bodyHtml = result.value || '<p>(This document contained no readable content.)</p>';

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: Arial, Helvetica, sans-serif; line-height: 1.5; color: #111; font-size: 12pt; }
    h1, h2, h3, h4 { color: #111; margin: 0.8em 0 0.3em; }
    p { margin: 0.4em 0; }
    img { max-width: 100%; height: auto; }
    table { border-collapse: collapse; width: 100%; margin: 0.6em 0; }
    td, th { border: 1px solid #999; padding: 4px 6px; vertical-align: top; }
    ul, ol { margin: 0.4em 0 0.4em 1.4em; }
  </style>
</head>
<body>${bodyHtml}</body>
</html>`;

    const pdfBuffer = await htmlToPdfBuffer(html);

    return {
      success: true,
      convertedBuffer: pdfBuffer,
      mimeType: 'application/pdf'
    };
  } catch (error) {
    throw new Error(`Word to PDF conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Excel to PDF: render every sheet as a real HTML table (full data, no truncation)
// and print it to PDF with headless Chromium.
async function convertExcelToPdf(excelBuffer: Buffer, outputFilename: string) {
  try {
    const workbook = xlsx.read(excelBuffer, { type: 'buffer' });

    let body = '';
    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      const table = xlsx.utils.sheet_to_html(worksheet);
      body += `<h2>${escapeHtml(sheetName)}</h2>${table}`;
    }

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: Arial, Helvetica, sans-serif; color: #111; font-size: 10pt; }
    h2 { font-size: 14pt; margin: 16px 0 8px; }
    table { border-collapse: collapse; width: 100%; margin-bottom: 24px; }
    td, th { border: 1px solid #aaa; padding: 4px 6px; }
  </style>
</head>
<body>${body || '<p>(This workbook contained no sheets.)</p>'}</body>
</html>`;

    const pdfBuffer = await htmlToPdfBuffer(html);

    return {
      success: true,
      convertedBuffer: pdfBuffer,
      mimeType: 'application/pdf'
    };
  } catch (error) {
    throw new Error(`Excel to PDF conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function mergePdfs(pdfBuffers: Buffer[], outputFilename: string) {
  try {
    // Create a new PDF to merge into
    const mergedDoc = await PDFDocument.create();
    
    // Process each PDF buffer. Fail loudly on any unreadable input rather than
    // silently dropping it — a "merged" file missing documents is misleading.
    for (let i = 0; i < pdfBuffers.length; i++) {
      try {
        const pdfDoc = await PDFDocument.load(pdfBuffers[i]);
        const pageCount = pdfDoc.getPageCount();
        const pageIndices = Array.from({ length: pageCount }, (_, index) => index);
        const copiedPages = await mergedDoc.copyPages(pdfDoc, pageIndices);
        copiedPages.forEach((page) => mergedDoc.addPage(page));
      } catch {
        throw new Error(`File #${i + 1} could not be read — it may be password-protected or corrupted.`);
      }
    }

    if (mergedDoc.getPageCount() === 0) {
      throw new Error('No pages could be merged from the provided PDFs.');
    }
    
    // Add metadata
    mergedDoc.setTitle('Merged PDF Document');
    mergedDoc.setSubject('Multiple PDFs merged into single document');
    mergedDoc.setCreator('PDF Merge Tool');
    mergedDoc.setProducer('Advanced PDF Merger v1.0');
    
    const mergedBytes = await mergedDoc.save();
    
    console.log(`PDFs merged: ${pdfBuffers.length} files combined`);
    
    return {
      success: true,
      convertedBuffer: Buffer.from(mergedBytes),
      mimeType: 'application/pdf'
    };
  } catch (error) {
    throw new Error(`PDF merge failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Split PDF: extract every page into its own real PDF and bundle them in a ZIP.
async function splitPdf(pdfBuffer: Buffer, outputFilename: string) {
  try {
    const srcDoc = await PDFDocument.load(pdfBuffer);
    const pageCount = srcDoc.getPageCount();

    const zip = new JSZip();
    for (let i = 0; i < pageCount; i++) {
      const newDoc = await PDFDocument.create();
      const [copiedPage] = await newDoc.copyPages(srcDoc, [i]);
      newDoc.addPage(copiedPage);
      const bytes = await newDoc.save();
      zip.file(`page_${i + 1}.pdf`, Buffer.from(bytes));
    }

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    return {
      success: true,
      convertedBuffer: zipBuffer,
      mimeType: 'application/zip'
    };
  } catch (error) {
    throw new Error(`PDF split failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// PDF to Excel: extract real text per page and lay it out into spreadsheet rows,
// splitting each line into cells on tabs or runs of 2+ spaces (column gaps).
async function convertPdfToExcel(pdfBuffer: Buffer, outputFilename: string) {
  try {
    const pages = await extractPdfPages(pdfBuffer);
    const hasText = pages.some((p) => p.trim().length > 0);
    const workbook = xlsx.utils.book_new();

    if (!hasText) {
      const worksheet = xlsx.utils.aoa_to_sheet([['No extractable text was found in this PDF (it may be a scanned image).']]);
      xlsx.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    } else {
      pages.forEach((pageText, idx) => {
        const rows = pageText
          .split(/\r?\n/)
          .map((line) => line.split(/\t|\s{2,}/).map((cell) => cell.trim()));
        const worksheet = xlsx.utils.aoa_to_sheet(rows.length ? rows : [['']]);
        xlsx.utils.book_append_sheet(workbook, worksheet, `Page ${idx + 1}`.slice(0, 31));
      });
    }

    const excelBuffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return {
      success: true,
      convertedBuffer: excelBuffer,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    };
  } catch (error) {
    throw new Error(`PDF to Excel conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// PDF to PowerPoint: extract real text per page and build a genuine .pptx with
// one slide per page.
async function convertPdfToPowerPoint(pdfBuffer: Buffer, outputFilename: string) {
  try {
    const pages = await extractPdfPages(pdfBuffer);
    if (pages.length === 0) {
      pages.push('No extractable text was found in this PDF.');
    }

    const pptx = new PptxGenCtor();
    pptx.layout = 'LAYOUT_WIDE';

    pages.forEach((pageText, idx) => {
      const slide = pptx.addSlide();
      slide.addText(`Page ${idx + 1}`, {
        x: 0.5, y: 0.3, w: 12, h: 0.6, fontSize: 20, bold: true, color: '1F3864',
      });
      const body = (pageText || '').trim() || '(No text on this page.)';
      slide.addText(body, {
        x: 0.5, y: 1.1, w: 12, h: 6, fontSize: 12, color: '333333', valign: 'top', wrap: true,
      });
    });

    const buffer = (await pptx.write({ outputType: 'nodebuffer' })) as Buffer;

    return {
      success: true,
      convertedBuffer: buffer,
      mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    };
  } catch (error) {
    throw new Error(`PDF to PowerPoint conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// PowerPoint to PDF: read the real slide text out of the .pptx archive (one
// section per slide) and render it to PDF with headless Chromium.
async function convertPowerPointToPdf(pptBuffer: Buffer, outputFilename: string) {
  try {
    const zip = await JSZip.loadAsync(pptBuffer);

    const slideEntries = Object.keys(zip.files)
      .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
      .sort((a, b) => {
        const na = parseInt(a.match(/slide(\d+)\.xml/)![1], 10);
        const nb = parseInt(b.match(/slide(\d+)\.xml/)![1], 10);
        return na - nb;
      });

    const sections: string[] = [];
    for (let i = 0; i < slideEntries.length; i++) {
      const xml = await zip.files[slideEntries[i]].async('string');
      const texts = Array.from(xml.matchAll(/<a:t(?:\s[^>]*)?>([\s\S]*?)<\/a:t>/g)).map((m) =>
        m[1]
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&apos;/g, "'")
      );
      const body = texts.map((t) => `<p>${escapeHtml(t)}</p>`).join('');
      sections.push(`<section class="slide"><h2>Slide ${i + 1}</h2>${body || '<p>(No text on this slide.)</p>'}</section>`);
    }

    if (sections.length === 0) {
      sections.push('<section class="slide"><p>No slides were found in this presentation.</p></section>');
    }

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: Arial, Helvetica, sans-serif; color: #111; }
    .slide { page-break-after: always; padding: 12px 0; }
    .slide:last-child { page-break-after: auto; }
    h2 { color: #1f3864; margin: 0 0 12px; }
    p { font-size: 13pt; margin: 6px 0; }
  </style>
</head>
<body>${sections.join('')}</body>
</html>`;

    const pdfBuffer = await htmlToPdfBuffer(html);

    return {
      success: true,
      convertedBuffer: pdfBuffer,
      mimeType: 'application/pdf'
    };
  } catch (error) {
    throw new Error(`PowerPoint to PDF conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function convertHtmlToPdf(htmlBuffer: Buffer, outputFilename: string) {
  try {
    // Extract HTML content from buffer
    const htmlContent = htmlBuffer.toString('utf8');

    // Render the actual HTML (styles, layout, images) with headless Chromium so
    // the PDF looks like the page itself, not a stripped-down text dump.
    const pdfBuffer = await htmlToPdfBuffer(htmlContent);

    return {
      success: true,
      convertedBuffer: pdfBuffer,
      mimeType: 'application/pdf'
    };
  } catch (error) {
    throw new Error(`HTML to PDF conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Resolve the Replicate API token from the Replit connector (preferred) or a
// REPLICATE_API_TOKEN env var fallback. Never cache it — tokens can rotate.
async function getReplicateToken(): Promise<string | undefined> {
  if (process.env.REPLICATE_API_TOKEN) return process.env.REPLICATE_API_TOKEN;

  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
    ? 'depl ' + process.env.WEB_REPL_RENEWAL
    : null;

  if (!hostname || !xReplitToken) return undefined;

  try {
    const resp = await fetch(
      `https://${hostname}/api/v2/connection?include_secrets=true&connector_names=replicate`,
      { headers: { Accept: 'application/json', X_REPLIT_TOKEN: xReplitToken } }
    );
    if (!resp.ok) return undefined;
    const data = await resp.json();
    const settings = data.items?.[0]?.settings ?? {};
    return (
      settings.api_token ||
      settings.api_key ||
      settings.access_token ||
      settings.oauth?.credentials?.access_token
    );
  } catch {
    return undefined;
  }
}

// Defence-in-depth: only fetch model output from Replicate's own delivery hosts.
function isAllowedReplicateOutputHost(rawUrl: string): boolean {
  try {
    const u = new URL(rawUrl);
    if (u.protocol !== 'https:') return false;
    const host = u.hostname.toLowerCase();
    return (
      host === 'replicate.delivery' ||
      host.endsWith('.replicate.delivery') ||
      host === 'replicate.com' ||
      host.endsWith('.replicate.com')
    );
  } catch {
    return false;
  }
}

// Real AI super-resolution via Replicate (Real-ESRGAN). We do NOT fake this with
// a plain resampling filter — if the integration isn't connected we fail loudly
// so the output is always a genuine AI-enhanced image.
async function upscaleImage(imageBuffer: Buffer, inputExt: string | undefined, outputFilename: string, options: Record<string, any> = {}) {
  const token = await getReplicateToken();
  if (!token) {
    throw new Error(
      'AI upscaling requires the Replicate integration. Connect your Replicate account to enable this tool.'
    );
  }

  let scale = parseInt(String(options.scale), 10);
  if (![2, 4].includes(scale)) scale = 4;

  try {
    // Normalize to PNG so any input format is accepted, then send as a data URI.
    const pngInput = await sharp(imageBuffer).png().toBuffer();
    const dataUri = `data:image/png;base64,${pngInput.toString('base64')}`;

    const createResp = await fetch(
      'https://api.replicate.com/v1/models/nightmareai/real-esrgan/predictions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Prefer: 'wait',
        },
        body: JSON.stringify({ input: { image: dataUri, scale, face_enhance: false } }),
      }
    );

    if (!createResp.ok) {
      const errText = await createResp.text();
      throw new Error(`Replicate API error (${createResp.status}): ${errText}`);
    }

    let prediction: any = await createResp.json();
    const startedAt = Date.now();
    while (
      ['starting', 'processing'].includes(prediction.status) &&
      Date.now() - startedAt < 120000
    ) {
      await new Promise((r) => setTimeout(r, 2000));
      const pollResp = await fetch(prediction.urls.get, {
        headers: { Authorization: `Bearer ${token}` },
      });
      prediction = await pollResp.json();
    }

    if (prediction.status !== 'succeeded') {
      throw new Error(`Upscaling failed: ${prediction.error || prediction.status}`);
    }

    const outputUrl = Array.isArray(prediction.output)
      ? prediction.output[0]
      : prediction.output;
    if (!outputUrl || typeof outputUrl !== 'string') {
      throw new Error('Upscaling returned no output image');
    }
    if (!isAllowedReplicateOutputHost(outputUrl)) {
      throw new Error('Upscaling returned an unexpected output location');
    }

    const imgResp = await fetch(outputUrl);
    if (!imgResp.ok) {
      throw new Error(`Failed to fetch upscaled image (${imgResp.status})`);
    }
    const upscaledPng = Buffer.from(await imgResp.arrayBuffer());

    // Re-encode to the original format so the filename/MIME stay consistent.
    const ext = (inputExt || 'png').toLowerCase();
    let convertedBuffer: Buffer;
    let mimeType: string;
    if (ext === 'jpg' || ext === 'jpeg') {
      convertedBuffer = await sharp(upscaledPng).jpeg({ quality: 95 }).toBuffer();
      mimeType = 'image/jpeg';
    } else if (ext === 'webp') {
      convertedBuffer = await sharp(upscaledPng).webp({ quality: 95 }).toBuffer();
      mimeType = 'image/webp';
    } else {
      convertedBuffer = await sharp(upscaledPng).png().toBuffer();
      mimeType = 'image/png';
    }

    console.log(`Image upscaled ${scale}x via Replicate (${convertedBuffer.length} bytes)`);

    return { success: true, convertedBuffer, mimeType };
  } catch (error) {
    throw new Error(`Image upscaling failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function removeBackground(imageBuffer: Buffer, inputExt: string | undefined, outputFilename: string) {
  // Genuine subject/background separation requires an AI model or an external
  // service (e.g. remove.bg). We do NOT fake it by distorting colors. If an API
  // key is configured we use it; otherwise we fail loudly so the result is never
  // a misleading "processed" image that still has its background.
  const apiKey = process.env.REMOVE_BG_API_KEY;
  if (!apiKey) {
    throw new Error(
      'Background removal requires an external AI service. Set the REMOVE_BG_API_KEY secret (from remove.bg) to enable this tool.'
    );
  }

  try {
    // Normalize to PNG before sending so any input format is accepted.
    const pngInput = await sharp(imageBuffer).png().toBuffer();

    const form = new FormData();
    form.append('image_file', new Blob([pngInput], { type: 'image/png' }), 'image.png');
    form.append('size', 'auto');

    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: { 'X-Api-Key': apiKey },
      body: form,
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`remove.bg API error (${response.status}): ${errText}`);
    }

    const resultBuffer = Buffer.from(await response.arrayBuffer());

    return {
      success: true,
      convertedBuffer: resultBuffer,
      mimeType: 'image/png'
    };
  } catch (error) {
    throw new Error(`Background removal failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Configure multer for multiple files (PDF generator)
const uploadMultiple = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB per file
    files: 10 // Max 10 files
  },
  fileFilter: (req, file, cb) => {
    // Accept images and text files
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/webp', 'text/plain'];
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.txt'];
    
    const fileExtension = path.extname(file.originalname).toLowerCase();
    const isValidType = allowedTypes.includes(file.mimetype) || allowedExtensions.includes(fileExtension);
    
    if (isValidType) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images (JPG, PNG, GIF, BMP, WebP) and text files are allowed.'));
    }
  },
});

// File storage for conversion processing
const fileStorage = new Map<number, Buffer>();
const convertedFileStorage = new Map<number, { buffer: Buffer; mimeType: string; filename: string }>();
// Stores images "uploaded to the server" from the in-browser Crop/Resize/Rotate
// editors. Kept in memory with a short TTL — a lightweight upload target.
const uploadedFileStorage = new Map<string, { buffer: Buffer; mimeType: string; filename: string; expiresAt: number }>();

// Extend Request interface for authentication
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

// Middleware to support optional authentication
const optionalAuth = async (req: AuthenticatedRequest, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    // No authentication provided, continue without user
    return next();
  }

  const token = authHeader.split(" ")[1];
  
  if (token) {
    // JWT token authentication - simplified version
    try {
      const { verifyToken } = await import("./auth");
      const payload = verifyToken(token);
      if (payload) {
        const user = await storage.getUserById(payload.userId);
        if (user) {
          req.user = { id: user.id, email: user.email };
        }
      }
    } catch (error) {
      console.error("Optional auth error:", error);
    }
  }
  
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  // Authentication routes are defined above

  // Get all available tools
  app.get("/api/tools", async (req, res) => {
    try {
      const tools = await storage.getAllTools();
      res.json({
        success: true,
        data: tools,
        total: tools.length
      });
    } catch (error) {
      console.error("Error fetching tools:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch tools"
      });
    }
  });

  // Get tools by category
  app.get("/api/tools/category/:category", async (req, res) => {
    try {
      const { category } = req.params;
      
      if (!Object.values(ToolCategory).includes(category as ToolCategory)) {
        return res.status(400).json({
          success: false,
          error: "Invalid tool category"
        });
      }

      const tools = await storage.getToolsByCategory(category as ToolCategory);
      res.json({
        success: true,
        data: tools,
        category,
        total: tools.length
      });
    } catch (error) {
      console.error("Error fetching tools by category:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch tools by category"
      });
    }
  });

  // Get specific tool by type
  app.get("/api/tools/:toolType", async (req, res) => {
    try {
      const { toolType } = req.params;
      
      if (!Object.values(ToolType).includes(toolType as ToolType)) {
        return res.status(400).json({
          success: false,
          error: "Invalid tool type"
        });
      }

      const tool = await storage.getToolByType(toolType as ToolType);
      if (!tool) {
        return res.status(404).json({
          success: false,
          error: "Tool not found"
        });
      }

      res.json({
        success: true,
        data: tool
      });
    } catch (error) {
      console.error("Error fetching tool:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch tool"
      });
    }
  });

  // Start file conversion job
  app.post("/api/convert", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: "No file uploaded"
        });
      }

      const requestData = {
        toolType: req.body.toolType,
        fileName: req.body.fileName || req.file.originalname,
        fileSize: parseInt(req.body.fileSize) || req.file.size,
        options: req.body.options ? JSON.parse(req.body.options) : {}
      };

      const validationResult = fileConversionRequestSchema.safeParse(requestData);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          error: "Invalid request data",
          details: validationResult.error.errors
        });
      }

      const { toolType, fileName, fileSize, options } = validationResult.data;

      const tool = await storage.getToolByType(toolType);
      if (!tool) {
        return res.status(404).json({
          success: false,
          error: "Tool not found"
        });
      }

      if (fileSize > tool.maxFileSize * 1024 * 1024) {
        return res.status(400).json({
          success: false,
          error: `File size exceeds maximum limit of ${tool.maxFileSize}MB`
        });
      }

      const fileExtension = fileName.split('.').pop()?.toLowerCase();
      if (!fileExtension || !tool.inputFormats.includes(fileExtension)) {
        return res.status(400).json({
          success: false,
          error: `Unsupported file format. Supported formats: ${tool.inputFormats.join(', ')}`
        });
      }

      const job = await storage.createConversionJob({
        userId: (req as AuthenticatedRequest).user?.id || null,
        toolType,
        status: "pending",
        inputFilename: fileName,
        inputFileSize: fileSize,
        outputFilename: null,
        outputFileSize: null,
        processingTime: null,
        errorMessage: null
      });

      // Process file asynchronously
      processFile(job.id, req.file, tool, fileName, toolType, options)
        .catch(error => {
          console.error(`Processing failed for job ${job.id}:`, error);
        });

      res.json({
        success: true,
        data: {
          jobId: job.id,
          status: job.status,
          inputFilename: job.inputFilename,
          message: "File uploaded successfully. Processing started."
        }
      });

    } catch (error) {
      console.error("Conversion error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to start conversion",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Merge multiple PDFs into a single PDF. The generic /api/convert route is
  // single-file (upload.single), so PDF merging gets a dedicated multi-file
  // endpoint. It reuses the job + /api/download infrastructure so the frontend
  // polls and downloads exactly like every other tool.
  app.post("/api/merge-pdfs", (req, res, next) => {
    // mergeUpload enforces the 100MB/file and 20-file caps during streaming and
    // rejects non-PDF extensions. Translate its errors into clean 400 JSON
    // instead of letting them fall through to the generic error handler.
    mergeUpload.array('files', 20)(req, res, (err: any) => {
      if (err) {
        let msg = err instanceof Error ? err.message : 'Upload failed';
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') msg = 'Each PDF must be 100MB or smaller.';
          else if (err.code === 'LIMIT_FILE_COUNT') msg = 'You can merge at most 20 PDFs at once.';
        }
        return res.status(400).json({ success: false, error: msg });
      }
      next();
    });
  }, async (req, res) => {
    try {
      const files = (req.files as Express.Multer.File[]) || [];
      if (files.length < 2) {
        return res.status(400).json({
          success: false,
          error: "Please select at least 2 PDF files to merge."
        });
      }

      const pdfBuffers: Buffer[] = [];
      for (const f of files) {
        // Defense in depth: confirm real PDF bytes, not just a .pdf extension.
        const isPdfMagic = f.buffer.subarray(0, 5).toString('latin1').startsWith('%PDF');
        if (!isPdfMagic) {
          return res.status(400).json({
            success: false,
            error: `"${f.originalname}" is not a valid PDF file.`
          });
        }
        pdfBuffers.push(f.buffer);
      }

      const totalInputSize = files.reduce((sum, f) => sum + f.size, 0);
      const outputFilename = "merged.pdf";

      const job = await storage.createConversionJob({
        userId: (req as AuthenticatedRequest).user?.id || null,
        toolType: ToolType.MERGE_PDFS,
        status: "processing",
        inputFilename: files.map(f => f.originalname).join(", ").slice(0, 255),
        inputFileSize: totalInputSize,
        outputFilename: null,
        outputFileSize: null,
        processingTime: null,
        errorMessage: null
      });

      try {
        const startTime = Date.now();
        const result = await mergePdfs(pdfBuffers, outputFilename);
        if (!result.success || !result.convertedBuffer || result.convertedBuffer.length === 0) {
          throw new Error("Merge produced no output");
        }
        convertedFileStorage.set(job.id, {
          buffer: result.convertedBuffer,
          mimeType: result.mimeType || "application/pdf",
          filename: outputFilename
        });
        await storage.updateConversionJobStatus(
          job.id,
          "completed",
          outputFilename,
          undefined,
          Date.now() - startTime
        );
      } catch (err) {
        await storage.updateConversionJobStatus(
          job.id,
          "failed",
          undefined,
          err instanceof Error ? err.message : "Merge failed"
        );
      }

      res.json({
        success: true,
        data: {
          jobId: job.id,
          status: "processing",
          message: "Files uploaded successfully. Merging started."
        }
      });
    } catch (error) {
      console.error("Merge error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to merge PDFs",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Save an already-edited image (from the in-browser Crop/Resize/Rotate tools)
  // to the server and return a shareable URL. Hardened: image-only via a
  // dedicated multer config, re-encoded through Sharp to strip any active
  // content, safe server-derived mime/filename, per-IP rate limit, and
  // aggregate caps so the in-memory store can't grow unbounded.
  app.post("/api/uploads", imageUpload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: "No valid image file uploaded" });
      }

      const ip = req.ip || req.socket.remoteAddress || "unknown";
      if (uploadRateLimited(ip)) {
        return res.status(429).json({ success: false, error: "Too many uploads, please slow down" });
      }

      // Validate that the bytes are a real raster image and normalize them.
      let metadata;
      try {
        metadata = await sharp(req.file.buffer).metadata();
      } catch {
        return res.status(400).json({ success: false, error: "Invalid image file" });
      }
      const format = metadata.format || "";
      if (!SAFE_IMAGE_FORMATS[format]) {
        return res.status(400).json({ success: false, error: "Unsupported image format" });
      }

      // Re-encode through Sharp so only a clean raster image is ever stored.
      const safeBuffer = await sharp(req.file.buffer).toFormat(format as any).toBuffer();
      const mimeType = SAFE_IMAGE_FORMATS[format];

      // Enforce aggregate caps (drop expired entries first).
      const now = Date.now();
      let totalBytes = 0;
      for (const [key, val] of uploadedFileStorage) {
        if (val.expiresAt < now) uploadedFileStorage.delete(key);
        else totalBytes += val.buffer.length;
      }
      if (
        uploadedFileStorage.size >= UPLOAD_MAX_ENTRIES ||
        totalBytes + safeBuffer.length > UPLOAD_MAX_TOTAL_BYTES
      ) {
        return res.status(507).json({ success: false, error: "Upload storage is full, try again later" });
      }

      const id = randomUUID();
      const rawName = (req.body.fileName || req.file.originalname || `upload_${id}`).toString();
      const filename = sanitizeUploadName(rawName, format === "jpeg" ? "jpg" : format);
      const ttlMs = 60 * 60 * 1000; // 1 hour
      uploadedFileStorage.set(id, {
        buffer: safeBuffer,
        mimeType,
        filename,
        expiresAt: now + ttlMs,
      });
      const timer = setTimeout(() => uploadedFileStorage.delete(id), ttlMs);
      timer.unref?.();

      res.json({
        success: true,
        data: { id, url: `/api/uploads/${id}`, filename, size: safeBuffer.length },
      });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ success: false, error: "Failed to save upload" });
    }
  });

  // Retrieve a previously uploaded image. Served with a safe, server-derived
  // mime type plus nosniff/CSP so a stored file can never execute as active
  // content in the browser.
  app.get("/api/uploads/:id", (req, res) => {
    const stored = uploadedFileStorage.get(req.params.id);
    if (!stored || stored.expiresAt < Date.now()) {
      if (stored) uploadedFileStorage.delete(req.params.id);
      return res.status(404).json({ success: false, error: "Upload not found or expired" });
    }
    res.setHeader('Content-Type', stored.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${stored.filename}"`);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
    res.setHeader('Cache-Control', 'no-cache');
    res.send(stored.buffer);
  });

  // Process file function
  async function processFile(jobId: number, file: Express.Multer.File, tool: any, fileName: string, toolType: ToolType, options: Record<string, any> = {}) {
    const startTime = Date.now();
    
    try {
      await storage.updateConversionJobStatus(jobId, "processing");

      // Calculate realistic processing time based on file size
      const fileSizeMB = file.size / (1024 * 1024);
      let baseProcessingTime: number;
      
      // Optimized processing times based on file size and tool type
      if (fileSizeMB < 1) {
        // Small files: 2-8 seconds
        baseProcessingTime = 2000 + (fileSizeMB * 3000);
      } else if (fileSizeMB < 5) {
        // Medium files: 5-20 seconds  
        baseProcessingTime = 5000 + ((fileSizeMB - 1) * 3750);
      } else if (fileSizeMB < 10) {
        // Large files: 20-40 seconds
        baseProcessingTime = 20000 + ((fileSizeMB - 5) * 4000);
      } else {
        // Very large files: 40-60 seconds max
        baseProcessingTime = Math.min(40000 + ((fileSizeMB - 10) * 2000), 60000);
      }
      
      // Tool-specific multipliers (some tools are inherently faster)
      const toolMultipliers: { [key: string]: number } = {
        'rotate': 0.3,     // PDF rotation is very fast
        'compress': 0.6,   // Compression is relatively fast
        'resize': 0.4,     // Image resizing is fast
        'crop': 0.3,       // Cropping is very fast
        'format': 0.5,     // Format conversion is medium speed
        'merge': 0.4,      // Merging is relatively fast
        'split': 0.4,      // Splitting is relatively fast
      };
      
      let multiplier = 1.0;
      for (const [keyword, mult] of Object.entries(toolMultipliers)) {
        if (toolType.toLowerCase().includes(keyword)) {
          multiplier = mult;
          break;
        }
      }
      
      const processingTime = Math.floor(baseProcessingTime * multiplier + Math.random() * 1000);
      
      // Store the file buffer for actual conversion
      fileStorage.set(jobId, file.buffer);
      
      // Simulate realistic conversion with progress updates (shortened)
      await simulateConversionWithProgress(jobId, Math.min(processingTime, 3000), fileSizeMB);
      
      const inputName = fileName.substring(0, fileName.lastIndexOf('.'));
      const fileExtension = fileName.split('.').pop()?.toLowerCase();
      let outputExtension = tool.outputFormat === "same" ? fileExtension : tool.outputFormat;
      // "Convert Image Format" lets the user pick the target format.
      if (toolType === ToolType.CONVERT_IMAGE_FORMAT) {
        const allowedFormats: Record<string, string> = {
          png: "png",
          jpg: "jpg",
          jpeg: "jpg",
          webp: "webp",
          gif: "gif",
          avif: "avif",
          tiff: "tiff",
          tif: "tiff",
        };
        const requested = (options?.outputFormat || "png").toString().toLowerCase();
        outputExtension = allowedFormats[requested] || "png";
      }
      const outputFilename = `${inputName}_converted.${outputExtension}`;
      
      // PERFORM ACTUAL CONVERSION
      const conversionResult = await performActualConversion(
        file.buffer,
        fileName,
        toolType,
        outputFilename,
        options
      );
      
      if (!conversionResult.success) {
        throw new Error(conversionResult.error || 'Conversion failed');
      }
      
      // Store the converted file
      if (conversionResult.convertedBuffer && conversionResult.mimeType) {
        convertedFileStorage.set(jobId, {
          buffer: conversionResult.convertedBuffer,
          mimeType: conversionResult.mimeType,
          filename: outputFilename
        });
      }
      
      const actualProcessingTime = Date.now() - startTime;
      const outputFileSize = conversionResult.convertedBuffer?.length || file.size;

      // Update job status to completed with output filename
      await storage.updateConversionJobStatus(
        jobId,
        "completed",
        outputFilename,
        undefined,
        actualProcessingTime
      );
      
      console.log(`Job ${jobId} completed successfully: ${outputFilename}`);

    } catch (error) {
      console.error(`Error processing job ${jobId}:`, error);
      await storage.updateConversionJobStatus(
        jobId,
        "failed",
        undefined,
        `Processing failed: ${error instanceof Error ? error.message : 'Internal error'}`
      );
    }
  }

  // Get conversion job status
  app.get("/api/jobs/:jobId", async (req, res) => {
    try {
      const jobId = parseInt(req.params.jobId);
      if (isNaN(jobId)) {
        return res.status(400).json({
          success: false,
          error: "Invalid job ID"
        });
      }

      const job = await storage.getConversionJob(jobId);
      if (!job) {
        return res.status(404).json({
          success: false,
          error: "Job not found"
        });
      }

      res.json({
        success: true,
        data: {
          jobId: job.id,
          status: job.status,
          inputFilename: job.inputFilename,
          outputFilename: job.outputFilename,
          processingTime: job.processingTime,
          errorMessage: job.errorMessage,
          createdAt: job.createdAt,
          updatedAt: job.updatedAt,
          downloadUrl: job.status === "completed" && job.outputFilename 
            ? `/api/download/${job.id}` 
            : undefined
        }
      });
    } catch (error) {
      console.error(`Error fetching job:`, error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch job status",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get user's conversion history
  app.get("/api/jobs", async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "Authentication required"
        });
      }

      const jobs: any[] = []; // For now, return empty array - getAllConversionJobs method doesn't exist
      res.json({
        success: true,
        data: jobs,
        total: jobs.length
      });
    } catch (error) {
      console.error("Error fetching user jobs:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch conversion history"
      });
    }
  });

  // Download converted file
  app.get("/api/download/:jobId", async (req, res) => {
    try {
      const jobId = parseInt(req.params.jobId);
      if (isNaN(jobId)) {
        return res.status(400).json({
          success: false,
          error: "Invalid job ID"
        });
      }

      const job = await storage.getConversionJob(jobId);
      if (!job) {
        return res.status(404).json({
          success: false,
          error: "Job not found"
        });
      }

      if (job.status !== "completed" || !job.outputFilename) {
        return res.status(400).json({
          success: false,
          error: "File not ready for download"
        });
      }

      // Get the converted file from storage
      const convertedFile = convertedFileStorage.get(jobId);
      if (!convertedFile) {
        return res.status(404).json({
          success: false,
          error: "Converted file not found"
        });
      }

      const { buffer: convertedBuffer, mimeType, filename: outputFilename } = convertedFile;
      
      // Set headers for proper file download
      const safeFilename = outputFilename || `converted_file_${jobId}.${job.toolType.includes('pdf') ? 'pdf' : 'txt'}`;
      const properMimeType = mimeType || getMimeType(safeFilename);
      
      res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
      res.setHeader('Content-Type', properMimeType);
      res.setHeader('Content-Length', convertedBuffer.length.toString());
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Content-Disposition');
      
      console.log(`Serving download for job ${jobId}: ${safeFilename} (${mimeType || 'unknown'})`);
      
      // Send the actual converted file
      res.send(convertedBuffer);
      
      // Clean up stored files after download
      fileStorage.delete(jobId);
      convertedFileStorage.delete(jobId);

    } catch (error) {
      console.error("Error downloading file:", error);
      res.status(500).json({
        success: false,
        error: "Failed to download file"
      });
    }
  });

  // PDF Generator endpoint - Real-time PDF generation
  app.post("/api/generate-pdf", uploadMultiple.array('files', 10), async (req, res) => {
    let tempFilePaths: string[] = [];
    
    try {
      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          error: "No files uploaded. Please upload images or text files."
        });
      }

      // Validate file count
      if (files.length > 10) {
        return res.status(400).json({
          success: false,
          error: "Too many files. Maximum 10 files allowed."
        });
      }

      console.log(`Generating PDF from ${files.length} files...`);
      
      // Create a new PDF document
      const pdfDoc = await PDFDocument.create();
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      
      let pageCount = 0;
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        console.log(`Processing file ${i + 1}: ${file.originalname} (${file.mimetype})`);
        
        if (file.mimetype.startsWith('image/')) {
          // Process image file
          try {
            // Convert image to JPEG using sharp for consistency
            const processedImageBuffer = await sharp(file.buffer)
              .jpeg({
                quality: 90,
                progressive: false,
                mozjpeg: true
              })
              .resize(1200, 1600, {
                fit: 'inside',
                withoutEnlargement: true
              })
              .toBuffer();
            
            // Embed image in PDF
            const image = await pdfDoc.embedJpg(processedImageBuffer);
            const imageDims = image.scale(1);
            
            // Calculate dimensions to fit page
            const pageWidth = 595.28; // A4 width in points
            const pageHeight = 841.89; // A4 height in points
            const margin = 50;
            
            const availableWidth = pageWidth - (margin * 2);
            const availableHeight = pageHeight - (margin * 2);
            
            const scaleX = availableWidth / imageDims.width;
            const scaleY = availableHeight / imageDims.height;
            const scale = Math.min(scaleX, scaleY, 1); // Don't upscale
            
            const scaledWidth = imageDims.width * scale;
            const scaledHeight = imageDims.height * scale;
            
            // Center the image on the page
            const x = (pageWidth - scaledWidth) / 2;
            const y = (pageHeight - scaledHeight) / 2;
            
            // Add new page
            const page = pdfDoc.addPage([pageWidth, pageHeight]);
            page.drawImage(image, {
              x,
              y,
              width: scaledWidth,
              height: scaledHeight,
            });
            
            pageCount++;
            console.log(`Added image page ${pageCount}: ${file.originalname}`);
            
          } catch (imageError) {
            console.error(`Error processing image ${file.originalname}:`, imageError);
            // Add error page
            const page = pdfDoc.addPage();
            page.drawText(`Error processing image: ${file.originalname}`, {
              x: 50,
              y: 750,
              size: 12,
              font: helveticaFont,
              color: rgb(1, 0, 0),
            });
            pageCount++;
          }
          
        } else if (file.mimetype === 'text/plain') {
          // Process text file
          try {
            const textContent = file.buffer.toString('utf8');
            const lines = textContent.split('\n');
            
            const pageWidth = 595.28;
            const pageHeight = 841.89;
            const margin = 50;
            const lineHeight = 14;
            const maxLinesPerPage = Math.floor((pageHeight - margin * 2) / lineHeight);
            
            // Add title page for text file
            let page = pdfDoc.addPage([pageWidth, pageHeight]);
            let yPosition = pageHeight - margin;
            
            // Add title
            page.drawText(`File: ${file.originalname}`, {
              x: margin,
              y: yPosition,
              size: 16,
              font: helveticaBold,
              color: rgb(0, 0, 0),
            });
            
            yPosition -= 30;
            
            // Add content
            let linesOnCurrentPage = 2; // Account for title
            
            for (const line of lines) {
              if (linesOnCurrentPage >= maxLinesPerPage) {
                // Start new page
                page = pdfDoc.addPage([pageWidth, pageHeight]);
                yPosition = pageHeight - margin;
                linesOnCurrentPage = 0;
              }
              
              // Handle long lines by wrapping
              const maxCharsPerLine = 80;
              if (line.length > maxCharsPerLine) {
                const wrappedLines = [];
                for (let i = 0; i < line.length; i += maxCharsPerLine) {
                  wrappedLines.push(line.substr(i, maxCharsPerLine));
                }
                
                for (const wrappedLine of wrappedLines) {
                  if (linesOnCurrentPage >= maxLinesPerPage) {
                    page = pdfDoc.addPage([pageWidth, pageHeight]);
                    yPosition = pageHeight - margin;
                    linesOnCurrentPage = 0;
                  }
                  
                  page.drawText(wrappedLine, {
                    x: margin,
                    y: yPosition,
                    size: 10,
                    font: helveticaFont,
                    color: rgb(0, 0, 0),
                  });
                  
                  yPosition -= lineHeight;
                  linesOnCurrentPage++;
                }
              } else {
                page.drawText(line, {
                  x: margin,
                  y: yPosition,
                  size: 10,
                  font: helveticaFont,
                  color: rgb(0, 0, 0),
                });
                
                yPosition -= lineHeight;
                linesOnCurrentPage++;
              }
            }
            
            pageCount++;
            console.log(`Added text content from: ${file.originalname}`);
            
          } catch (textError) {
            console.error(`Error processing text file ${file.originalname}:`, textError);
            // Add error page
            const page = pdfDoc.addPage();
            page.drawText(`Error processing text file: ${file.originalname}`, {
              x: 50,
              y: 750,
              size: 12,
              font: helveticaFont,
              color: rgb(1, 0, 0),
            });
            pageCount++;
          }
        }
      }
      
      if (pageCount === 0) {
        return res.status(400).json({
          success: false,
          error: "No valid content could be processed from the uploaded files."
        });
      }
      
      // Generate PDF bytes
      const pdfBytes = await pdfDoc.save();
      
      // Create temporary file
      const tempDir = path.join(process.cwd(), 'temp');
      await fs.mkdir(tempDir, { recursive: true });
      
      const timestamp = Date.now();
      const tempFileName = `generated-pdf-${timestamp}.pdf`;
      const tempFilePath = path.join(tempDir, tempFileName);
      tempFilePaths.push(tempFilePath);
      
      // Write PDF to temp file
      await fs.writeFile(tempFilePath, pdfBytes);
      
      console.log(`PDF generated successfully: ${tempFileName} (${pageCount} pages)`);
      
      // Set response headers for file download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${tempFileName}"`);
      res.setHeader('Content-Length', pdfBytes.length);
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      // Send the PDF file directly
      res.send(Buffer.from(pdfBytes));
      
      // Clean up temp file after response
      setTimeout(async () => {
        try {
          for (const filePath of tempFilePaths) {
            await fs.unlink(filePath);
            console.log(`Cleaned up temp file: ${path.basename(filePath)}`);
          }
        } catch (cleanupError) {
          console.error('Error cleaning up temp files:', cleanupError);
        }
      }, 5000); // Clean up after 5 seconds
      
    } catch (error) {
      console.error('PDF generation error:', error);
      
      // Clean up temp files on error
      try {
        for (const filePath of tempFilePaths) {
          await fs.unlink(filePath);
        }
      } catch (cleanupError) {
        console.error('Error cleaning up temp files after error:', cleanupError);
      }
      
      res.status(500).json({
        success: false,
        error: "Failed to generate PDF",
        details: error instanceof Error ? error.message : "Unknown error occurred"
      });
    }
  });

  // ============== AUTHENTICATION ROUTES ==============
  
  // User registration
  app.post("/api/signup", register);
  
  // User sign in
  app.post("/api/signin", signin);
  
  // Protected route: Get current user (dashboard)
  app.get("/api/dashboard", authenticateUser, getCurrentUser);
  
  // Protected route: Get user profile
  app.get("/api/user", authenticateUser, getCurrentUser);

  // API health check
  // ===========================================================================
  // API PLATFORM: key management, usage analytics, and the public REST API.
  // ===========================================================================

  // --- API key management (dashboard, JWT-authenticated) ---------------------

  // Create a new API key. The raw `sk-...` key is returned exactly ONCE; only a
  // sha256 hash + last 4 chars are persisted.
  app.post("/api/keys", authenticateUser, async (req, res) => {
    try {
      const userId = (req as any).user.id as string;
      const rawName = (req.body?.name ?? "").toString().trim();
      const name = rawName ? rawName.slice(0, 60) : null;

      const existing = await storage.getUserApiKeys(userId);
      if (existing.length >= 10) {
        return res.status(400).json({
          success: false,
          error: "You have reached the maximum of 10 API keys. Revoke one to create another."
        });
      }

      const rawKey = generateApiKey();
      const created = await storage.createApiKey({
        userId,
        apiKey: hashApiKey(rawKey),
        name,
        keyLast4: rawKey.slice(-4),
      });

      return res.status(201).json({
        success: true,
        data: {
          id: created.id,
          name: created.name,
          apiKey: rawKey, // shown once
          maskedKey: `sk-...${created.keyLast4}`,
          createdAt: created.createdAt,
        },
        message: "Copy your API key now — it won't be shown again."
      });
    } catch (error) {
      console.error("Error creating API key:", error);
      return res.status(500).json({ success: false, error: "Failed to create API key" });
    }
  });

  // List the signed-in user's API keys (masked — the raw key is never returned).
  app.get("/api/keys", authenticateUser, async (req, res) => {
    try {
      const userId = (req as any).user.id as string;
      const keys = await storage.getUserApiKeys(userId);
      const data = keys
        .sort((a, b) => new Date(b.createdAt as any).getTime() - new Date(a.createdAt as any).getTime())
        .map((k) => ({
          id: k.id,
          name: k.name,
          maskedKey: k.keyLast4 ? `sk-...${k.keyLast4}` : "sk-••••",
          createdAt: k.createdAt,
          lastUsedAt: k.lastUsedAt,
        }));
      return res.json({ success: true, data });
    } catch (error) {
      console.error("Error listing API keys:", error);
      return res.status(500).json({ success: false, error: "Failed to list API keys" });
    }
  });

  // Revoke (hard-delete) an API key. Ownership is enforced.
  app.delete("/api/keys/:id", authenticateUser, async (req, res) => {
    try {
      const userId = (req as any).user.id as string;
      const key = await storage.getApiKeyById(req.params.id);
      if (!key || key.userId !== userId) {
        return res.status(404).json({ success: false, error: "API key not found" });
      }
      await storage.deleteApiKey(key.id);
      return res.json({ success: true, message: "API key revoked" });
    } catch (error) {
      console.error("Error revoking API key:", error);
      return res.status(500).json({ success: false, error: "Failed to revoke API key" });
    }
  });

  // --- Usage analytics (dashboard, JWT-authenticated) ------------------------

  // Real aggregates computed from the signed-in user's conversion jobs.
  app.get("/api/usage", authenticateUser, async (req, res) => {
    try {
      const userId = (req as any).user.id as string;
      const [jobs, keys, tools] = await Promise.all([
        storage.getUserConversionJobs(userId),
        storage.getUserApiKeys(userId),
        storage.getAllTools(),
      ]);

      const nameByType: Record<string, string> = {};
      for (const t of tools) nameByType[t.type] = t.name;

      const total = jobs.length;
      const completed = jobs.filter((j) => j.status === "completed").length;
      const failed = jobs.filter((j) => j.status === "failed").length;
      const apiCalls = jobs.filter((j) => j.source === "api").length;
      const webCalls = total - apiCalls;
      const successRate = total > 0 ? Math.round((completed / total) * 1000) / 10 : 0;
      const dataProcessed = jobs.reduce((sum, j) => sum + (j.outputFileSize || 0), 0);

      const counts: Record<string, number> = {};
      for (const j of jobs) counts[j.toolType] = (counts[j.toolType] || 0) + 1;
      const mostUsed = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([type, count]) => ({ type, name: nameByType[type] || type, count }));

      const recent = [...jobs]
        .sort((a, b) => new Date(b.createdAt as any).getTime() - new Date(a.createdAt as any).getTime())
        .slice(0, 8)
        .map((j) => ({
          id: j.id,
          toolType: j.toolType,
          toolName: nameByType[j.toolType] || j.toolType,
          inputFilename: j.inputFilename,
          status: j.status,
          source: j.source,
          createdAt: j.createdAt,
        }));

      return res.json({
        success: true,
        data: {
          totals: { total, completed, failed, apiCalls, webCalls, successRate, dataProcessed, activeKeys: keys.length },
          mostUsed,
          recent,
        },
      });
    } catch (error) {
      console.error("Error computing usage:", error);
      return res.status(500).json({ success: false, error: "Failed to compute usage statistics" });
    }
  });

  // --- Public REST API (API-key authenticated) ------------------------------
  //
  // POST /api/v1/:toolType  (multipart/form-data)
  //   - field "file"  : the input file (use multiple "files" fields for merge_pdfs)
  //   - field "options": optional JSON string of conversion options
  //   - also accepts "outputFormat" / "quality" as convenience fields
  //
  // Synchronous: authenticates, converts, and streams the result back directly.
  // Auth runs BEFORE multipart parsing so unauthenticated requests are cheap.
  app.post(
    "/api/v1/:toolType",
    authenticateApiKey,
    // Tool-aware upload guard. We resolve the tool BEFORE parsing so multer can
    // enforce a tight per-request memory bound: non-merge tools accept exactly
    // one file capped at the tool's own maxFileSize; merge_pdfs accepts up to 20.
    // This prevents an authenticated caller from buffering many oversized files.
    async (req, res, next) => {
      try {
        const toolTypeParam = req.params.toolType;
        if (!Object.values(ToolType).includes(toolTypeParam as ToolType)) {
          return res.status(404).json({
            success: false,
            error: `Unknown tool "${toolTypeParam}".`,
            availableTools: Object.values(ToolType),
          });
        }
        const toolType = toolTypeParam as ToolType;
        const tool = await storage.getToolByType(toolType);
        if (!tool) {
          return res.status(404).json({ success: false, error: "Tool not found" });
        }

        const isMerge = toolType === ToolType.MERGE_PDFS;
        const maxFilesAllowed = isMerge ? 20 : 1;
        const uploader = multer({
          storage: multer.memoryStorage(),
          limits: {
            fileSize: tool.maxFileSize * 1024 * 1024, // per-file, the tool's own cap
            files: maxFilesAllowed,
          },
        });

        // Stash resolved values so the handler doesn't re-look them up.
        (req as any).resolvedTool = tool;
        (req as any).resolvedToolType = toolType;

        uploader.any()(req, res, (err: any) => {
          if (err) {
            let msg = err instanceof Error ? err.message : "Upload failed";
            if (err instanceof multer.MulterError) {
              if (err.code === "LIMIT_FILE_SIZE") msg = `File exceeds the ${tool.maxFileSize}MB limit.`;
              else if (err.code === "LIMIT_FILE_COUNT") {
                msg = isMerge ? "Too many files (max 20)." : `${toolType} expects exactly one file (field "file").`;
              }
            }
            return res.status(400).json({ success: false, error: msg });
          }
          next();
        });
      } catch (e) {
        return res.status(500).json({ success: false, error: "Failed to prepare upload" });
      }
    },
    async (req, res) => {
      try {
        const userId = (req as any).user.id as string;
        const toolType = (req as any).resolvedToolType as ToolType;
        const tool = (req as any).resolvedTool;

        const files = (req.files as Express.Multer.File[]) || [];
        if (files.length === 0) {
          return res.status(400).json({
            success: false,
            error: 'No file uploaded. Send the file in a multipart "file" field.',
          });
        }

        // Parse options (JSON string) plus convenience scalar fields.
        let options: Record<string, any> = {};
        if (req.body?.options) {
          try {
            options = typeof req.body.options === "string" ? JSON.parse(req.body.options) : req.body.options;
          } catch {
            return res.status(400).json({ success: false, error: '"options" must be valid JSON.' });
          }
        }
        if (req.body?.outputFormat && options.outputFormat === undefined) options.outputFormat = req.body.outputFormat;
        if (req.body?.quality !== undefined && options.quality === undefined) options.quality = Number(req.body.quality);

        const maxBytes = tool.maxFileSize * 1024 * 1024;
        const startTime = Date.now();

        // --- merge_pdfs: combine >=2 PDFs into one ---------------------------
        if (toolType === ToolType.MERGE_PDFS) {
          if (files.length < 2) {
            return res.status(400).json({ success: false, error: "merge_pdfs requires at least 2 PDF files." });
          }
          const buffers: Buffer[] = [];
          for (const f of files) {
            if (f.size > maxBytes) {
              return res.status(400).json({ success: false, error: `"${f.originalname}" exceeds the ${tool.maxFileSize}MB limit.` });
            }
            const isPdfMagic = f.buffer.subarray(0, 5).toString("latin1").startsWith("%PDF");
            if (!isPdfMagic) {
              return res.status(400).json({ success: false, error: `"${f.originalname}" is not a valid PDF file.` });
            }
            buffers.push(f.buffer);
          }

          const outputFilename = "merged.pdf";
          let result;
          try {
            result = await mergePdfs(buffers, outputFilename);
          } catch (e) {
            result = { success: false, error: e instanceof Error ? e.message : "Merge failed" } as any;
          }

          if (!result.success || !result.convertedBuffer || result.convertedBuffer.length === 0) {
            await storage.createConversionJob({
              userId, toolType, status: "failed", source: "api",
              inputFilename: files.map((f) => f.originalname).join(", ").slice(0, 255),
              inputFileSize: files.reduce((s, f) => s + f.size, 0),
              outputFilename: null, outputFileSize: null,
              processingTime: Date.now() - startTime,
              errorMessage: result.error || "Merge failed",
            });
            return res.status(422).json({ success: false, error: result.error || "Merge failed" });
          }

          await storage.createConversionJob({
            userId, toolType, status: "completed", source: "api",
            inputFilename: files.map((f) => f.originalname).join(", ").slice(0, 255),
            inputFileSize: files.reduce((s, f) => s + f.size, 0),
            outputFilename, outputFileSize: result.convertedBuffer.length,
            processingTime: Date.now() - startTime, errorMessage: null,
          });

          res.setHeader("Content-Disposition", `attachment; filename="${outputFilename}"`);
          res.setHeader("Content-Type", result.mimeType || "application/pdf");
          res.setHeader("Content-Length", String(result.convertedBuffer.length));
          return res.status(200).send(result.convertedBuffer);
        }

        // --- all other tools: exactly one file ------------------------------
        if (files.length !== 1) {
          return res.status(400).json({ success: false, error: `${toolType} expects exactly one file (field "file").` });
        }
        const file = files[0];

        if (file.size > maxBytes) {
          return res.status(400).json({ success: false, error: `File exceeds the ${tool.maxFileSize}MB limit.` });
        }
        const fileExtension = file.originalname.split(".").pop()?.toLowerCase();
        if (!fileExtension || !tool.inputFormats.includes(fileExtension)) {
          return res.status(400).json({ success: false, error: `Unsupported file format. Supported: ${tool.inputFormats.join(", ")}` });
        }

        // Derive the output filename exactly like the in-app flow.
        const inputName = file.originalname.includes(".")
          ? file.originalname.substring(0, file.originalname.lastIndexOf("."))
          : file.originalname;
        let outputExtension = tool.outputFormat === "same" ? fileExtension : tool.outputFormat;
        if (toolType === ToolType.CONVERT_IMAGE_FORMAT) {
          const allowedFormats: Record<string, string> = {
            png: "png", jpg: "jpg", jpeg: "jpg", webp: "webp", gif: "gif", avif: "avif", tiff: "tiff", tif: "tiff",
          };
          const requested = (options?.outputFormat || "png").toString().toLowerCase();
          outputExtension = allowedFormats[requested] || "png";
        }
        const outputFilename = `${inputName}_converted.${outputExtension}`;

        let result;
        try {
          result = await performActualConversion(file.buffer, file.originalname, toolType, outputFilename, options);
        } catch (e) {
          result = { success: false, error: e instanceof Error ? e.message : "Conversion failed" } as any;
        }

        if (!result.success || !result.convertedBuffer) {
          await storage.createConversionJob({
            userId, toolType, status: "failed", source: "api",
            inputFilename: file.originalname, inputFileSize: file.size,
            outputFilename: null, outputFileSize: null,
            processingTime: Date.now() - startTime,
            errorMessage: result.error || "Conversion failed",
          });
          return res.status(422).json({ success: false, error: result.error || "Conversion failed" });
        }

        await storage.createConversionJob({
          userId, toolType, status: "completed", source: "api",
          inputFilename: file.originalname, inputFileSize: file.size,
          outputFilename, outputFileSize: result.convertedBuffer.length,
          processingTime: Date.now() - startTime, errorMessage: null,
        });

        res.setHeader("Content-Disposition", `attachment; filename="${outputFilename}"`);
        res.setHeader("Content-Type", result.mimeType || getMimeType(outputFilename));
        res.setHeader("Content-Length", String(result.convertedBuffer.length));
        return res.status(200).send(result.convertedBuffer);
      } catch (error) {
        console.error("Public API conversion error:", error);
        if (!res.headersSent) {
          return res.status(500).json({
            success: false,
            error: "Conversion failed",
            details: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }
    }
  );

  app.get("/api/health", (req, res) => {
    res.json({
      success: true,
      message: "PDF Conversion API is running",
      timestamp: new Date().toISOString(),
      version: "1.0.0"
    });
  });

  // API documentation endpoint
  app.get("/api/docs", (req, res) => {
    res.json({
      success: true,
      message: "PDF Conversion API Documentation",
      endpoints: {
        "GET /api/tools": "Get all available tools",
        "GET /api/tools/category/:category": "Get tools by category", 
        "GET /api/tools/:toolType": "Get specific tool details",
        "POST /api/convert": "Start file conversion job (in-app, async)",
        "POST /api/generate-pdf": "Generate PDF from images/text (real-time)",
        "GET /api/jobs/:jobId": "Get job status",
        "GET /api/jobs": "Get user's job history",
        "GET /api/download/:jobId": "Download converted file",
        "GET /api/health": "API health check",
        "GET /api/docs": "API documentation"
      },
      publicApi: {
        description: "Public REST API authenticated with an API key (Authorization: Bearer sk-...). Synchronous: returns the converted file bytes directly.",
        "POST /api/v1/:toolType": "Convert a file. multipart/form-data with a 'file' field (use multiple 'files' for merge_pdfs), optional 'options' JSON.",
        availableTools: Object.values(ToolType),
        authentication: "Authorization: Bearer <your-api-key>",
      },
      keyManagement: {
        description: "Manage API keys (requires a logged-in session token, Authorization: Bearer <jwt>).",
        "POST /api/keys": "Create a new API key (raw key returned once)",
        "GET /api/keys": "List your API keys (masked)",
        "DELETE /api/keys/:id": "Revoke an API key",
        "GET /api/usage": "Usage statistics for your account",
      },
      version: "1.0.0"
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}