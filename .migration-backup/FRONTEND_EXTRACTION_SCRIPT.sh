#!/bin/bash

# Frontend Extraction Script for Builder.io
# This script creates a standalone frontend package

echo "Creating standalone frontend package..."

# Create temporary directory
mkdir -p standalone-frontend

# Copy essential files from frontend directory
cp -r frontend/src standalone-frontend/
cp -r frontend/public standalone-frontend/
cp frontend/package.json standalone-frontend/
cp frontend/vite.config.ts standalone-frontend/
cp frontend/tailwind.config.ts standalone-frontend/
cp frontend/postcss.config.js standalone-frontend/
cp frontend/tsconfig.json standalone-frontend/
cp frontend/components.json standalone-frontend/
cp frontend/index.html standalone-frontend/
cp frontend/.env.example standalone-frontend/
cp frontend/README.md standalone-frontend/

# Create .gitignore for new repository
cat > standalone-frontend/.gitignore << EOF
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Build outputs
dist/
build/

# Environment files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE files
.vscode/
.idea/
*.swp
*.swo

# OS files
.DS_Store
Thumbs.db

# Logs
*.log
EOF

# Create updated README for standalone version
cat > standalone-frontend/README.md << EOF
# PDF Converter Frontend

Standalone React frontend for the PDF conversion tool, optimized for Builder.io integration.

## Quick Start

\`\`\`bash
npm install
npm run dev
\`\`\`

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

- \`src/components/\` - Reusable UI components
- \`src/pages/\` - Page components
- \`src/hooks/\` - Custom React hooks
- \`src/lib/\` - Utilities and configurations

## Development

The frontend is designed to work independently. API calls will fail gracefully when the backend is not available (normal behavior in Builder.io).
EOF

echo "✅ Standalone frontend package created in: standalone-frontend/"
echo "📦 Archive created: frontend-standalone.tar.gz"
echo ""
echo "Next steps:"
echo "1. Create new GitHub repository"
echo "2. Upload contents of 'standalone-frontend/' folder"
echo "3. Configure Builder.io with the new repository"