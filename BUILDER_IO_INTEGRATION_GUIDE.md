# Builder.io → GitHub → Replit Integration Guide

This guide sets up the complete visual editing pipeline for your PDF Convert Master application.

## Project Structure Overview

Your project has the perfect structure for Builder.io integration:
```
PDF_Convert_Master/
├── frontend/                 # Standalone React app (Builder.io target)
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/          # Page components (Builder.io editable)
│   │   └── ...
│   ├── package.json        # Frontend dependencies
│   └── vite.config.ts      # Build configuration
├── server/                  # Backend API (unchanged)
└── client/                  # Legacy frontend (can ignore)
```

## Step 1: GitHub Repository Setup ✅

Your GitHub repository is already connected:
- **Repository**: `https://github.com/Disha7887/PDF_Convert_Master`
- **Replit Connection**: Already linked via git remote
- **Branch**: `main`

## Step 2: Builder.io Project Configuration

### 2.1 Create Builder.io Account & Project
1. Go to [Builder.io](https://builder.io)
2. Sign up/login with your GitHub account
3. Create a new project: "PDF Convert Master"

### 2.2 Connect GitHub Integration
1. In Builder.io dashboard, go to **Account Settings**
2. Click on **GitHub Integration**
3. Click **Connect GitHub Account**
4. Authorize Builder.io to access your repositories
5. Select repository: `Disha7887/PDF_Convert_Master`
6. Choose branch: `main`
7. Set content path: `/frontend/src`

### 2.3 Configure Project Settings
Use these exact settings in Builder.io:

**General Settings:**
- Project Name: `PDF Convert Master`
- Framework: `React + Vite`
- Content Directory: `/frontend/src`
- Components Directory: `/frontend/src/components`
- Pages Directory: `/frontend/src/pages`

**Build Settings:**
- Build Command: `cd frontend && npm run build`
- Output Directory: `/frontend/dist`
- Node Version: `18.x`

**GitHub Integration:**
- Repository: `https://github.com/Disha7887/PDF_Convert_Master`
- Branch: `main`
- Auto-commit: `Enabled`
- Commit Message Template: `[Builder.io] Update {component/page} via visual editor`

## Step 3: Builder.io Configuration Files

The `.builderio` configuration file has been created in your root directory with the correct settings.

## Step 4: Replit Auto-Sync Setup

### 4.1 Enable GitHub Sync in Replit
1. In your Replit project, go to **Version Control** (Git icon)
2. Ensure you're connected to: `https://github.com/Disha7887/PDF_Convert_Master`
3. Set up auto-pull from main branch

### 4.2 Create Auto-Sync Script
Run this command to pull changes automatically:

```bash
# Manual sync (run when needed)
git pull origin main

# Or set up auto-sync with a simple script
echo '#!/bin/bash
echo "Pulling latest changes from GitHub..."
git pull origin main
echo "Restarting development server..."
npm run dev' > sync-from-github.sh
chmod +x sync-from-github.sh
```

## Step 5: Builder.io Page Templates

### 5.1 Prepare Your Pages for Visual Editing

Your existing pages in `/frontend/src/pages/` are already perfect for Builder.io:
- `Body.tsx` (Landing page)
- `About.tsx`
- `Pricing.tsx`
- `Features.tsx`
- `Tools.tsx`
- etc.

### 5.2 Builder.io Compatible Components

Builder.io will recognize and allow editing of:
- Text content
- Images and media
- Layout sections
- Button text and styling
- Component props
- CSS classes

## Step 6: Testing the Pipeline

### 6.1 Test Builder.io → GitHub
1. In Builder.io, make a small text change to any page
2. Click **Publish**
3. Check your GitHub repository for the new commit
4. Verify the commit message includes `[Builder.io]`

### 6.2 Test GitHub → Replit
1. In Replit, run: `git pull origin main`
2. Check that your changes appear in the frontend
3. Restart your development server to see changes

### 6.3 End-to-End Test
1. Edit a page in Builder.io (change text/layout)
2. Publish changes
3. In Replit, run: `./sync-from-github.sh`
4. Verify changes appear in your live application

## Step 7: Workflow Commands

### Daily Development Workflow
```bash
# Start your day - pull latest changes
git pull origin main

# Make backend changes in Replit as usual
# Make frontend changes in Builder.io visually

# Sync Builder.io changes
git pull origin main
npm run dev  # Restart if needed
```

### Manual Sync Commands
```bash
# Pull latest from GitHub
git pull origin main

# Push local changes to GitHub
git add .
git commit -m "Backend updates"
git push origin main

# Force sync frontend
cd frontend && npm install && npm run build
```

## Step 8: Deployment Pipeline

Your complete pipeline:
1. **Builder.io** (Visual editing) → Commits to GitHub
2. **GitHub** (Version control) → Source of truth
3. **Replit** (Development) → Pulls from GitHub
4. **Deployment** → Can deploy from either Replit or GitHub

## Important Notes

### What Builder.io CAN Edit:
- Page layouts and sections
- Text content and headings
- Images and media assets
- Component styling and props
- CSS classes and styles

### What Builder.io WON'T Touch:
- Backend API routes (`/server/`)
- Authentication logic
- Database schemas
- Build configurations
- NPM dependencies

### File Structure Preservation:
- Your existing routing logic is preserved
- Component imports remain intact
- TypeScript types are maintained
- Tailwind classes work seamlessly

## Troubleshooting

### If Builder.io changes don't appear:
```bash
git pull origin main
cd frontend
npm install
npm run build
```

### If there are merge conflicts:
```bash
git stash
git pull origin main
git stash pop
# Resolve conflicts manually
```

### If Replit loses GitHub connection:
1. Go to Version Control in Replit
2. Re-authenticate with GitHub
3. Ensure remote URL is correct: `https://github.com/Disha7887/PDF_Convert_Master`

## Next Steps

1. Complete Builder.io account setup with GitHub integration
2. Import your first page for visual editing
3. Test the complete pipeline with a small change
4. Set up automated syncing if desired

Your project is now ready for the complete visual editing workflow!