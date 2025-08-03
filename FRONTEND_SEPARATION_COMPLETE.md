# Complete Frontend Separation & Builder.io Setup Guide

## Overview

This guide helps you separate your backend and frontend into independent projects, connect the frontend to a new GitHub repository, and enable Builder.io visual editing with manual sync workflow.

## Current Project Structure

Your project already has the perfect separation:

```
PDF_Convert_Master/ (Current Replit)
├── frontend/                    # ← Already separated frontend
│   ├── src/pages/              # Pages for Builder.io editing
│   ├── package.json            # Independent dependencies
│   └── vite.config.ts          # Standalone build config
├── server/                      # ← Backend stays here
└── client/                      # ← Legacy (can ignore)
```

## Step-by-Step Process

### Phase 1: Create New GitHub Repository for Frontend (5 minutes)

1. **Go to GitHub.com**
2. **Click "+" → "New repository"**
3. **Repository settings**:
   - Repository name: `pdf-convert-frontend`
   - Description: `Frontend for PDF Convert Master - Visual editing with Builder.io`
   - Visibility: `Public` (required for Builder.io free tier)
   - Initialize: Don't check any boxes
4. **Click "Create repository"**

### Phase 2: Extract Frontend to New Repository (10 minutes)

Since your `frontend/` folder already exists, here's how to move it to the new repository:

#### Option A: Using Git Commands (Recommended)
```bash
# Create a copy of your frontend folder
cp -r frontend/ ../pdf-convert-frontend/
cd ../pdf-convert-frontend/

# Initialize new git repository
git init
git add .
git commit -m "Initial frontend extraction from PDF Convert Master"

# Connect to your new GitHub repository
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/pdf-convert-frontend.git
git push -u origin main
```

#### Option B: Manual Upload to GitHub
1. Download your `frontend/` folder as a ZIP
2. Extract it to a new folder called `pdf-convert-frontend`
3. Go to your new GitHub repository
4. Click "uploading an existing file"
5. Drag and drop all frontend files
6. Commit with message: "Initial frontend extraction"

### Phase 3: Connect Frontend Repository to Builder.io (8 minutes)

1. **Create Builder.io Account**:
   - Go to https://builder.io
   - Sign up with GitHub account
   - Create new project: "PDF Convert Frontend"

2. **Connect GitHub Integration**:
   - In Builder.io dashboard → Settings → Integrations
   - Click "GitHub" → "Connect"
   - Select repository: `YOUR_USERNAME/pdf-convert-frontend`
   - Choose branch: `main`
   - Set working directory: `/src`
   - Enable "Auto-commit changes"

3. **Configure Builder.io Project Settings**:
   ```
   Project Name: PDF Convert Frontend
   Framework: React + Vite
   Content Directory: /src
   Pages Directory: /src/pages
   Components Directory: /src/components
   Build Command: npm run build
   Output Directory: /dist
   ```

### Phase 4: Import Pages for Visual Editing (5 minutes)

1. **In Builder.io Content tab**:
   - Click "Create New" → "Page"
   - Choose "Import existing page"
   - Select files to import:
     - `/src/pages/Body.tsx` (Landing page)
     - `/src/pages/About.tsx` (About page)
     - `/src/pages/Pricing.tsx` (Pricing page)
     - `/src/pages/Features.tsx` (Features page)

2. **Test Visual Editing**:
   - Open any imported page
   - Make a small text change
   - Click "Publish"
   - Check GitHub repository for new commit

### Phase 5: Set Up Replit Frontend Workspace (3 minutes)

Create a separate Replit for frontend development:

1. **Create New Replit**:
   - Go to Replit.com
   - Click "Create Repl"
   - Choose "Import from GitHub"
   - Enter: `https://github.com/YOUR_USERNAME/pdf-convert-frontend`
   - Name: "PDF Convert Frontend"

2. **Configure Frontend Replit**:
   ```bash
   # Install dependencies
   npm install
   
   # Start development server
   npm run dev
   ```

### Phase 6: Set Up Manual Sync Workflow (2 minutes)

In your frontend Replit, create sync scripts:

```bash
# Create quick sync script
echo '#!/bin/bash
echo "🔄 Syncing Builder.io changes..."
git pull origin main
npm install
npm run build
echo "✅ Sync complete!"' > sync-builderio.sh

chmod +x sync-builderio.sh
```

