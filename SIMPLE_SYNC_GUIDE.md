# Simple Builder.io to Replit Sync

## Your Workflow

1. **Edit in Builder.io** ✅ (You've already done this)
2. **Builder.io saves to GitHub** ✅ (Automatic)
3. **Pull changes to Replit** ← You need this step

## Method 1: Use the Script (Recommended)

### First time setup:
```bash
# Edit the script with your GitHub repository URL
nano pull-builderio-changes.sh
# Change: YOUR_USERNAME to your actual GitHub username
```

### Every time you want to sync:
```bash
./pull-builderio-changes.sh
```

## Method 2: Manual Commands

```bash
# Create backup
cp -r ./frontend ./frontend-backup-$(date +%Y%m%d-%H%M%S)

# Download your Builder.io changes
git clone https://github.com/YOUR_USERNAME/pdf-converter-frontend.git /tmp/sync

# Update your Replit frontend
rsync -av --exclude='node_modules' /tmp/sync/ ./frontend/

# Install any new packages
cd frontend && npm install

# Clean up
rm -rf /tmp/sync
```

## Method 3: Quick One-Liner

```bash
# Replace YOUR_USERNAME with your GitHub username
curl -L https://github.com/YOUR_USERNAME/pdf-converter-frontend/archive/main.zip -o /tmp/update.zip && unzip -o /tmp/update.zip -d /tmp && rsync -av /tmp/pdf-converter-frontend-main/ ./frontend/ && cd frontend && npm install && rm -rf /tmp/update.zip /tmp/pdf-converter-frontend-main
```

## What Happens After Sync

1. Your Replit application automatically restarts
2. All Builder.io visual changes appear in your app
3. Backend functionality remains unchanged
4. Database and API continue working normally

The sync only updates your frontend components - your backend, database, and API endpoints stay exactly the same.