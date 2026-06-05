# Frontend Deployment Summary

## Changes Made to Enable Render Deployment

### 1. Frontend API Client Configuration
**File**: [frontend/src/api/client.ts](frontend/src/api/client.ts)

```typescript
// BEFORE: Hardcoded localhost
const BASE = 'http://localhost:8000/api/v1';

// AFTER: Uses environment variable
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
const BASE = `${BACKEND_URL}/api/v1`;
```

**Impact**: 
- Frontend can now point to any backend URL
- Configurable at build time via environment variable
- Defaults to localhost for local development

---

### 2. Docker Build Configuration
**File**: [Dockerfile.frontend](Dockerfile.frontend)

Added Docker build argument support:

```dockerfile
# Build argument - backend URL can be passed during build
ARG REACT_APP_BACKEND_URL=http://localhost:8000

# Set as environment variable for React build
ENV REACT_APP_BACKEND_URL=${REACT_APP_BACKEND_URL}
```

**Impact**:
- Dockerfile.frontend now accepts `--build-arg REACT_APP_BACKEND_URL=...`
- Render can pass this argument during image build
- The URL is baked into the compiled React app at build time

---

### 3. Backend CORS Configuration ✓ (Already Configured)
**File**: `backend/main.py`

Already has proper CORS configuration:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Currently allows all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Status**: ✓ No changes needed
**Note**: For max security in production, could restrict to frontend URL only

---

### 4. Nginx Configuration ✓ (No Changes Needed for Render)
**File**: [nginx.conf](nginx.conf)

**Current Status**: 
- Already configured for serving React SPA with proper fallback to `index.html`
- Has proper security headers and caching
- API proxy is set up for local docker-compose
- Will work as-is for Render deployment since frontend makes direct API calls

**No changes needed**.

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        User's Browser                           │
│                                                                 │
│  https://mars-frontend-xxxxx.onrender.com                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                 (HTTP Request for UI)
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Frontend Service (Render)                      │
│                                                                 │
│  • Nginx serves React build (static files)                      │
│  • React app bundled with REACT_APP_BACKEND_URL set            │
│  • SPA routing handled by index.html fallback                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
              (fetch('https://mars-i690.onrender.com/api/v1/...'))
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Backend Service (Render)                       │
│                                                                 │
│  https://mars-i690.onrender.com                                │
│  • FastAPI app with CORS enabled                               │
│  • Processes research queries                                  │
│  • Calls OpenAI & ChromaDB                                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Manual Steps in Render Dashboard

### Complete Checklist for Frontend Deployment

#### **Step 1: Create New Web Service**
- [ ] Go to https://dashboard.render.com
- [ ] Click "New +" → "Web Service"
- [ ] Connect GitHub repository (select main branch)
- [ ] Look for the repository containing this project

#### **Step 2: Basic Configuration**
- [ ] **Name**: `mars-frontend` (or desired name)
- [ ] **Environment**: `Docker`
- [ ] **Region**: `US East` (or same as backend)
- [ ] **Branch**: `main`
- [ ] **Dockerfile path**: `Dockerfile.frontend` ← Important!
- [ ] **Docker context**: `.`

#### **Step 3: Environment Variables** ← CRITICAL
In the "Environment" section, add:

| Key | Value |
|-----|-------|
| `REACT_APP_BACKEND_URL` | `https://mars-i690.onrender.com` |

This must match your backend deployment URL exactly.

#### **Step 4: Instance Settings**
- [ ] **Plan**: 
  - Free: ✓ Works for demo/testing
  - Paid: ✓ Recommended for production (better resources)
