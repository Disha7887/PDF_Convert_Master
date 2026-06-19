import React, { useCallback, useEffect, useRef, useState } from "react";
import * as pdfjs from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Upload,
  Type,
  Image as ImageIcon,
  Download,
  Trash2,
  Loader2,
} from "lucide-react";

// PDF.js needs a worker. With Vite we resolve its URL at build time.
pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

/**
 * An edit element overlaid on a page. Coordinates are stored in PDF user-space
 * units (points), origin top-left, so they stay correct regardless of the zoom
 * we render the page at on screen. We flip the Y axis only when exporting,
 * because pdf-lib's origin is bottom-left.
 */
interface BaseElement {
  id: string;
  pageIndex: number;
  x: number; // points from left
  y: number; // points from top
}

interface TextElement extends BaseElement {
  type: "text";
  text: string;
  fontSize: number; // points
  color: string; // hex
}

interface ImageElement extends BaseElement {
  type: "image";
  dataUrl: string;
  width: number; // points
  height: number; // points
  bytes: Uint8Array;
  format: "png" | "jpg";
}

type EditElement = TextElement | ImageElement;

interface RenderedPage {
  pageIndex: number;
  width: number; // points (PDF user space)
  height: number; // points
  dataUrl: string; // rasterised preview
}

const RENDER_SCALE = 1.5; // crispness of the on-screen raster
const hexToRgb = (hex: string) => {
  const v = hex.replace("#", "");
  return {
    r: parseInt(v.slice(0, 2), 16) / 255,
    g: parseInt(v.slice(2, 4), 16) / 255,
    b: parseInt(v.slice(4, 6), 16) / 255,
  };
};

const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2);

