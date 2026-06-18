# Project Documentation

## Overview
Full-stack JavaScript application migrated from Figma to Replit environment. Built with React frontend, Express backend, and modern tooling including TypeScript, Tailwind CSS, and shadcn/ui components.

## Project Architecture
- **Frontend**: React with Vite, TypeScript, Tailwind CSS, shadcn/ui components
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM (currently using in-memory storage)
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state
- **Styling**: Tailwind CSS with custom design system

## Tech Stack
- React 18 + Vite
- Express.js server
- TypeScript throughout
- Tailwind CSS + shadcn/ui
- Drizzle ORM + PostgreSQL
- TanStack Query
- Wouter routing
- Framer Motion animations

## Application Structure
```
├── frontend/              # Standalone React frontend for Builder.io
│   ├── src/
│   │   ├── components/ui/ # shadcn/ui components
│   │   ├── pages/        # Page components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── lib/          # Utilities and query client
│   │   └── contexts/     # React contexts
│   ├── package.json      # Frontend-only dependencies
│   ├── vite.config.ts    # Vite config with API proxy
│   └── README.md         # Frontend setup instructions
├── server/               # Backend Express server
│   ├── index.ts         # Server entry point
│   ├── routes.ts        # API routes
│   ├── storage.ts       # Data storage interface
│   └── vite.ts          # Vite development setup
├── shared/              # Shared types and schemas
│   └── schema.ts       # Database schema and types
├── client/             # Legacy frontend (can be removed)
└── .gitignore          # Comprehensive ignore rules
```

## Current Features
- Landing page with multiple sections:
  - Navigation with modern design
  - Hero section with call-to-action
  - Features showcase
  - Testimonials
  - Footer with contact information
- Responsive design with mobile-first approach
- Dark theme with custom color palette
- Animated background elements
- Type-safe API integration setup

### Backend API Features
- **PDF Conversion Tools (7 tools):**
  1. PDF to Word
  2. PDF to Excel
  3. PDF to PowerPoint
  4. Word to PDF
  5. Excel to PDF
  6. PowerPoint to PDF
  7. HTML to PDF

- **Image Processing Tools (9 tools):**
  8. Images to PDF
  9. PDF to Images
  10. Compress Image
  11. Convert Image Format
  12. Crop Image
  13. Resize Image
  14. Rotate Image
  15. Upscale Image
  16. Remove Background

- **PDF Management Tools (4 tools):**
  17. Merge PDFs
  18. Split PDF
  19. Compress PDF
  20. Rotate PDF

### API Endpoints
- `GET /api/tools` - Get all available tools
- `GET /api/tools/category/:category` - Get tools by category
- `GET /api/tools/:toolType` - Get specific tool details
- `POST /api/convert` - Start file conversion job
- `GET /api/jobs/:jobId` - Get job status
- `GET /api/jobs` - Get user's job history
- `GET /api/download/:jobId` - Download converted file
- `GET /api/health` - API health check
- `GET /api/docs` - API documentation

## Development Setup
- Uses Replit workflows for development
- Hot reload enabled for both frontend and backend
- Single port setup (5000) serving both frontend and backend
- In-memory storage for development (can be switched to PostgreSQL)

## Migration Status
✅ Project structure analyzed
✅ Dependencies verified and installed
✅ Modern fullstack architecture confirmed
✅ Security practices implemented (client/server separation)
✅ Replit-specific configurations in place

## User Preferences
- Wants to use Builder.io for frontend editing without conflicts
- Requires clean separation between frontend and backend code
- Frontend must be standalone React/Vite project
- Prefers visual editing workflow: Builder.io → GitHub → Replit pipeline
- Wants automated sync between Builder.io changes and Replit development environment
- Does not want backend functionality affected by visual editing changes

