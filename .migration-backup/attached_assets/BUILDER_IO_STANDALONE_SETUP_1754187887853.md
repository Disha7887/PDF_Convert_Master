# Builder.io Standalone Frontend Setup Guide

## Option 1: Create Separate Repository (Recommended)

### Step 1: Download Frontend Files
Download these files from your current `/frontend` folder to create a new repository:

**Required Files:**
```
frontend/
├── src/                     # All React components and pages
├── public/                  # Static assets
├── package.json            # Dependencies and scripts
├── vite.config.ts          # Vite configuration
├── tailwind.config.ts      # Tailwind CSS config
├── postcss.config.js       # PostCSS config
├── tsconfig.json           # TypeScript config
├── index.html              # Main HTML file
├── .env.example            # Environment variables template
├── components.json         # shadcn/ui config
└── README.md               # Documentation
```

### Step 2: Create New Repository
1. Create new GitHub repository named `pdf-converter-frontend`
2. Upload all files from `/frontend` folder to the new repository
3. Initialize with the package.json from frontend folder

### Step 3: Builder.io Configuration
Use these settings in Builder.io:

```
Project Name: PDF_Convert_Frontend
Framework Preset: React
Development Server Port: 3000
Setup Script: npm install
Development Server Command: npm run dev
Main Branch Name: main
Repository URL: [your-new-frontend-repo-url]
```

## Option 2: Use Current Repository with Subfolder

### Builder.io Settings for Current Repo:
```
Project Name: PDF_Convert_Master
Framework Preset: React
Development Server Port: 3000
Setup Script: cd frontend && npm install
Development Server Command: cd frontend && npm run dev
Main Branch Name: main
Build Command: cd frontend && npm run build
Build Output Directory: frontend/dist
```

### Expected Behavior:
- ✅ Frontend will build and run successfully
- ❌ API calls will fail (this is expected and OK)
- ✅ All components available for visual editing
- ✅ Styling and layout work perfectly

## Recommendation
**Use Option 1** (separate repository) for cleanest Builder.io integration without any backend interference.