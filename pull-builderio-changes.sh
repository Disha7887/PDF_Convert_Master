#!/bin/bash

# Simple script to pull Builder.io changes from GitHub to Replit

# Configuration - UPDATE THESE WITH YOUR DETAILS
GITHUB_REPO_URL="https://github.com/YOUR_USERNAME/pdf-converter-frontend.git"
TEMP_DIR="/tmp/builderio-pull"
FRONTEND_DIR="./frontend"

echo "Pulling Builder.io changes from GitHub..."

# Step 1: Create backup
echo "Creating backup..."
cp -r "$FRONTEND_DIR" "./frontend-backup-$(date +%Y%m%d-%H%M%S)"

# Step 2: Clone your Builder.io repository
echo "Downloading latest changes..."
rm -rf "$TEMP_DIR"
git clone "$GITHUB_REPO_URL" "$TEMP_DIR"

# Step 3: Copy files (preserve node_modules and other local files)
echo "Updating files..."
rsync -av --exclude='node_modules' --exclude='dist' --exclude='.env.local' "$TEMP_DIR/" "$FRONTEND_DIR/"

# Step 4: Install any new dependencies
echo "Installing dependencies..."
cd "$FRONTEND_DIR"
npm install

# Step 5: Clean up
echo "Cleaning up..."
rm -rf "$TEMP_DIR"

echo "✅ Builder.io changes synced successfully!"
echo "Your Replit application will automatically restart with the new changes."