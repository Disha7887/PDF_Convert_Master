# Standalone Frontend Deployment Instructions

## Creating a Builder.io-Ready Repository

### Files to Copy for New Repository

**Essential Configuration Files:**
- `package.json` - Dependencies and build scripts
- `vite.config.ts` - Vite configuration
- `tailwind.config.ts` - Tailwind CSS setup
- `postcss.config.js` - PostCSS configuration  
- `tsconfig.json` - TypeScript configuration
- `components.json` - shadcn/ui component configuration

**Application Files:**
- `index.html` - Main HTML entry point
- `src/` - All React components, pages, hooks, contexts
- `public/` - Static assets and images

**Documentation:**
- `README.md` - Setup and build instructions
- `.env.example` - Environment variable template

### New Repository Structure
```
pdf-converter-frontend/
├── src/
│   ├── components/         # UI components
│   ├── pages/             # Page components  
│   ├── hooks/             # Custom React hooks
│   ├── contexts/          # React contexts
│   ├── lib/               # Utilities
│   ├── App.tsx            # Main app component
│   ├── main.tsx           # React entry point
│   └── index.css          # Global styles
├── public/
│   └── figmaAssets/       # Design assets
├── package.json           # Frontend dependencies only
├── vite.config.ts         # Vite configuration
├── tailwind.config.ts     # Tailwind setup
├── index.html             # HTML template
└── README.md              # Setup instructions
```

### Builder.io Configuration for New Repo
```
Framework: React + Vite
Install: npm install
Dev: npm run dev
Build: npm run build
Port: 3000
Output: dist/
```

### Benefits of Separate Repository
1. **Clean Separation** - No backend files to confuse Builder.io
2. **Faster Setup** - Smaller repository, faster clone/install
3. **No Proxy Issues** - Frontend runs independently
4. **Easier Deployment** - Standard React/Vite deployment