#!/bin/bash

# Builder.io Command Suite
# Simple commands to manage Builder.io integration

case "$1" in
    "setup")
        echo "🚀 Setting up Builder.io repository..."
        ./setup-builderio-repo.sh
        ;;
    
    "sync")
        echo "🔄 Syncing from Builder.io repository..."
        # Quick sync command - you need to set your repo URL first
        if [ -z "$BUILDERIO_REPO" ]; then
            echo "❌ Please set BUILDERIO_REPO environment variable"
            echo "Example: export BUILDERIO_REPO=https://github.com/username/pdf-converter-frontend.git"
            exit 1
        fi
        
        TEMP_DIR="/tmp/builderio-sync"
        rm -rf "$TEMP_DIR"
        git clone "$BUILDERIO_REPO" "$TEMP_DIR"
        
        # Backup current frontend
        cp -r ./frontend ./frontend-backup-$(date +%Y%m%d-%H%M%S)
        
        # Sync files
        rsync -av --exclude='node_modules' --exclude='dist' --exclude='.env.local' "$TEMP_DIR/" ./frontend/
        
        # Install dependencies
        cd ./frontend && npm install
        
        rm -rf "$TEMP_DIR"
        echo "✅ Sync complete!"
        ;;
    
    "watch")
        echo "👀 Starting Builder.io sync watcher..."
        if [ -z "$BUILDERIO_REPO" ]; then
            echo "❌ Please set BUILDERIO_REPO environment variable first"
            exit 1
        fi
        
        while true; do
            echo "🔄 Checking for updates..."
            ./builderio-commands.sh sync
            echo "⏰ Waiting 5 minutes before next check..."
            sleep 300  # Wait 5 minutes
        done
        ;;
    
    "quick-setup")
        echo "⚡ Quick setup for Builder.io"
        read -p "Enter your GitHub username: " username
        read -p "Enter repository name (default: pdf-converter-frontend): " repo_name
        repo_name=${repo_name:-pdf-converter-frontend}
        
        export BUILDERIO_REPO="https://github.com/$username/$repo_name.git"
        echo "export BUILDERIO_REPO=\"$BUILDERIO_REPO\"" >> ~/.bashrc
        
        echo "✅ Configuration saved!"
        echo "🔗 Repository URL: $BUILDERIO_REPO"
        echo "📝 Now run: ./builderio-commands.sh setup"
        ;;
    
    *)
        echo "Builder.io Command Suite"
        echo ""
        echo "Usage: ./builderio-commands.sh [command]"
        echo ""
        echo "Commands:"
        echo "  setup        Create Builder.io repository setup"
        echo "  sync         Sync changes from Builder.io repository"
        echo "  watch        Continuously watch for Builder.io changes"
        echo "  quick-setup  Interactive setup wizard"
        echo ""
        echo "Environment Variables:"
        echo "  BUILDERIO_REPO - Your Builder.io connected repository URL"
        ;;
esac