# Next Steps: Complete Builder.io Setup

## Current Status ✅
- Frontend build successful
- Project structure ready for separation
- Configuration files prepared

## Step 1: Create GitHub Repository (5 minutes)

1. **Go to GitHub.com**
   - Click "+" → "New repository"
   - Repository name: `pdf-convert-frontend`
   - Description: `Frontend for PDF Convert Master - Visual editing with Builder.io`
   - Visibility: **Public** (required for Builder.io free tier)
   - Don't initialize with README, .gitignore, or license
   - Click "Create repository"

## Step 2: Extract Your Frontend (10 minutes)

Since you're in `~/pdf-convert-frontend` directory, you need to:

### Option A: Copy from Main Project
```bash
# Go back to your main project
cd ~/workspace

# Copy frontend to new location
cp -r frontend/* ~/pdf-convert-frontend/

# Go to frontend directory
cd ~/pdf-convert-frontend

# Initialize git repository
git init
git add .
git commit -m "Initial frontend extraction from PDF Convert Master"
git branch -M main

# Connect to your GitHub repository (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/pdf-convert-frontend.git
git push -u origin main
```

### Option B: If Frontend Already Copied
```bash
# In ~/pdf-convert-frontend directory
git init
git add .
git commit -m "Initial frontend setup"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/pdf-convert-frontend.git
git push -u origin main
```

## Step 3: Connect Builder.io (8 minutes)

1. **Create Builder.io Account**:
   - Go to https://builder.io
   - Sign up with GitHub
   - Create new project: "PDF Convert Frontend"

2. **Connect GitHub Integration**:
   - Builder.io dashboard → Settings → Integrations
   - Click "GitHub" → "Connect"
   - Select repository: `YOUR_USERNAME/pdf-convert-frontend`
   - Branch: `main`
   - Working directory: `/src`
   - Enable "Auto-commit changes"

3. **Project Settings**:
   ```
   Project Name: PDF Convert Frontend
   Framework: React + Vite
   Content Directory: /src
   Pages Directory: /src/pages
   Build Command: npm run build
   Output Directory: /dist
   ```

## Step 4: Import Your First Page (5 minutes)

1. **In Builder.io**:
   - Content → Create New → Page
   - Choose "Import existing page"
   - Select `/src/pages/Body.tsx` (your landing page)

2. **Test Visual Editing**:
   - Click on any text element
   - Make a small change
   - Click "Publish"
   - Check GitHub for new commit

## Step 5: Test Complete Workflow (3 minutes)

After Builder.io publishes changes:

```bash
# In ~/pdf-convert-frontend
git pull origin main
npm install
npm run build
npm run dev
```

## Your Workflow After Setup

### Daily Visual Editing:
1. **Builder.io**: Edit pages visually
2. **Publish**: Changes auto-commit to GitHub
3. **Sync**: `git pull origin main` in your frontend directory

### Backend Development:
- Continue in `~/workspace` (main project)
- All your conversion tools and authentication unchanged

### API Integration:
Your frontend will call your backend APIs:
```javascript
const response = await fetch('https://your-backend-url.replit.dev/api/convert', {
  method: 'POST',
  body: formData
});
```

## Quick Commands Reference

```bash
# Check status
git status

# Pull Builder.io changes
git pull origin main

# Build project
npm run build

# Start development
npm run dev

# Push code changes
git add .
git commit -m "Code improvements"
git push origin main
```

## Success Indicators

You'll know it's working when:
1. ✅ GitHub repository shows your frontend files
2. ✅ Builder.io displays your pages for editing
3. ✅ Visual edits in Builder.io create GitHub commits
4. ✅ `git pull origin main` brings Builder.io changes to your project
5. ✅ `npm run dev` shows your updated frontend

## Troubleshooting

### If git push fails:
```bash
git remote -v  # Check remote URL
git remote set-url origin https://github.com/YOUR_USERNAME/pdf-convert-frontend.git
```

### If Builder.io can't see files:
- Ensure repository is public
- Check working directory is `/src`
- Verify GitHub integration is connected

### If build fails:
```bash
npm install
npm run build
```

## Project Structure After Separation

### Backend (~/workspace):
```
PDF_Convert_Master/
├── server/              # All backend unchanged
├── shared/              # Types and schemas
└── package.json         # Backend dependencies
```

### Frontend (~/pdf-convert-frontend):
```
pdf-convert-frontend/
├── src/pages/          # Builder.io editable pages
├── src/components/     # React components
├── package.json        # Frontend-only dependencies
└── .builderio          # Builder.io config
```

## Benefits of This Setup

✅ **Complete independence**: Frontend and backend separate
✅ **Visual editing**: Builder.io only touches frontend
✅ **Manual control**: You decide when to sync changes
✅ **Safe backend**: All conversion tools and auth preserved
✅ **Easy deployment**: Deploy projects independently

Start with **Step 1** (create GitHub repository) and work through each step. The separation will give you exactly the workflow you requested: visual editing in Builder.io with manual sync control.