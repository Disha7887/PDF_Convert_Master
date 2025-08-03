# GitHub ↔ Replit Auto-Sync Setup

This guide explains how your GitHub repository syncs with your Replit project for the Builder.io workflow.

## Current Setup Status

✅ **GitHub Repository**: `https://github.com/Disha7887/PDF_Convert_Master`
✅ **Replit Connection**: Already linked via git remote
✅ **Frontend Structure**: `/frontend/` directory ready for Builder.io
✅ **Sync Scripts**: Created and configured

## GitHub Actions Workflow

A GitHub Actions workflow (`.github/workflows/builder-io-sync.yml`) has been created that:

1. **Triggers on changes** to `/frontend/src/**` files
2. **Builds the frontend** to ensure changes are valid
3. **Comments on commits** to notify you in Replit
4. **Validates the build** process automatically

## Replit Sync Commands

### Automatic Sync Script
```bash
# Run this whenever you want to pull latest changes
./sync-from-github.sh
```

This script will:
- Pull latest changes from GitHub main branch
- Install any new frontend dependencies
- Build the frontend
- Restart your development server

### Manual Sync Commands
```bash
# Quick pull from GitHub
git pull origin main

# Full sync with build
git pull origin main
cd frontend
npm install
npm run build
cd ..
npm run dev
```

## Builder.io → GitHub Flow

When you make changes in Builder.io:

1. **Builder.io** commits changes to your GitHub repository
2. **GitHub Actions** validates the build
3. **GitHub** adds a comment to the commit
4. **You** run `./sync-from-github.sh` in Replit to pull changes

## Replit → GitHub Flow

When you make backend changes in Replit:

```bash
# Stage your changes
git add .

# Commit with a descriptive message
git commit -m "Add new API endpoint for file conversion"

# Push to GitHub
git push origin main
```

## File Structure for Builder.io

Your project structure is optimized for Builder.io editing:

```
frontend/
├── src/
│   ├── pages/           # ← Builder.io will edit these
│   │   ├── Body.tsx     # Landing page
│   │   ├── About.tsx    # About page
│   │   ├── Pricing.tsx  # Pricing page
│   │   └── ...
│   ├── components/      # ← Reusable components
│   │   ├── ui/          # Shadcn/ui components
│   │   └── ...
│   └── ...
├── .builderio          # Builder.io configuration
└── builder.config.js   # Builder.io component registry
```

## What Builder.io Can Edit

✅ **Text content** in pages
✅ **Images and media** assets
✅ **Layout and styling** (CSS classes)
✅ **Component props** and configurations
✅ **Page structure** and sections

## What Builder.io Won't Touch

❌ **Backend API** (`/server/` directory)
❌ **Authentication logic**
❌ **Database schemas**
❌ **NPM dependencies**
❌ **Build configurations**

## Daily Workflow

### Morning Setup
```bash
# Start your day with latest changes
./sync-from-github.sh
```

### During Development
- **Backend changes**: Make in Replit, commit and push as usual
- **Frontend visual changes**: Make in Builder.io (auto-commits to GitHub)
- **Frontend code changes**: Make in Replit, commit and push as usual

### Syncing Builder.io Changes
```bash
# Pull any Builder.io changes made during the day
./sync-from-github.sh
```

## Troubleshooting

### If sync fails:
```bash
# Check Git status
git status

# Resolve any conflicts
git pull origin main

# Force clean sync
git reset --hard origin/main
./sync-from-github.sh
```

### If Builder.io changes don't appear:
1. Check GitHub repository for recent commits
2. Run `./sync-from-github.sh`
3. Check console for any error messages
4. Restart development server: `npm run dev`

### If you lose GitHub connection in Replit:
1. Go to Version Control tab in Replit
2. Re-authenticate with GitHub
3. Verify remote URL: `git remote -v`

## Security Notes

- Your `.builderio` config file contains project settings only
- No API keys are stored in the repository
- Builder.io uses GitHub authentication for access
- All changes are tracked in Git history

## Next Steps

1. **Set up Builder.io account** with GitHub integration
2. **Import your repository** in Builder.io
3. **Test the sync** with a small change
4. **Start visual editing** your pages!

Your complete pipeline is now ready:
**Builder.io (edit) → GitHub (sync) → Replit (develop) → Deploy**