import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

// PORT/BASE_PATH are injected by the workflow for `dev`/`serve`. They are NOT
// needed to produce a static build, and the production *build* step may run
// without them — so we must never throw at config-load time, or the deploy
// build fails before it starts. Fall back to safe defaults instead.
const isServing =
  process.argv.includes("dev") ||
  process.argv.includes("serve") ||
  process.argv.includes("preview");

const rawPort = process.env.PORT;
const port = rawPort ? Number(rawPort) : 5173;

if (isServing && (Number.isNaN(port) || port <= 0)) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// Default to "/" so the static bundle builds with root-relative asset URLs,
// which is correct for the production domain served at its root.
const basePath = process.env.BASE_PATH || "/";

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, ".."),
            }),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  css: {
    postcss: {
      plugins: [
        (await import("tailwindcss")).default,
        (await import("autoprefixer")).default,
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Split large third-party libraries into their own cacheable chunks.
        // Tool-only libs (pdfjs, pdf-lib, tesseract, recharts) are referenced
        // exclusively from lazy-loaded routes, so these chunks are fetched on
        // demand and stay out of the initial page load.
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          // Only isolate heavy, non-React leaf libraries. These are pulled in
          // exclusively by lazy-loaded routes, so they never load on first
          // paint, and because nothing in the React vendor graph imports them
          // back, they cannot create circular chunks.
          if (id.includes("pdfjs-dist")) return "pdfjs";
          if (id.includes("pdf-lib")) return "pdf-lib";
          if (id.includes("tesseract")) return "tesseract";
          if (id.includes("lottie")) return "lottie";
          if (id.includes("recharts") || id.includes("/d3-")) return "charts";
          // Everything else (react, react-dom, radix, framer-motion, tanstack,
          // wouter, etc.) stays together in one cacheable vendor chunk.
          return "vendor";
        },
      },
    },
  },
  server: {
    port,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: false,
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
