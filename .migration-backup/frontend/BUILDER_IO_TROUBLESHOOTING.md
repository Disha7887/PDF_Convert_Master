# Builder.io Troubleshooting Guide

## Issue: Proxy Error (http://localhost:5000/)

### Problem
Builder.io shows "Configured local server (http://localhost:5000/) is not responding" because it's trying to connect to the Replit backend, which isn't available in Builder.io's environment.

### Solution
The frontend is designed to work independently in Builder.io:

1. **For Builder.io**: API calls will fail gracefully (expected behavior)
2. **For Development**: API proxy works when Replit backend is running
3. **Components Available**: All React components can be edited visually

### Expected Behavior in Builder.io
- ✅ Frontend builds successfully
- ✅ All components load for visual editing
- ❌ API calls fail (expected - backend not available)
- ✅ Static content and UI components work perfectly

### Scripts That Work in Builder.io
```bash
npm install    # ✅ Installs dependencies
npm run build  # ✅ Builds frontend
npm start      # ✅ Serves built files
```

### Development vs Builder.io

| Feature | Development (Replit) | Builder.io |
|---------|---------------------|------------|
| Frontend | ✅ Works | ✅ Works |
| Backend API | ✅ Available | ❌ Not available |
| Component Editing | ✅ Works | ✅ Works |
| Visual Building | ✅ Works | ✅ Works |

### Recommendation
Ignore the proxy error in Builder.io - focus on visual component editing. The frontend is fully functional for Builder.io's purposes.