## Complete Workflow

### Daily Development Process:

#### Backend Development (Original Replit):
```bash
# Work on backend as usual
cd server/
# Make API changes, database updates, etc.
```

#### Frontend Visual Editing:
1. **Builder.io**: Edit pages visually
2. **Publish**: Changes auto-commit to GitHub
3. **Frontend Replit**: Run `./sync-builderio.sh`

#### Frontend Code Development (Optional):
```bash
# In frontend Replit
git pull origin main
# Make code changes
git add .
git commit -m "Frontend improvements"
git push origin main
```

## Repository Structure After Separation

### Backend Repository (Current):
```
PDF_Convert_Master/
├── server/                      # Express backend
│   ├── routes.ts               # API endpoints
│   ├── auth.ts                 # Authentication
│   └── storage.ts              # Database logic
├── shared/                      # Shared types
└── package.json                # Backend dependencies
```

### Frontend Repository (New):
```
pdf-convert-frontend/
├── src/
│   ├── pages/                  # Builder.io editable pages
│   ├── components/             # Reusable components
│   └── contexts/               # React contexts
├── package.json                # Frontend-only dependencies
└── vite.config.ts              # Frontend build config
```

## Builder.io Configuration Files

Create these files in your new frontend repository:

### `.builderio` (Root of frontend repo):
```json
{
  "name": "PDF Convert Frontend",
  "repositoryUrl": "https://github.com/YOUR_USERNAME/pdf-convert-frontend",
  "branch": "main",
  "contentPath": "/src",
  "pagesPath": "/src/pages",
  "framework": "react-vite"
}
```

### `builder.config.js` (Root of frontend repo):
```javascript
import { Builder } from '@builder.io/react';

// Replace with your actual Builder.io public API key
Builder.init('YOUR_BUILDER_PUBLIC_API_KEY');

// Register components for visual editing
Builder.registerComponent('Button', {
  inputs: [
    { name: 'text', type: 'string' },
    { name: 'variant', type: 'string', enum: ['default', 'outline'] }
  ]
});

export default Builder;
```

## API Integration Between Separated Projects

### Frontend (Builder.io editable) → Backend (API calls):

Update your frontend `vite.config.ts`:
```typescript
export default defineConfig({
  // ... existing config
  server: {
    proxy: {
      '/api': {
        target: 'https://your-backend-replit-url.replit.dev',
        changeOrigin: true,
        secure: true
      }
    }
  }
});
```

## Deployment Strategy

### Backend Deployment:
- Deploy from original Replit: `PDF_Convert_Master`
- URL: `https://your-backend.replit.dev`

### Frontend Deployment:
- Deploy from frontend Replit: `pdf-convert-frontend`
- URL: `https://your-frontend.replit.dev`
- Or deploy to Vercel/Netlify connected to GitHub

## Sync Commands Reference

### Pull Builder.io Changes:
```bash
# In frontend Replit
./sync-builderio.sh
```

### Manual Sync:
```bash
git pull origin main
npm install
npm run build
npm run dev
```

### Check Changes:
```bash
git log --oneline -5
git status
```

## Safety Features

✅ **Complete Separation**: Backend and frontend are independent
✅ **Version Control**: All changes tracked in Git
✅ **Easy Rollback**: Can revert any Builder.io changes
✅ **Preserved Functionality**: Authentication and conversion tools intact
✅ **Manual Control**: You decide when to sync changes

## Success Checklist

- [ ] New GitHub repository created: `pdf-convert-frontend`
- [ ] Frontend extracted and pushed to new repository
- [ ] Builder.io account connected to new repository
- [ ] Pages imported and visual editing tested
- [ ] Frontend Replit workspace created
- [ ] Sync script working
- [ ] API calls from frontend to backend functional

## Troubleshooting

### If Builder.io can't see files:
- Verify repository is public
- Check working directory is set to `/src`
- Ensure GitHub integration is properly connected

### If sync fails:
```bash
git status
git pull origin main --force
```

### If API calls fail:
- Update proxy configuration in `vite.config.ts`
- Verify backend Replit URL is correct
- Check CORS settings in backend

This complete separation gives you maximum flexibility while maintaining the visual editing workflow you want.