# PDF Converter Frontend

This is the standalone frontend for the PDF conversion tool, built with React and Vite.

## Getting Started

### Install Dependencies
```bash
npm install
```

### Development
```bash
npm run dev
```
This will start the development server on port 3000. The frontend will proxy API requests to the backend running on port 5000.

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## Builder.io Compatibility

This frontend is structured as a standalone React/Vite project for Builder.io compatibility:

- All frontend code is in this `frontend/` directory
- Has its own `package.json` with only frontend dependencies
- Uses Vite with proper configuration for Builder.io
- Proxies API calls to the backend server
- No backend/server files that could conflict with Builder.io

## Project Structure

```
frontend/
├── src/
│   ├── components/     # UI components
│   ├── pages/         # Page components
│   ├── hooks/         # Custom React hooks
│   ├── lib/           # Utilities and configuration
│   └── contexts/      # React contexts
├── public/            # Static assets
├── index.html         # Entry HTML file
├── vite.config.ts     # Vite configuration
├── tailwind.config.ts # Tailwind CSS configuration
└── package.json       # Frontend dependencies only
```

## API Integration

The frontend communicates with the backend via HTTP API calls. All API endpoints are prefixed with `/api` and proxied to the backend server running on port 5000.