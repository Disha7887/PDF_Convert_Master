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