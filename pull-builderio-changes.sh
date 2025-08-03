#!/bin/bash

echo "🔄 Pulling Builder.io changes from GitHub..."

# Navigate to frontend directory
cd ~/pdf-convert-frontend

# Show current status
echo "Current directory: $(pwd)"
echo "Current branch: $(git branch --show-current)"

# Fetch latest changes
echo "Fetching latest changes..."
git fetch origin main

# Show what's available
echo "Latest commits on GitHub:"
git log origin/main --oneline -3

# Check if we need to pull
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

if [ "$LOCAL" = "$REMOTE" ]; then
    echo "✅ You already have the latest changes!"
else
    echo "📥 Pulling new changes..."
    
    # Try regular pull first
    if git pull origin main; then
        echo "✅ Successfully pulled Builder.io changes!"
    else
        echo "🔧 Handling merge conflicts..."
        
        # Reset and force pull
        git reset --hard origin/main
        echo "✅ Force-pulled Builder.io changes!"
    fi
fi

# Show final status
echo ""
echo "📋 Current status:"
echo "Latest commit: $(git log --oneline -1)"
echo "Files in src/pages/:"
ls -la src/pages/ | head -5

echo ""
echo "🎉 Builder.io sync complete!"