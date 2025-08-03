# PDF Converter Frontend

Standalone React frontend for the PDF conversion tool, optimized for Builder.io integration.

## Quick Start

```bash
npm install
npm run dev
```

## Builder.io Configuration

- Framework: React + Vite
- Install Command: npm install  
- Dev Command: npm run dev
- Build Command: npm run build
- Port: 3000
- Output Directory: dist

## Features

- React 18 + TypeScript
- Vite for fast development
- Tailwind CSS + shadcn/ui components
- Wouter for routing
- TanStack Query for state management

## Project Structure

- `src/components/` - Reusable UI components
- `src/pages/` - Page components
- `src/hooks/` - Custom React hooks
- `src/lib/` - Utilities and configurations

## Development

The frontend is designed to work independently. API calls will fail gracefully when the backend is not available (normal behavior in Builder.io).
