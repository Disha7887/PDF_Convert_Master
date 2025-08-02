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
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/ui/  # shadcn/ui components
│   │   ├── pages/         # Page components
│   │   │   └── sections/  # Section components (Hero, Features, etc.)
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Utilities and query client
├── server/                # Backend Express server
│   ├── index.ts          # Server entry point
│   ├── routes.ts         # API routes
│   ├── storage.ts        # Data storage interface
│   └── vite.ts           # Vite development setup
├── shared/               # Shared types and schemas
│   └── schema.ts        # Database schema and types
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
- None specified yet

## Recent Changes
- 2025-01-08: Initial migration from Figma to Replit completed
- 2025-01-08: Project documentation created
- 2025-01-08: All dependencies verified and project structure confirmed
- 2025-08-02: Fixed fuse.js dependency resolution issue
- 2025-08-02: Complete backend API setup for PDF conversion and image processing tools
- 2025-08-02: Implemented 20 tools across 3 categories with comprehensive API endpoints