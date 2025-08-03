# Complete Builder.io Setup Guide

## Quick Start Checklist

✅ **Project Structure Ready**: Frontend in `/frontend/` directory
✅ **GitHub Connected**: `https://github.com/Disha7887/PDF_Convert_Master`
✅ **Configuration Files**: `.builderio` and `builder.config.js` created
✅ **Sync Scripts**: `sync-from-github.sh` ready to use
✅ **GitHub Actions**: Workflow configured for auto-notifications

## Step-by-Step Builder.io Setup

### 1. Create Builder.io Account (5 minutes)

1. Go to [builder.io](https://builder.io)
2. Click **"Sign up with GitHub"**
3. Authorize Builder.io to access your GitHub account
4. Choose **"Create new organization"** or use existing
5. Create new space: **"PDF Convert Master"**

### 2. Connect Your GitHub Repository (3 minutes)

1. In Builder.io dashboard, click **"Integrations"** in sidebar
2. Click **"GitHub"** → **"Connect GitHub"**
3. Select repository: **`Disha7887/PDF_Convert_Master`**
4. Choose branch: **`main`**
5. Set content directory: **`/frontend/src`**
6. Click **"Connect Repository"**

### 3. Configure Project Settings (2 minutes)

In Builder.io project settings, set:

**General Tab:**
- Project Name: `PDF Convert Master`
- Framework: `React`
- Build Tool: `Vite`

**GitHub Integration Tab:**
- Repository: `Disha7887/PDF_Convert_Master`
- Branch: `main`
- Content Path: `/frontend/src`
- Auto-commit: ✅ **Enabled**
- Commit message template: `[Builder.io] Update {{name}} via visual editor`

**Build Settings Tab:**
- Build command: `cd frontend && npm run build`
- Output directory: `frontend/dist`
- Node version: `18.x`

### 4. Import Your First Page (5 minutes)

1. In Builder.io dashboard, click **"Content"** → **"Create New"**
2. Choose **"Page"**
3. Select **"Import from code"**
4. Choose file: `/frontend/src/pages/Body.tsx` (your landing page)
5. Builder.io will parse and create editable sections
6. Click **"Start Editing"**

### 5. Make Your First Edit (2 minutes)

1. In the Builder.io visual editor:
   - Click on any text element
   - Change the text (e.g., update a heading)
   - Modify colors or spacing
2. Click **"Publish"** in top-right corner
3. Builder.io will automatically commit to GitHub

### 6. Test the Complete Pipeline (3 minutes)

1. **Check GitHub**: Go to your GitHub repository
   - Look for a new commit with message starting with `[Builder.io]`
   - Verify the changes in `/frontend/src/pages/Body.tsx`

2. **Sync to Replit**: In your Replit project terminal:
   ```bash
   ./sync-from-github.sh
   ```

3. **Verify Changes**: Your Replit frontend should now show the Builder.io changes

## Page-by-Page Setup Guide

### Recommended Order for Importing Pages:

1. **Body.tsx** (Landing page) - Start here, most visual impact
2. **About.tsx** - Good for text content editing
3. **Pricing.tsx** - Great for component editing
4. **Features.tsx** - Excellent for layout changes
5. **Tools.tsx** - Complex page with dynamic content

### For Each Page:

1. In Builder.io, click **"Create New"** → **"Page"**
2. Choose **"Import from code"**
3. Select the page file from `/frontend/src/pages/`
4. Let Builder.io parse the components
5. Start with small edits (text changes)
6. Gradually try layout and styling changes

## Builder.io Editing Best Practices

### What You Can Safely Edit:

✅ **Text content** - Headings, paragraphs, button text
✅ **Images** - Replace, resize, adjust alt text
✅ **Colors** - Change theme colors, backgrounds
✅ **Spacing** - Margins, padding, gaps
✅ **Layout** - Rearrange sections, change grid layouts
✅ **Styling** - Add CSS classes, modify existing styles

### What to Avoid:

❌ **React hooks** (useState, useEffect) - Will break functionality
❌ **API calls** - Don't modify fetch/API logic
❌ **Routing logic** - Don't change navigation code
❌ **TypeScript types** - Don't modify interfaces/types
❌ **Authentication code** - Don't touch auth logic

## Daily Workflow

### Morning Routine:
```bash
# Pull any overnight Builder.io changes
./sync-from-github.sh
```

### During Development:
- **Content changes**: Use Builder.io visual editor
- **Code changes**: Use Replit as usual
- **Backend changes**: Only in Replit (Builder.io doesn't touch `/server/`)

### End of Day:
```bash
# Push any Replit code changes to GitHub
git add .
git commit -m "Backend improvements and bug fixes"
git push origin main
```

## Troubleshooting Guide

### Issue: Builder.io can't see my files
**Solution**: 
1. Check repository connection in Builder.io settings
2. Verify content path is set to `/frontend/src`
3. Ensure your GitHub token has proper permissions

### Issue: Changes don't appear in Replit
**Solution**:
```bash
# Force sync
git reset --hard origin/main
./sync-from-github.sh
```

### Issue: Build errors after Builder.io edit
**Solution**:
1. Check the commit in GitHub for syntax errors
2. Fix manually in Replit
3. Commit the fix to GitHub

### Issue: Lost authentication or routing
**Solution**:
- Builder.io only edits content, not logic
- Check if any imports were accidentally removed
- Restore from Git history if needed

## Advanced Features

### Custom Components in Builder.io

Your `frontend/builder.config.js` registers these components for Builder.io:
- `Button` - Editable buttons with variants
- `Card` - Content cards with images
- `Hero` - Landing page hero sections
- `FeatureCard` - Feature showcase components
- `PricingCard` - Pricing plan displays

### Content Types

Builder.io can manage:
- **Pages** - Full page layouts
- **Sections** - Reusable page sections
- **Components** - Individual UI components
- **Data** - Structured content (testimonials, features, etc.)

## Security & Permissions

- Builder.io only accesses `/frontend/src/` files
- Backend code in `/server/` is completely protected
- Database and API keys remain secure
- All changes are tracked in Git history
- You can always roll back any changes

## Support & Resources

- **Builder.io Docs**: [docs.builder.io](https://docs.builder.io)
- **React Integration**: [docs.builder.io/integrations/react](https://docs.builder.io/integrations/react)
- **GitHub Integration**: [docs.builder.io/integrations/github](https://docs.builder.io/integrations/github)

## Success Metrics

After setup, you should be able to:
1. ✅ Edit page content visually in Builder.io
2. ✅ See changes auto-commit to GitHub
3. ✅ Pull changes to Replit with one command
4. ✅ Deploy updated frontend with visual changes
5. ✅ Maintain all existing functionality

## Next Steps

1. **Complete Builder.io account setup** (follow steps 1-3 above)
2. **Import your first page** (start with Body.tsx)
3. **Test the complete pipeline** with a small edit
4. **Train team members** on the visual editing workflow
5. **Set up staging environment** if needed for testing

Your visual editing pipeline is ready! 🎨

**Builder.io (edit) → GitHub (sync) → Replit (develop) → Deploy**