export const PdfEditor: React.FC = () => {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [srcBytes, setSrcBytes] = useState<Uint8Array | null>(null);
  const [pages, setPages] = useState<RenderedPage[]>([]);
  const [elements, setElements] = useState<EditElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  // Tracks an in-progress drag: which element and the pointer offset within it.
  const dragRef = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null);

  // --- Load & rasterise the PDF for preview ---------------------------------
  const loadPdf = useCallback(
    async (f: File) => {
      setLoading(true);
      try {
        const buf = new Uint8Array(await f.arrayBuffer());
        // pdf.js transfers/detaches the buffer, so hand it a copy and keep our own.
        setSrcBytes(buf.slice());
        const doc = await pdfjs.getDocument({ data: buf.slice() }).promise;
        const rendered: RenderedPage[] = [];
        for (let i = 1; i <= doc.numPages; i++) {
          const page = await doc.getPage(i);
          const viewport = page.getViewport({ scale: RENDER_SCALE });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext("2d")!;
          await page.render({ canvasContext: ctx, viewport }).promise;
          const base = page.getViewport({ scale: 1 });
          rendered.push({
            pageIndex: i - 1,
            width: base.width,
            height: base.height,
            dataUrl: canvas.toDataURL("image/png"),
          });
        }
        setPages(rendered);
        setElements([]);
        setSelectedId(null);
        setFile(f);
      } catch (err) {
        console.error(err);
        toast({
          title: "Could not open PDF",
          description: "The file may be corrupt or password-protected.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    },
    [toast],
  );

  const onFilePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) loadPdf(f);
  };

  // --- Add elements ----------------------------------------------------------
  const addText = (pageIndex: number) => {
    const el: TextElement = {
      id: genId(),
      type: "text",
      pageIndex,
      x: 72,
      y: 72,
      text: "New text",
      fontSize: 16,
      color: "#111111",
    };
    setElements((prev) => [...prev, el]);
    setSelectedId(el.id);
  };

  const onImagePicked = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f || pages.length === 0) return;
    const isPng = f.type === "image/png";
    const bytes = new Uint8Array(await f.arrayBuffer());
    const dataUrl = await new Promise<string>((res) => {
      const r = new FileReader();
      r.onload = () => res(r.result as string);
      r.readAsDataURL(f);
    });
    // Constrain initial size to a sensible width, keeping aspect ratio.
    const dims = await new Promise<{ w: number; h: number }>((res) => {
      const img = new window.Image();
      img.onload = () => res({ w: img.width, h: img.height });
      img.src = dataUrl;
    });
    const maxW = 200;
    const scale = Math.min(1, maxW / dims.w);
    const el: ImageElement = {
      id: genId(),
      type: "image",
      pageIndex: 0,
      x: 72,
      y: 72,
      width: dims.w * scale,
      height: dims.h * scale,
      dataUrl,
      bytes,
      format: isPng ? "png" : "jpg",
    };
    setElements((prev) => [...prev, el]);
    setSelectedId(el.id);
    e.target.value = "";
  };

  const updateElement = (id: string, patch: Partial<EditElement>) =>
    setElements((prev) =>
      prev.map((el) => (el.id === id ? ({ ...el, ...patch } as EditElement) : el)),
    );

  const deleteSelected = () => {
    if (!selectedId) return;
    setElements((prev) => prev.filter((el) => el.id !== selectedId));
    setSelectedId(null);
  };

  // --- Dragging (in screen px, converted back to points) --------------------
  const onPointerDown = (e: React.PointerEvent, el: EditElement) => {
    e.stopPropagation();
    setSelectedId(el.id);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    dragRef.current = {
      id: el.id,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent, page: RenderedPage) => {
    const drag = dragRef.current;
    if (!drag) return;
    const pageRect = (
      e.currentTarget as HTMLElement
    ).getBoundingClientRect();
    const pxToPt = page.width / pageRect.width; // screen px -> PDF points
    const xPx = e.clientX - pageRect.left - drag.offsetX;
    const yPx = e.clientY - pageRect.top - drag.offsetY;
    updateElement(drag.id, {
      x: Math.max(0, xPx * pxToPt),
      y: Math.max(0, yPx * pxToPt),
    });
  };

  const onPointerUp = () => {
    dragRef.current = null;
  };

  // --- Export with pdf-lib ---------------------------------------------------
  const exportPdf = async () => {
    if (!srcBytes) return;
    setExporting(true);
    try {
      const pdfDoc = await PDFDocument.load(srcBytes);
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const docPages = pdfDoc.getPages();

      for (const el of elements) {
        const page = docPages[el.pageIndex];
        if (!page) continue;
        const pageHeight = page.getHeight();

        if (el.type === "text") {
          const { r, g, b } = hexToRgb(el.color);
          // pdf-lib baseline sits at the bottom of the text; nudge down by the
          // font size so screen-top maps to roughly the same spot.
          page.drawText(el.text, {
            x: el.x,
            y: pageHeight - el.y - el.fontSize,
            size: el.fontSize,
            font,
            color: rgb(r, g, b),
          });
        } else {
          const img =
            el.format === "png"
              ? await pdfDoc.embedPng(el.bytes)
              : await pdfDoc.embedJpg(el.bytes);
          page.drawImage(img, {
            x: el.x,
            y: pageHeight - el.y - el.height,
            width: el.width,
            height: el.height,
          });
        }
      }

      const out = await pdfDoc.save();
      const blob = new Blob([out], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = (file?.name?.replace(/\.pdf$/i, "") ?? "document") + "-edited.pdf";
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Saved", description: "Your edited PDF was downloaded." });
    } catch (err) {
      console.error(err);
      toast({
        title: "Export failed",
        description: "Something went wrong while writing the PDF.",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        const el = elements.find((x) => x.id === selectedId);
        // Don't hijack Backspace while editing text content.
        if (el?.type === "text") return;
        deleteSelected();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedId, elements]);

  const selected = elements.find((el) => el.id === selectedId);

  // --- Empty state -----------------------------------------------------------
  if (pages.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4">
        <div
          className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-12 text-center bg-white dark:bg-gray-800"
          onClick={() => fileInputRef.current?.click()}
          role="button"
        >
          {loading ? (
            <Loader2 className="w-10 h-10 mx-auto mb-4 animate-spin text-blue-600" />
          ) : (
            <Upload className="w-10 h-10 mx-auto mb-4 text-blue-600" />
          )}
          <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
            {loading ? "Opening PDF…" : "Drop a PDF here or click to upload"}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Everything is processed in your browser — nothing is uploaded.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={onFilePicked}
          />
        </div>
      </div>
    );
  }

  // --- Editor ----------------------------------------------------------------
  return (
    <div className="max-w-5xl mx-auto px-4">
      {/* Toolbar */}
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 mb-4 shadow-sm">
        <Button variant="outline" size="sm" onClick={() => addText(0)}>
          <Type className="w-4 h-4 mr-1" /> Add text
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => imageInputRef.current?.click()}
        >
          <ImageIcon className="w-4 h-4 mr-1" /> Add image
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={deleteSelected}
          disabled={!selectedId}
        >
          <Trash2 className="w-4 h-4 mr-1" /> Delete
        </Button>
        <div className="flex-1" />
        <Button size="sm" onClick={exportPdf} disabled={exporting}>
          {exporting ? (
            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
          ) : (
            <Download className="w-4 h-4 mr-1" />
          )}
          Save PDF
        </Button>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/png,image/jpeg"
          className="hidden"
          onChange={onImagePicked}
        />
      </div>

      {/* Selected-element inspector */}
      {selected && selected.type === "text" && (
        <div className="flex flex-wrap items-center gap-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 mb-4">
          <input
            className="flex-1 min-w-[180px] px-2 py-1 rounded border bg-white dark:bg-gray-900"
            value={selected.text}
            onChange={(e) => updateElement(selected.id, { text: e.target.value })}
          />
          <label className="text-sm flex items-center gap-1">
            Size
            <input
              type="number"
              min={6}
              max={96}
              className="w-16 px-2 py-1 rounded border bg-white dark:bg-gray-900"
              value={selected.fontSize}
              onChange={(e) =>
                updateElement(selected.id, { fontSize: Number(e.target.value) })
              }
            />
          </label>
          <input
            type="color"
            value={selected.color}
            onChange={(e) => updateElement(selected.id, { color: e.target.value })}
          />
        </div>
      )}

      {/* Pages */}
      <div className="space-y-6 pb-12" onPointerUp={onPointerUp}>
        {pages.map((page) => {
          const pageElements = elements.filter((el) => el.pageIndex === page.pageIndex);
          return (
            <div key={page.pageIndex} className="flex flex-col items-center">
              <div
                className="relative shadow-lg select-none"
                style={{
                  width: "100%",
                  maxWidth: page.width * RENDER_SCALE,
                  containerType: "inline-size",
                }}
                onPointerMove={(e) => onPointerMove(e, page)}
                onPointerDown={() => setSelectedId(null)}
              >
                <img
                  src={page.dataUrl}
                  alt={`Page ${page.pageIndex + 1}`}
                  className="w-full block pointer-events-none"
                  draggable={false}
                />
                {pageElements.map((el) => {
                  // points -> percentage of page, so overlays scale with the img
                  const leftPct = (el.x / page.width) * 100;
                  const topPct = (el.y / page.height) * 100;
                  const isSel = el.id === selectedId;
                  return (
                    <div
                      key={el.id}
                      onPointerDown={(e) => onPointerDown(e, el)}
                      className={`absolute cursor-move ${
                        isSel ? "outline outline-2 outline-blue-500" : ""
                      }`}
                      style={{ left: `${leftPct}%`, top: `${topPct}%` }}
                    >
                      {el.type === "text" ? (
                        <span
                          style={{
                            // font size in points -> on-screen px at current width
                            fontSize: `${(el.fontSize / page.width) * 100}cqw`,
                            color: el.color,
                            whiteSpace: "pre",
                            fontFamily: "Helvetica, Arial, sans-serif",
                            lineHeight: 1,
                          }}
                        >
                          {el.text}
                        </span>
                      ) : (
                        <img
                          src={el.dataUrl}
                          alt=""
                          draggable={false}
                          style={{
                            width: `${(el.width / page.width) * 100}cqw`,
                            height: "auto",
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
              <span className="text-xs text-gray-400 mt-1">
                Page {page.pageIndex + 1} of {pages.length}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
