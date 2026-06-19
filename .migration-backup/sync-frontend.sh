#!/bin/bash

# Builder.io Frontend Sync Script
# This script syncs changes from your Builder.io-connected GitHub repository back to Replit

set -e  # Exit on any error

# Configuration
FRONTEND_REPO_URL="https://github.com/YOUR_USERNAME/pdf-converter-frontend.git"
TEMP_DIR="/tmp/builderio-sync"
LOCAL_FRONTEND_DIR="./frontend"
BACKUP_DIR="./frontend-backup-$(date +%Y%m%d-%H%M%S)"

echo "🔄 Starting Builder.io frontend sync..."

# Step 1: Create backup of current frontend
echo "📦 Creating backup of current frontend..."
cp -r "$LOCAL_FRONTEND_DIR" "$BACKUP_DIR"
echo "✅ Backup created at: $BACKUP_DIR"

# Step 2: Clone the Builder.io repository
echo "📥 Cloning Builder.io repository..."
rm -rf "$TEMP_DIR"
git clone "$FRONTEND_REPO_URL" "$TEMP_DIR"

# Step 3: Sync specific files (excluding node_modules, dist, etc.)
echo "🔄 Syncing frontend files..."

# Remove old frontend files (except node_modules and dist)
find "$LOCAL_FRONTEND_DIR" -mindepth 1 -maxdepth 1 ! -name 'node_modules' ! -name 'dist' ! -name '.env.local' -exec rm -rf {} +

# Copy new files from Builder.io repo
cp -r "$TEMP_DIR/src" "$LOCAL_FRONTEND_DIR/"
cp -r "$TEMP_DIR/public" "$LOCAL_FRONTEND_DIR/"
cp "$TEMP_DIR/package.json" "$LOCAL_FRONTEND_DIR/"
cp "$TEMP_DIR/vite.config.ts" "$LOCAL_FRONTEND_DIR/"
cp "$TEMP_DIR/tailwind.config.ts" "$LOCAL_FRONTEND_DIR/"
cp "$TEMP_DIR/postcss.config.js" "$LOCAL_FRONTEND_DIR/"
cp "$TEMP_DIR/tsconfig.json" "$LOCAL_FRONTEND_DIR/"
cp "$TEMP_DIR/index.html" "$LOCAL_FRONTEND_DIR/"
cp "$TEMP_DIR/components.json" "$LOCAL_FRONTEND_DIR/"

# Step 4: Install new dependencies if package.json changed
echo "📦 Checking for dependency changes..."
cd "$LOCAL_FRONTEND_DIR"
npm install

# Step 5: Clean up
echo "🧹 Cleaning up temporary files..."
rm -rf "$TEMP_DIR"

echo "✅ Frontend sync complete!"
echo "🔄 Your application will automatically restart with the new changes."
echo "📁 Backup available at: $BACKUP_DIR"