#!/bin/bash

echo "🔄 Syncing PDF Convert Master from GitHub..."
echo "============================================="

# Pull latest changes from GitHub
echo "📥 Pulling latest changes from main branch..."
git pull origin main

if [ $? -eq 0 ]; then
    echo "✅ Successfully pulled changes from GitHub"
    
    # Check if frontend dependencies need updating
    echo "📦 Checking frontend dependencies..."
    cd frontend
    
    if [ -f "package-lock.json" ]; then
        npm ci
    else
        npm install
    fi
    
    echo "🔨 Building frontend..."
    npm run build
    
    echo "🚀 Restarting development server..."
    cd ..
    
    # Kill existing dev process and restart
    pkill -f "npm run dev" || true
    sleep 2
    
    echo "✨ Sync complete! Your Replit project is now up to date with GitHub."
    echo "🎯 Ready for development with latest Builder.io changes."
    
else
    echo "❌ Failed to pull changes from GitHub"
    echo "💡 Try resolving any merge conflicts manually"
    exit 1
fi