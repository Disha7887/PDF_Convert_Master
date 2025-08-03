# Simple Builder.io Setup Guide

## What We're Building

A simple workflow where:
1. You edit your website visually in Builder.io
2. Builder.io automatically saves changes to GitHub
3. You pull those changes to your Replit project with one command

## Your Repository Information

- **GitHub Repository**: `https://github.com/Disha7887/PDF_Convert_Master`
- **Branch**: `main`
- **Frontend Files**: Located in `/frontend/src/pages/` directory
- **Target Files for Editing**: Your page components (Body.tsx, About.tsx, etc.)

## Step 1: Create Builder.io Account (2 minutes)

1. Go to **https://builder.io**
2. Click **"Sign up with GitHub"** (this makes connecting easier)
3. Allow Builder.io to access your GitHub account
4. Create a new project called **"PDF Convert Master"**

## Step 2: Connect to Your GitHub Repository (3 minutes)

1. **In Builder.io dashboard**:
   - Click **"Settings"** in the left sidebar
   - Click **"Integrations"** 
   - Find **"GitHub"** and click **"Connect"**

2. **Configure GitHub Connection**:
   - Select repository: **`Disha7887/PDF_Convert_Master`**
   - Choose branch: **`main`**
   - Set working directory: **`/frontend/src`**
   - Enable **"Auto-commit changes"**

3. **Test Connection**:
   - Builder.io will show "Connected" status
   - You should see your files listed

## Step 3: Import Your First Page (5 minutes)

1. **In Builder.io**:
   - Click **"Content"** → **"Create New"**
   - Choose **"Page"**
   - Select **"Import existing page"**
   - Choose file: **`/frontend/src/pages/Body.tsx`** (your landing page)

2. **Builder.io will analyze your page**:
   - It will identify text elements you can edit
   - It will show layout sections you can modify
   - It will preserve your existing code structure

3. **Make a small test edit**:
   - Click on any text (like a heading)
   - Change the text slightly
   - Click **"Publish"** button

## Step 4: Set Up Replit Sync (1 minute)

**In your Replit terminal**, run this command whenever you want to get Builder.io changes:

```bash
./sync-from-github.sh
```

This script will:
- Pull latest changes from GitHub
- Install any needed dependencies
- Restart your development server
- Show you what changed

## Step 5: Test the Complete Flow (2 minutes)

1. **Make an edit in Builder.io**:
   - Edit some text on your page
   - Click "Publish"
   - Go to your GitHub repository and verify a new commit appeared

2. **Sync to Replit**:
   - In Replit terminal: `./sync-from-github.sh`
   - Check that your changes appear in the frontend
   - Visit your website to see the changes live

## Daily Workflow

### To Edit Content:
1. Go to Builder.io
2. Edit your pages visually
3. Click "Publish"

### To Get Changes in Replit:
```bash
./sync-from-github.sh
```

### To Make Code Changes:
- Use Replit as normal for backend changes
- Use Replit as normal for complex frontend changes
- Use Builder.io for content and layout changes

## What Builder.io Can Safely Edit

✅ **Text content** - Headlines, paragraphs, button text
✅ **Images** - Replace images, update alt text
✅ **Colors and styling** - Change colors, fonts, spacing
✅ **Layout** - Rearrange sections, adjust layouts
✅ **Component properties** - Button styles, card content

## What Builder.io Won't Touch

❌ **Your login/signup system** - Authentication stays intact
❌ **Backend API** - All your conversion tools keep working
❌ **Database** - User data and settings preserved
❌ **Complex React logic** - Hooks and state management untouched

## Troubleshooting

### If Builder.io can't see your files:
- Check GitHub connection in Builder.io settings
- Verify repository name is exactly: `Disha7887/PDF_Convert_Master`
- Make sure working directory is set to `/frontend/src`

### If changes don't appear in Replit:
```bash
# Force sync
git pull origin main
./sync-from-github.sh
```

### If something breaks:
- All changes are saved in Git history
- You can always revert to any previous version
- Your backend and database are completely safe

## Quick Reference Commands

```bash
# Get latest changes from Builder.io
./sync-from-github.sh

# Check what changed
git log --oneline -5

# See current status
git status

# Emergency reset (if something goes wrong)
git reset --hard origin/main
```

## Next Steps

1. **Set up Builder.io account** (follow Step 1-2 above)
2. **Import one page** to test (follow Step 3)
3. **Test the sync** (follow Step 4-5)
4. **Start editing visually** once everything works

The setup preserves all your existing functionality while adding visual editing capabilities. Your authentication system, conversion tools, and database remain completely unchanged.