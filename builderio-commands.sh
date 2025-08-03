#!/bin/bash

# Builder.io Commands for Frontend Management

show_help() {
    echo "Builder.io Frontend Management Commands"
    echo "======================================"
    echo ""
    echo "Usage: ./builderio-commands.sh [command]"
    echo ""
    echo "Commands:"
    echo "  setup     - Set up new frontend repository"
    echo "  sync      - Sync Builder.io changes from GitHub"
    echo "  status    - Check current sync status"
    echo "  deploy    - Build and prepare for deployment"
    echo "  help      - Show this help message"
}

setup_frontend_repo() {
    echo "🚀 Setting up separate frontend repository..."
    echo ""
    
    # Check if frontend directory exists
    if [ ! -d "frontend" ]; then
        echo "❌ Frontend directory not found!"
        echo "Make sure you're in the root directory with a 'frontend' folder."
        exit 1
    fi
    
    echo "📁 Frontend directory found. Ready for extraction."
    echo ""
    echo "Next steps:"
    echo "1. Create new GitHub repository: 'pdf-convert-frontend'"
    echo "2. Run these commands to extract:"
    echo ""
    echo "   cp -r frontend/ ../pdf-convert-frontend/"
    echo "   cd ../pdf-convert-frontend/"
    echo "   git init"
    echo "   git add ."
    echo "   git commit -m 'Initial frontend extraction'"
    echo "   git branch -M main"
    echo "   git remote add origin https://github.com/YOUR_USERNAME/pdf-convert-frontend.git"
    echo "   git push -u origin main"
    echo ""
    echo "3. Connect to Builder.io:"
    echo "   - Go to builder.io"
    echo "   - Connect GitHub repository: pdf-convert-frontend"
    echo "   - Set working directory: /src"
}

sync_builderio() {
    echo "🔄 Syncing Builder.io changes..."
    
    # Check if we're in a git repository
    if [ ! -d ".git" ]; then
        echo "❌ Not in a git repository!"
        echo "Make sure you're in the frontend project directory."
        exit 1
    fi
    
    # Pull latest changes
    echo "📥 Pulling latest changes from GitHub..."
    git pull origin main
    
    if [ $? -eq 0 ]; then
        echo "✅ Successfully pulled changes!"
        
        # Install dependencies if package.json changed
        if git diff HEAD~1 --name-only | grep -q "package.json"; then
            echo "📦 Package.json changed, installing dependencies..."
            npm install
        fi
        
        # Build the project
        echo "🔨 Building project..."
        npm run build
        
        echo "✨ Sync complete! Builder.io changes are now live."
    else
        echo "❌ Failed to pull changes from GitHub"
        echo "Try resolving any merge conflicts manually."
    fi
}

check_status() {
    echo "📊 Frontend Repository Status"
    echo "============================"
    echo ""
    
    # Check if we're in a git repository
    if [ ! -d ".git" ]; then
        echo "❌ Not in a git repository!"
        exit 1
    fi
    
    # Show current branch
    echo "🌿 Current branch: $(git branch --show-current)"
    
    # Show remote URL
    echo "🔗 Remote URL: $(git remote get-url origin 2>/dev/null || echo 'No remote configured')"
    
    # Show last commit
    echo "📝 Last commit: $(git log -1 --oneline 2>/dev/null || echo 'No commits yet')"
    
    # Show working directory status
    echo ""
    echo "📁 Working directory status:"
    git status --short || echo "No changes"
    
    # Check if Builder.io config exists
    echo ""
    if [ -f ".builderio" ]; then
        echo "✅ Builder.io config found"
    else
        echo "⚠️  Builder.io config missing - create .builderio file"
    fi
    
    # Check if package.json exists
    if [ -f "package.json" ]; then
        echo "✅ Package.json found"
    else
        echo "❌ Package.json missing"
    fi
}

deploy_frontend() {
    echo "🚀 Building frontend for deployment..."
    
    # Install dependencies
    echo "📦 Installing dependencies..."
    npm install
    
    # Build project
    echo "🔨 Building project..."
    npm run build
    
    if [ $? -eq 0 ]; then
        echo "✅ Build successful!"
        echo ""
        echo "📁 Build output in: ./dist/"
        echo "🌐 Ready for deployment to:"
        echo "   - Replit (run 'npm run preview')"
        echo "   - Vercel (connect GitHub repository)"
        echo "   - Netlify (drag & drop ./dist/ folder)"
    else
        echo "❌ Build failed!"
        echo "Check console output for errors."
    fi
}

# Main command handler
case "$1" in
    "setup")
        setup_frontend_repo
        ;;
    "sync")
        sync_builderio
        ;;
    "status")
        check_status
        ;;
    "deploy")
        deploy_frontend
        ;;
    "help"|"")
        show_help
        ;;
    *)
        echo "❌ Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac