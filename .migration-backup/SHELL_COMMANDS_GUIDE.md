# Shell Commands for Builder.io Integration

## Quick Start

### 1. Initial Setup
```bash
# Interactive setup wizard
./builderio-commands.sh quick-setup

# Or manual setup
./builderio-commands.sh setup
```

### 2. One-Time Sync
```bash
# Set your repository URL (do this once)
export BUILDERIO_REPO="https://github.com/USERNAME/pdf-converter-frontend.git"

# Sync changes from Builder.io
./builderio-commands.sh sync
```

### 3. Automatic Watching
```bash
# Continuously check for Builder.io changes (every 5 minutes)
./builderio-commands.sh watch
```

## How It Works

1. **Builder.io edits your components** → Changes saved to GitHub
2. **Shell script downloads changes** → `git clone` from your repository  
3. **Files automatically replaced** → Your Replit frontend updates
4. **Application restarts** → Changes appear immediately

## Individual Commands

### Manual Sync (Advanced Users)
```bash
# Clone Builder.io repository
git clone https://github.com/USERNAME/pdf-converter-frontend.git /tmp/sync

# Backup current frontend
cp -r ./frontend ./frontend-backup-$(date +%Y%m%d-%H%M%S)

# Replace frontend files
rsync -av --exclude='node_modules' /tmp/sync/ ./frontend/

# Install new dependencies
cd frontend && npm install

# Clean up
rm -rf /tmp/sync
```

### Quick Status Check
```bash
# Check if Builder.io repo is configured
echo $BUILDERIO_REPO

# View recent Builder.io commits
git ls-remote --heads $BUILDERIO_REPO
```

## Automation Options

### Option A: Run on Demand
```bash
./builderio-commands.sh sync
```

### Option B: Scheduled (Every 10 minutes)
```bash
# Add to crontab
*/10 * * * * cd /path/to/project && ./builderio-commands.sh sync
```

### Option C: Continuous Watching
```bash
# Runs in background, checks every 5 minutes
./builderio-commands.sh watch &
```

## Benefits of Shell Commands

✅ **Automatic**: No manual file copying  
✅ **Fast**: Updates in seconds  
✅ **Safe**: Creates backups before syncing  
✅ **Simple**: One command syncs everything  
✅ **Flexible**: Run on-demand or continuously