- [ ] **Instance Type**: Standard
- [ ] **Max instances**: 1-2 (static files don't need scaling)

#### **Step 5: Deploy**
- [ ] Click "Create Web Service"
- [ ] Monitor build logs (should complete in 2-5 minutes)
- [ ] Wait for deployment to complete
- [ ] Render assigns URL: `https://mars-frontend-xxxxx.onrender.com`

#### **Step 6: Post-Deployment Verification**
- [ ] Frontend loads: `https://mars-frontend-xxxxx.onrender.com` ✓
- [ ] No 404 errors on static assets ✓
- [ ] Backend health check: `curl https://mars-i690.onrender.com/health` ✓
- [ ] Test query in UI and check Network tab (requests go to mars-i690.onrender.com) ✓
- [ ] No CORS errors in browser console ✓

---

## Testing the Deployment

### 1. Frontend Loads
```bash
curl -I https://mars-frontend-xxxxx.onrender.com
# Should return 200 OK
```

### 2. Backend Accessible
```bash
curl https://mars-i690.onrender.com/health
# Should return: {"status": "ok", "version": "3.0.0"}
```

### 3. Verify Backend URL in Frontend
Open browser DevTools → Application → Storage → Cookies
Or use console:
```javascript
// In browser console on frontend
fetch('/api/v1/health')
  .then(r => r.json())
  .then(d => console.log(d))
```

This will call the backend URL that was baked into the build.

### 4. Full User Flow Test
1. Open frontend in browser
2. Navigate to "Research" page
3. Enter a research query
4. Click "Submit"
5. Monitor Network tab:
   - Should see requests to `https://mars-i690.onrender.com/api/v1/run_query`
   - Should see responses coming back
   - Pipeline tracker should show progress
6. Results should display correctly

---

## Troubleshooting Guide

| Issue | Cause | Solution |
|-------|-------|----------|
| Build fails in Render | Dockerfile path incorrect | Verify `Dockerfile.frontend` in root, not `Dockerfile` |
| API calls return 404 | Backend URL not set in env | Add `REACT_APP_BACKEND_URL` to Render environment vars |
| CORS error in console | Mismatched frontend/backend URLs | Verify `REACT_APP_BACKEND_URL` matches backend URL exactly |
| Frontend loads but API fails | Backend URL hardcoded to localhost | Verify changes to `frontend/src/api/client.ts` are committed |
| Nginx health check fails | React app not building correctly | Check Render build logs for npm/TypeScript errors |
| Blank page loads | Static files not served | Verify nginx config and React build output exists |

---

## File Changes Reference

| File | Change | Status |
|------|--------|--------|
| `frontend/src/api/client.ts` | Uses `REACT_APP_BACKEND_URL` env var | ✓ Done |
| `Dockerfile.frontend` | Added `ARG REACT_APP_BACKEND_URL` | ✓ Done |
| `backend/main.py` | CORS already configured | ✓ No changes needed |
| `nginx.conf` | Ready for production use | ✓ No changes needed |

---

## Environment Variables Reference

### For Local Development
```bash
# .env file (not used by default, but for reference)
REACT_APP_BACKEND_URL=http://localhost:8000
```

### For Docker Compose (Local)
```bash
# No env needed, defaults to localhost:8000
docker build -f Dockerfile.frontend .
```

### For Render Deployment
```bash
# Set in Render dashboard Environment section
REACT_APP_BACKEND_URL=https://mars-i690.onrender.com
```

---

## Backend CORS Configuration

**Current Status**: ✓ Already configured to accept all origins

To restrict to only frontend in future:
```python
# In backend/main.py
frontend_url = os.getenv(
    "FRONTEND_URL", 
    "http://localhost:3000"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        frontend_url,
        "http://localhost:3000",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Next Steps After Frontend Deployment

1. **Point custom domain** (optional)
   - In Render dashboard → Custom domains
   - Add your domain name (e.g., `research.example.com`)

2. **Set up monitoring** (optional)
   - Enable alerts in Render for deployment failures
   - Monitor backend logs for API errors

3. **Enable auto-deploys** (recommended)
   - In Render dashboard → Deploy hooks
   - Add GitHub webhook for automatic deploys on push

4. **Backup configuration**
   - Export environment variables from Render
   - Keep notes of deployment settings

---

## Quick Reference: What Gets Deployed

### Frontend Container Includes
- ✓ React TypeScript application (compiled)
- ✓ All static assets (CSS, images, fonts)
- ✓ Nginx web server
- ✓ Backend URL baked in at build time

### Frontend Does NOT Include
- ✗ Node.js (only used for build, removed in final image)
- ✗ Source TypeScript/JSX files
- ✗ node_modules (only used for build)
- ✗ Development tools

### Total Image Size
- ~25-30 MB (optimized multi-stage build)

---

## Rollback Procedure

If deployment has issues:

1. Go to Render dashboard
2. Select `mars-frontend` service
3. Click "Deploys" tab
4. Find the working deployment
5. Click "Redeploy" on that version

This will instantly rollback to the previous working version without rebuilding.
