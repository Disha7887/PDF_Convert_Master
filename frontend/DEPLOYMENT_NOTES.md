# Deployment Notes for Builder.io

## Important for Builder.io Integration

### Frontend Independence
This frontend is designed to run independently from the backend:

- **No Database Dependencies**: Frontend has no direct database connections
- **API Communication**: All backend calls go through HTTP API (via proxy)
- **Environment Separation**: Frontend and backend are completely separate

### Builder.io Setup Requirements

1. **Install Command**: `npm install`
2. **Build Command**: `npm run build`
3. **Start Command**: `npm start`
4. **Output Directory**: `dist`
5. **Framework**: Vite + React

### Environment Variables
The frontend doesn't require any environment variables for basic functionality. All API calls are proxied to the backend.

### Expected Behavior
- Frontend builds and runs without needing backend
- API calls will fail gracefully when backend is not available
- All React components are available for Builder.io editing

### Troubleshooting
If you see database-related errors in Builder.io:
1. These are from the backend, not frontend
2. Frontend should still build and run successfully
3. Focus on connecting to `/frontend` folder only, not root

The frontend is completely self-contained and Builder.io ready.