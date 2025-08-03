#!/bin/bash

# Setup Script for Builder.io Repository
# This script creates a separate repository with only frontend files

set -e

# Configuration
REPO_NAME="pdf-converter-frontend"
TEMP_DIR="/tmp/builderio-setup"

echo "🚀 Setting up Builder.io repository..."

# Step 1: Create temporary directory and copy frontend files
echo "📁 Preparing frontend files..."
rm -rf "$TEMP_DIR"
mkdir -p "$TEMP_DIR"

# Copy frontend files (excluding node_modules, dist, etc.)
cp -r ./frontend/src "$TEMP_DIR/"
cp -r ./frontend/public "$TEMP_DIR/"
cp ./frontend/package.json "$TEMP_DIR/"
cp ./frontend/vite.config.ts "$TEMP_DIR/"
cp ./frontend/tailwind.config.ts "$TEMP_DIR/"
cp ./frontend/postcss.config.js "$TEMP_DIR/"
cp ./frontend/tsconfig.json "$TEMP_DIR/"
cp ./frontend/index.html "$TEMP_DIR/"
cp ./frontend/components.json "$TEMP_DIR/"

# Create README for the new repository
cat > "$TEMP_DIR/README.md" << EOF
# PDF Converter Frontend

This is the standalone frontend for the PDF conversion application, optimized for Builder.io visual editing.

## Development

\`\`\`bash
npm install
npm run dev
\`\`\`

## Builder.io Integration

This repository is connected to Builder.io for visual component editing.

- Framework: React + Vite
- Styling: Tailwind CSS + shadcn/ui
- Port: 3000

## Note

API calls will fail in development since the backend runs separately. This is expected for Builder.io integration.
EOF

# Create .env.example
cat > "$TEMP_DIR/.env.example" << EOF
# API Configuration (for production)
VITE_API_URL=http://localhost:5000
EOF

# Initialize git repository
cd "$TEMP_DIR"
git init
git add .
git commit -m "Initial commit: Frontend setup for Builder.io"

echo "✅ Repository prepared in: $TEMP_DIR"
echo ""
echo "📋 Next steps:"
echo "1. Create GitHub repository named '$REPO_NAME'"
echo "2. Run these commands:"
echo "   cd $TEMP_DIR"
echo "   git remote add origin https://github.com/YOUR_USERNAME/$REPO_NAME.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "3. Configure Builder.io with:"
echo "   - Repository URL: https://github.com/YOUR_USERNAME/$REPO_NAME"
echo "   - Framework: React"
echo "   - Port: 3000"
echo "   - Build command: npm run build"
echo "   - Dev command: npm run dev"