# Simple Guide: Pull Your Builder.io Changes

## Quick Fix - Run These Commands

```bash
# Navigate to your frontend directory
cd ~/pdf-convert-frontend

# Reset any merge conflicts
git reset --hard HEAD

# Pull Builder.io changes (use merge strategy)
git pull origin main --allow-unrelated-histories

# If conflicts appear, choose Builder.io version:
git checkout --theirs .
git add .
git commit -m "Accept Builder.io changes"
```

## Alternative: Force Pull Latest Changes

If you want to completely replace your local files with Builder.io changes:

```bash
cd ~/pdf-convert-frontend

# Backup current state (optional)
cp -r . ../pdf-convert-backup

# Force pull latest from Builder.io
git fetch origin main
git reset --hard origin/main

# Confirm you have the latest changes
git log --oneline -3
```

## Test Your Changes

After successful pull:
```bash
# Check what changed
git diff HEAD~1

# View your updated files
ls -la src/pages/
cat src/pages/Body.tsx | head -20
```

## Create Auto-Sync Script

```bash
# Create simple sync script
cat > quick-sync.sh << 'EOF'
#!/bin/bash
cd ~/pdf-convert-frontend
echo "Pulling Builder.io changes..."
git fetch origin main
git reset --hard origin/main
echo "✅ Builder.io changes synced!"
git log --oneline -2
EOF

# Make executable
chmod +x quick-sync.sh

# Use anytime: ./quick-sync.sh
```

## Your Builder.io Workflow

1. **Edit in Builder.io** → Publish changes
2. **In Replit**: Run `./quick-sync.sh` 
3. **Your changes appear** in ~/pdf-convert-frontend

The key is using `--allow-unrelated-histories` to handle the Builder.io commits properly.