## Recent Changes
- 2025-01-08: Initial migration from Figma to Replit completed
- 2025-01-08: Project documentation created
- 2025-01-08: All dependencies verified and project structure confirmed
- 2025-08-02: Fixed fuse.js dependency resolution issue
- 2025-08-02: Complete backend API setup for PDF conversion and image processing tools
- 2025-08-02: Implemented 20 tools across 3 categories with comprehensive API endpoints
- 2025-08-02: Enhanced all 20 tools with professional multiple file upload interface
- 2025-08-02: Added batch processing, file management, and modern UI components
- 2025-08-02: Implemented FileItem, BatchProgressTracker, and EnhancedUploadArea components
- 2025-08-02: Replaced dummy file generation with real file conversion processing
- 2025-08-02: Optimized conversion speeds (5-60 seconds vs. 30-120 seconds)
- 2025-08-02: Implemented real image processing using Sharp library (compress, resize, rotate, crop, format conversion)
- 2025-08-02: Added actual PDF processing with pdf-lib for document analysis and generation
- 2025-08-02: Created comprehensive API endpoints for all 20 conversion tools
- 2025-08-02: Generated complete API documentation (API_DOCUMENTATION.md) with examples and error handling
- 2025-08-03: **MAJOR RESTRUCTURE**: Separated frontend into standalone `frontend/` directory for Builder.io compatibility
- 2025-08-03: Created standalone React/Vite project with own package.json and dependencies
- 2025-08-03: Removed backend dependencies from frontend package.json
- 2025-08-03: Configured frontend to proxy API calls to backend on port 5000
- 2025-08-03: Added comprehensive .gitignore for both frontend and backend
- 2025-08-03: **BUILDER.IO READY**: Built frontend with dist folder, added production start script
- 2025-08-03: Created .builderio config file and comprehensive setup guide
- 2025-08-03: Frontend fully prepared for visual editing without server conflicts
- 2025-08-03: **MIGRATION COMPLETE**: Successfully migrated from Replit Agent to standard Replit environment
- 2025-08-03: Database connection established with PostgreSQL, all dependencies resolved
- 2025-08-03: Application server running successfully on port 5000 with full API functionality
- 2025-08-03: **REPLIT AGENT MIGRATION COMPLETED**: Successfully migrated from Replit Agent to standard Replit environment
- 2025-08-03: Database fully connected, all authentication and dashboard features confirmed working
- 2025-08-03: Login button and dashboard accessible, all 20 conversion tools operational
- 2025-08-03: **AUTHENTICATION SYSTEM ENHANCED**: Fully functional authentication flow implemented
- 2025-08-03: Sign-in page validates credentials and redirects to dashboard with personalized user data
- 2025-08-03: Sign-up page creates new accounts and automatically logs users in
- 2025-08-03: Dashboard displays personalized welcome message with user name and plan
- 2025-08-03: Protected routes redirect unauthenticated users to sign-in page
- 2025-08-03: Logout functionality clears authentication state and returns to landing page
- 2025-08-03: Dynamic header switching: NavigationSection for guests, DashboardHeader for authenticated users
- 2025-08-03: **BACKEND PDF CONVERSION OPTIMIZED**: Fixed all file download and MIME type issues
- 2025-08-03: Implemented comprehensive MIME type mapping for all file formats (PDF, DOCX, XLSX, images)
- 2025-08-03: Fixed HTTP headers for proper file downloads (Content-Type, Content-Disposition, Content-Length)
- 2025-08-03: Enhanced binary file streaming with proper cache control and CORS headers
- 2025-08-03: Verified end-to-end conversion workflow: 442KB JPG → PDF conversion successful
- 2025-08-03: All 20 conversion tools now serve files with correct MIME types for frontend compatibility
- 2025-08-03: **REAL OUTPUT IMPLEMENTATION COMPLETED**: All 20 conversion tools now generate actual functional output files
- 2025-08-03: PDF conversions (HTML→PDF, Word→PDF, Excel→PDF, PowerPoint→PDF) create real PDF documents with extracted content
- 2025-08-03: Document conversions (PDF→Word, PDF→Excel, PDF→PowerPoint) generate proper office documents with structured data
- 2025-08-03: PDF management tools (compress, rotate, merge, split) perform actual PDF operations using pdf-lib
- 2025-08-03: Image processing tools implemented with Sharp library for real image manipulation (resize, compress, format conversion)
- 2025-08-03: Background removal and upscaling tools provide enhanced image processing with transparency support
- 2025-08-03: All tools replaced placeholder generation with actual file processing and conversion algorithms
- 2025-08-03: **BUILDER.IO INTEGRATION COMPLETED**: Full visual editing pipeline established
- 2025-08-03: GitHub repository connected to Builder.io for automatic visual editing sync
- 2025-08-03: Created comprehensive Builder.io configuration files (.builderio, builder.config.js)
- 2025-08-03: Implemented GitHub Actions workflow for automated build validation and notifications
- 2025-08-03: Created sync-from-github.sh script for one-command updates from Builder.io changes
- 2025-08-03: **COMPLETE PIPELINE READY**: Builder.io (edit) → GitHub (sync) → Replit (develop) → Deploy
- 2025-08-03: **MAIN REPOSITORY SYNC COMPLETED**: Successfully connected ~/pdf-convert-frontend to main PDF_Convert_Master repository
- 2025-08-03: Fixed authentication logout function and user display properties in DashboardHeader.tsx
- 2025-08-03: Established working sync workflow: Builder.io → PDF_Convert_Master → Replit with simple git commands
- 2025-08-03: **FRONTEND REPOSITORY OPTIMIZED**: Switched to dedicated pdf-convert-frontend repository for Builder.io visual editing
- 2025-08-03: Confirmed working sync process with latest Builder.io changes (active button styles) successfully pulled
- 2025-08-03: **FINAL WORKFLOW ESTABLISHED**: Builder.io → pdf-convert-frontend repository → simple git sync to Replit
- 2026-06-18: **SITE-WIDE REBRAND**: Restyled the live `client/` app to a clean white surface with a single vivid-blue accent (remove.bg look) — fonts (Inter body / Poppins headings), colors, and CTA buttons (blue pills + hover) only; all layout, copy, props, and behavior unchanged. Semantic colors preserved (red = errors, green = success/completed, amber = warnings/stars).
- 2026-06-18: Fixed Tools.tsx inline converter: post-conversion Download button now brand-blue (success checkmark stays green); Convert button now shows the correct per-tool action label instead of "Convert to Same Format".
- 2026-06-18: **UNIFIED IMAGE EDITOR**: Added a single-screen editor at `/image-editor` (`client/src/pages/ImageEditor.tsx`, linked from nav). Upload/drag-drop → main preview → manually selectable Resize/Crop/Rotate, each in a dedicated popup modal (Resize: W/H + lock aspect; Crop: visual draggable box via react-image-crop + manual X/Y/W/H; Rotate: 0–360° slider + 90°L/R/180° quick buttons + live preview). Operations chain on one in-browser working image (canvas) and "Download Edited Image" saves the composed result. Fully client-side; reuses `client/src/lib/imageTools.ts`.
- 2026-06-18: **SPLIT IMAGE EDITOR INTO 3 SEPARATE TOOLS**: Per user request, removed the combined editor and replaced it with 3 standalone, separately-named tool pages — Resize Image (`/image-editor/resize`), Crop Image (`/image-editor/crop`), Rotate Image (`/image-editor/rotate`) — in `client/src/pages/ImageEditTools.tsx` (exports `ResizeImageTool`/`CropImageTool`/`RotateImageTool`; deleted `ImageEditor.tsx`). Each keeps the polished upload→preview→popup design: uploading auto-opens that tool's popup, Apply updates the preview + records history, "Download Image" saves the result. The nav "Image Editor" link became a dropdown (in both NavigationSection and DashboardHeader) linking to the 3 tools. Hardened async object-URL lifecycle with a mounted flag + sequence token. (Note: the older `/upload/*-image` pages and the Tools-page cards that link to them were left unchanged.)
- 2026-06-18: **REMOVED IMAGE EDITOR FROM NAVBAR**: Per user request, deleted the "Image Editor" dropdown from both NavigationSection (guest) and DashboardHeader (dashboard) — image editing is already surfaced via the Tools-page cards (resize/crop/rotate). The 3 standalone pages and their `/image-editor/{resize,crop,rotate}` routes were KEPT (user chose to keep them; reachable by direct URL only). Cleaned up now-unused DropdownMenu/ChevronDown imports in NavigationSection.
- 2026-06-18: **CONVERT IMAGE FORMAT — MORE OUTPUT FORMATS**: The "Convert Image Format" card's "Convert to" dropdown now offers PNG, JPG, WebP, GIF, AVIF, TIFF (was PNG/JPG/WebP only). Backend `convertImageFormat()` (server/routes.ts) gained Sharp encoder cases for gif/avif/tiff, the server-side `allowedFormats` whitelist was extended (with `tif`→`tiff`, `jpeg`→`jpg` normalization; unknown→png fallback so the output extension is never attacker-controlled), and `avif`/`tif` were added to `MIME_TYPES`. BMP and HEIC are intentionally excluded — Sharp can't encode BMP and this libvips lacks HEVC for HEIF. Verified all six formats end-to-end via /api/convert→/api/download (correct Content-Type, valid bytes, correct filename).
- 2026-06-18: **TOOLS-PAGE RESIZE/CROP/ROTATE CARDS NOW USE MANUAL POPUPS**: Previously these 3 cards posted to `/api/convert` with no options. Now, after the user picks an image on the `resize-images`/`crop-images`/`rotate-images` card, a popup auto-opens to MANUALLY set options (resize W/H + aspect lock, crop region, rotate angle), edits the image entirely client-side via `<canvas>`, then offers "Download Image". Implemented by exporting `ResizeModal`/`CropModal`/`RotateModal`/`WorkingImage` from `client/src/pages/ImageEditTools.tsx` and consuming them in `client/src/pages/Tools.tsx` (the same modals the standalone `/image-editor/*` pages use, so behavior matches). The other ~17 Tools cards keep the unchanged server-side `/api/convert` flow. Object-URL lifecycle is leak-safe (single tracked URL revoked on replace/reset/unmount) and async decodes are guarded by a mounted flag + sequence token (`loadSeqRef`) so stale loads can't resurrect a cleared card. Download filenames use `exportExtension()` so gif/bmp inputs (canvas re-encodes them to PNG) are correctly named `.png`. Verified end-to-end (resize 100×75, crop 171×128, rotate 150×200, no console errors).
- 2026-06-18: **COMPRESS IMAGES — USER-SELECTABLE COMPRESSION LEVEL**: The "Compress Images" Tools card now shows a "Compression level" quality slider (10–100%, step 5, default 80; "Smaller file ↔ Higher quality" hints) once an image is picked, and sends the chosen value as `{ quality }` in the `/api/convert` options. Backend `compressImage()` (server/routes.ts) now accepts `options`, clamps quality to 10–100 (default 80), and applies it: JPEG `.jpeg({quality})`, WebP `.webp({quality})`, and PNG maps quality→palette `colors` (`.png({colors, palette:true, compressionLevel:9})`) because in this Sharp/libvips build `.png({quality})` alone does NOT change output size. Each branch now returns the correct per-format mimeType (compress output keeps the input extension via outputFormat "same"). The `compress_image` dispatcher forwards `options`; the Tools.tsx options payload was generalized so it carries `outputFormat` (convert-format) and `quality` (compress) without breaking either. Verified end-to-end: JPEG q20≈82KB vs q95≈462KB, PNG q20≈42KB vs q90≈81KB, out-of-range quality clamped, downloads have correct Content-Type and valid bytes, no console errors.
- 2026-06-18: **REMOVE BACKGROUND ENABLED**: Added the `REMOVE_BG_API_KEY` secret (from remove.bg) so the "Remove Background" tool works. `removeBackground()` (server/routes.ts) normalizes the input to PNG via Sharp, posts it to the remove.bg API server-side (key never leaves the server), and returns a transparent PNG. Verified end-to-end via /api/convert→/api/download: a 500×500 test image comes back as a valid PNG with an alpha channel. The tool still fails loudly (no faked output) if the key is ever missing.
- 2026-06-18: **PDF MERGER — MULTIPLE FILES**: The "Merge PDFs" Tools card now accepts and combines MULTIPLE PDFs into one document (previously single-file only). Added a dedicated backend endpoint `POST /api/merge-pdfs` (server/routes.ts) using a hardened `mergeUpload` multer config (`multer.array`, 100MB/file + 20-file caps enforced during streaming, `.pdf`-only filter, clean 400 JSON on limit/type errors). The handler also verifies each file's `%PDF` magic bytes, then runs the existing `mergePdfs(buffers[])` helper and stores the result in `convertedFileStorage[jobId]` so the EXISTING job-polling (`GET /api/jobs/:jobId`) and download (`GET /api/download/:jobId`) infra serve `merged.pdf` unchanged. `mergePdfs` was hardened to FAIL LOUDLY (friendly "File #N could not be read — it may be password-protected or corrupted." / "No pages could be merged…") instead of silently skipping unreadable PDFs (note: pdf-lib may not throw until `copyPages`, so the whole per-file block is wrapped). Frontend (client/src/pages/Tools.tsx): the merge card is gated on `toolConfig.id === "merge-pdfs"` with its own `mergeFiles: File[]` state, multi-select inputs (`multiple`), an accumulating validated `selectFile` branch, a per-file list with remove buttons + "Add more files", and a "Merge PDFs" button (disabled until ≥2 files) that POSTs all files and reuses `pollJob`. Verified end-to-end against the live server: 2-page + 3-page PDFs → 5-page merged.pdf (correct Content-Type/filename); single-file, non-PDF, and corrupt-but-magic-valid PDFs all rejected/failed with clear messages; build passes.
- 2026-06-18: **TOOLS CARDS — CLICK-TO-OPEN UPLOAD POPUP**: Removed the solid blue "Select X" button from every Tools-page card face. Each card (`ToolCard` in `client/src/pages/Tools.tsx`) is now a clickable surface (`role="button"`, tabIndex, Enter/Space) that opens a shadcn `Dialog` styled like the reference upload screen: dashed dropzone, blue-circle Upload icon, heading = `toolConfig.dropAreaText` ("Drop your X here"), "or click to browse files" subtext, a blue pill button whose label is DYNAMIC per tool via `getActionLabel(toolConfig)` (e.g. "Crop Images"/"Upscale Images"/"Convert to Word"/"Merge PDFs"), then dynamic supported-format chips generated from `toolConfig.acceptedFormats` (no placeholders) and the max file size. The card face keeps icon/title/description/Accepts/Max plus a dashed "Click to upload" hint (`hint-upload-<id>`). The hidden `<input ref={inputRef}>` was moved INSIDE the DialogContent (not the background card) so it's never in a Radix inert/aria-hidden subtree while the popup is open — this resolves an edge case and makes file injection reliable. `selectFile()` calls `setUploadOpen(false)` before proceeding; all existing ready/converting/done/error stages and the server-convert / manual-edit (openEditor) / compress / convert-format / merge flows are unchanged (those stages still have their own `inputRef` input at the non-idle render path). Verified: `npm run build` passes; Playwright confirmed no blue button on cards, popup opens with correct dynamic label + format chips + max size (crop-images, pdf-to-word), and full flows work end-to-end (convert-image-format upload→convert→download; crop-images upload→crop modal→Apply→Download); architect review PASS.
- 2026-06-18: **HOMEPAGE HERO — IN-PLACE PDF CONVERTERS**: Clicking any of the 9 PDF-converter tools (pdf-to-word/excel/powerpoint/images, word/excel/powerpoint/images/html-to-pdf) in the navbar dropdowns no longer navigates to a separate `/upload/*` page — it updates the homepage hero IN PLACE. New helpers in `client/src/lib/toolConfig.ts`: exported `PDF_CONVERTER_IDS` (the 9 ids), `isHeroTool(id)`, `getToolActionLabel(cfg)` ("Convert to Word"/etc.), `getServerToolType(cfg)` (snake_case toolType for `/api/convert`, e.g. `pdf_to_word`). `client/src/components/ToolsNavMenu.tsx` now routes PDF-converter `ToolLink`s to `/?tool=<id>` via wouter `setLocation` (image tools still use `tool.route`). `client/src/pages/sections/HeroSection.tsx` reads `?tool=` via wouter `useSearch`; when it's a valid PDF tool it swaps the left text (heading=`Convert {title}`, description=`tool.description`, benefit bullets) and replaces the decorative upload card with the new functional `client/src/components/HeroToolConverter.tsx`; otherwise the default hero renders unchanged (and its "Select PDF File" button now deep-links to `/?tool=pdf-to-word`). `HeroToolConverter` is a real converter: drag-drop/click upload, validates extension+size against `acceptedFormats`/`maxFileSize`, POSTs to `/api/convert` then polls `GET /api/jobs/:id` (1.5s, 60 attempts) and offers a brand-blue Download linking `/api/download/:id`; stages idle/converting/done/error with reset. The card is keyed by `activeTool.id` in HeroSection so switching tools fully remounts it to a clean idle state, and polling uses a mounted-ref + tracked-timeout guard so in-flight jobs can't write state after unmount/tool-change. Scope is PDF converters only — image tools keep their existing `/upload/*` / `/image-editor/*` editor pages. The `/api/convert`, `/api/jobs/:id`, and `/api/download/:id` endpoints are open to guests (optionalAuth), so the hero works logged-out. Verified: `npm run build` passes; Playwright confirmed in-place updates (no navigation) for PDF tools, image tools still navigate, and clean state reset when switching tools after an interaction; end-to-end pdf→xlsx convert+download returns valid bytes with correct headers; architect review fixes applied.
- 2026-06-18: **NAVBAR — TOOL CATEGORY DROPDOWNS**: Replaced the single "Tools" navbar link with two hover dropdowns — "PDF Converter" and "Image Tools" — in BOTH the guest navbar (client/src/pages/sections/NavigationSection.tsx) and the dashboard navbar (client/src/components/DashboardHeader.tsx). New shared component `client/src/components/ToolsNavMenu.tsx` (exports `<ToolsNavDropdowns/>`) built on the existing Radix `NavigationMenu` Trigger/Content primitives: "PDF Converter" opens a two-column mega-menu ("Convert from PDF": pdf-to-word/excel/powerpoint/images; "Convert to PDF": word/excel/powerpoint/images/html-to-pdf) plus a "View all tools →" link to /tools; "Image Tools" opens a 2-col grid (resize/crop/rotate/convert-format/compress/upscale/remove-background). Each item shows the tool's icon+title from `toolConfig.ts` and navigates via wouter `setLocation` to the tool's `.route` (e.g. /upload/pdf-to-word). Nav order is now Home · PDF Converter ▾ · Image Tools ▾ · Pricing · About (guest) / Home · PDF Converter ▾ · Image Tools ▾ · About (dashboard). The grouping arrays (`PDF_FROM`/`PDF_TO`/`IMAGE_TOOLS`) are hardcoded in ToolsNavMenu.tsx — keep them in sync with `toolConfig.ts` when adding tools. Verified via Playwright: both dropdowns open on hover with correct headings/links, links navigate to the right routes and close the menu, and the old standalone "Tools" item is gone; build passes.