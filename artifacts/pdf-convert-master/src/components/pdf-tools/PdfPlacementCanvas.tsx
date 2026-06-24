import React, { useRef, useEffect } from "react";
import type { RenderedPage } from "@/lib/pdfClient";

export interface Placement {
  x: number; // points, top-left origin
  y: number;
  width: number;
  height: number;
}

interface Props {
  page: RenderedPage;
  imageUrl: string;
  placement: Placement;
  onChange: (p: Placement) => void;
  aspect: number; // height / width — preserved while resizing
  minSize?: number;
}

/**
 * Renders a page raster with a draggable + resizable image overlay. All geometry
 * is kept in PDF points (top-left origin); pointer deltas are converted via the
 * live rendered width so it stays correct at any responsive size.
 */
export function PdfPlacementCanvas({
  page,
  imageUrl,
  placement,
  onChange,
  aspect,
  minSize = 24,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{
    mode: "move" | "resize";
    startX: number;
    startY: number;
    orig: Placement;
    scale: number;
  } | null>(null);

  // Keep the latest props available to the window-bound listeners without
  // re-registering them on every render.
  const latest = useRef({ onChange, aspect, page, minSize });
  latest.current = { onChange, aspect, page, minSize };

  const getScale = () => {
    const el = wrapRef.current;
    if (!el || !el.clientWidth) return 1;
    return el.clientWidth / page.width;
  };

  // Drag is driven by window-level listeners (registered once). This is the
  // robust pattern: moves fire no matter where the pointer travels — even
  // outside the wrapper or across the canvas-embedded iframe — which the
  // previous element-scoped handlers/pointer-capture failed to do.
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const d = drag.current;
      if (!d) return;
      const { onChange, aspect, page, minSize } = latest.current;
      const dx = (e.clientX - d.startX) / d.scale;
      const dy = (e.clientY - d.startY) / d.scale;
      if (d.mode === "move") {
        const nx = Math.max(
          0,
          Math.min(d.orig.x + dx, page.width - d.orig.width),
        );
        const ny = Math.max(
          0,
          Math.min(d.orig.y + dy, page.height - d.orig.height),
        );
        onChange({ ...d.orig, x: nx, y: ny });
      } else {
        let nw = Math.max(minSize, d.orig.width + dx);
        nw = Math.min(nw, page.width - d.orig.x);
        let nh = nw * aspect;
        if (d.orig.y + nh > page.height) {
          nh = page.height - d.orig.y;
          nw = nh / aspect;
        }
        onChange({ ...d.orig, width: nw, height: nh });
      }
    };
    const onUp = () => {
      drag.current = null;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, []);

  const onPointerDown =
    (mode: "move" | "resize") => (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      drag.current = {
        mode,
        startX: e.clientX,
        startY: e.clientY,
        orig: { ...placement },
        scale: getScale(),
      };
    };

  const pct = (v: number, total: number) => `${(v / total) * 100}%`;

  return (
    <div ref={wrapRef} className="relative w-full select-none shadow-lg">
      <img
        src={page.dataUrl}
        className="w-full block"
        draggable={false}
        alt="Page preview"
      />
      <div
        className="absolute border-2 border-blue-500 cursor-move touch-none"
        style={{
          left: pct(placement.x, page.width),
          top: pct(placement.y, page.height),
          width: pct(placement.width, page.width),
          height: pct(placement.height, page.height),
        }}
        onPointerDown={onPointerDown("move")}
        data-testid="placement-box"
      >
        <img
          src={imageUrl}
          className="w-full h-full object-contain pointer-events-none"
          draggable={false}
          alt="Overlay"
        />
        <div
          className="absolute -right-2 -bottom-2 w-4 h-4 bg-blue-600 border-2 border-white rounded-full cursor-se-resize touch-none"
          onPointerDown={onPointerDown("resize")}
          data-testid="resize-handle"
        />
      </div>
    </div>
  );
}
