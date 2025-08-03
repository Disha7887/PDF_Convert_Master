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