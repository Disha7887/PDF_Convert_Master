# Get Your Builder.io Changes Into Replit

## The Issue
You edited pages in Builder.io, but Git conflicts are preventing the sync to Replit.

## Simple Solution (Run these commands):

```bash
# Navigate to your frontend directory
cd ~/pdf-convert-frontend

# See your current status
git status

# Abort any ongoing merge/rebase
git rebase --abort 2>/dev/null || git merge --abort 2>/dev/null || true

# Reset to clean state
git reset --hard HEAD

# Force pull your Builder.io changes
git fetch origin main
git reset --hard origin/main

# Verify you got the changes
git log --oneline -3
```

## Alternative: Clone Fresh Copy

If Git issues persist, get a fresh copy:

```bash
# Backup current (optional)
mv ~/pdf-convert-frontend ~/pdf-convert-frontend-backup

# Clone fresh with your Builder.io changes
git clone https://github.com/Disha7887/pdf-convert-frontend.git ~/pdf-convert-frontend

# Go to directory
cd ~/pdf-convert-frontend

# Check you have the latest
git log --oneline -3
```

## Verify Your Changes

After successful sync:
```bash
# Check what files changed
ls -la src/pages/

# View your updated content
cat src/pages/Body.tsx | head -20
```

## Daily Workflow Going Forward

1. **Edit in Builder.io** → Click Publish
2. **In Replit terminal**:
   ```bash
   cd ~/pdf-convert-frontend
   git fetch origin main
   git reset --hard origin/main
   ```
3. **Your Builder.io changes appear** in your project

The key is using `git reset --hard origin/main` to force-pull your Builder.io edits without merge conflicts.