#!/bin/bash
# Quick sync from your Builder.io repository
echo "🔄 Syncing Builder.io changes..."
git clone https://github.com/Disha7887/PDF_CONVERT_MASTER_FRONTEND.git /tmp/sync && \
cp -r ./frontend ./frontend-backup-$(date +%Y%m%d-%H%M%S) && \
rsync -av --exclude='node_modules' --exclude='dist' --exclude='.env.local' /tmp/sync/ ./frontend/ && \
cd frontend && npm install && \
rm -rf /tmp/sync && \
echo "✅ Sync complete! Your app will restart automatically."