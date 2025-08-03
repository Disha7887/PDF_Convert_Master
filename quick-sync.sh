#!/bin/bash

# Quick sync script for Builder.io changes
echo "🔄 Quick sync from GitHub..."

# Pull latest changes
git pull origin main

if [ $? -eq 0 ]; then
    echo "✅ Sync complete!"
    echo "🚀 Restarting development server..."
    
    # Restart the dev server (kill existing and restart)
    pkill -f "npm run dev" 2>/dev/null || true
    sleep 1
    npm run dev &
    
    echo "✨ Ready! Your Builder.io changes are now live."
else
    echo "❌ Sync failed. Try: git status"
fi