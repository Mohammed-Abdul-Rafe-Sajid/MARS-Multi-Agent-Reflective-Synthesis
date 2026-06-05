# Render Frontend Deployment Guide

## Architecture Overview

```
User (Browser)
    ↓
Frontend (Render) - https://your-frontend.onrender.com
    ↓
Backend (Render) - https://mars-i690.onrender.com
    ↓
OpenAI + ChromaDB
```

## Summary of Changes Made

### 1. **Frontend API Client** (`frontend/src/api/client.ts`)
- **Before**: Hardcoded to `http://localhost:8000/api/v1`
- **After**: Uses `REACT_APP_BACKEND_URL` environment variable
- Defaults to `http://localhost:8000` for local development
- In production on Render: Will be set to `https://mars-i690.onrender.com/api/v1`

### 2. **Docker Build Configuration** (`Dockerfile.frontend`)
- Added `ARG REACT_APP_BACKEND_URL` build argument
- Defaults to `http://localhost:8000` for docker-compose
- Supports passing custom URL: `--build-arg REACT_APP_BACKEND_URL=https://mars-i690.onrender.com`

## Manual Steps in Render Dashboard

Follow these steps to deploy the frontend on Render:

### Step 1: Create a New Web Service

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository (if not already connected)
4. Select the repository and branch (`main` or your deployment branch)

### Step 2: Configure Build Settings

| Setting | Value |
|---------|-------|
| **Name** | `mars-frontend` (or your preferred name) |
| **Environment** | `Docker` |
| **Region** | Same as backend (recommended: US-East) |
| **Branch** | `main` (or your deployment branch) |
| **Dockerfile path** | `Dockerfile.frontend` |
| **Docker Context** | `.` (root directory) |

### Step 3: Configure Environment Variables

In the **Environment** section, add:

| Key | Value |
|-----|-------|
| `REACT_APP_BACKEND_URL` | `https://mars-i690.onrender.com` |

**Important**: This value is used at **build time** to compile the backend URL into the React app.

### Step 4: Configure Build & Deploy Settings

| Setting | Value |
|---------|-------|
| **Build Command** | Leave empty (Docker handles it) |
| **Start Command** | Leave empty (Docker handles it) |
| **Plan** | Free/Paid (choose based on needs) |

Recommended for production: **Paid plan** (more resources, better uptime)

### Step 5: Configure Instance Settings

| Setting | Value |
|---------|-------|
| **Instance Type** | Standard (can scale if needed) |
| **Max Instances** | 1-2 (for frontend static serving) |

### Step 6: Additional Settings

**Health Check** (optional but recommended):
- Path: `/`
- Port: `80`
- Timeout: `5 seconds`
- Check interval: `60 seconds`

**Deploy Hooks** (optional):
- Can add webhooks to trigger deploys on GitHub push

### Step 7: Deploy

1. Review all settings
2. Click **"Create Web Service"**
3. Render will start building the Docker image
4. Monitor the build logs in the **Logs** tab
5. Once deployed, you'll get a URL: `https://mars-frontend-xxxxx.onrender.com`

## Verification Steps

After deployment on Render:

### 1. Test Frontend Access
```bash
curl https://mars-frontend-xxxxx.onrender.com
# Should return HTML content of the frontend
```

### 2. Test Backend Connectivity
1. Open the frontend in browser: `https://mars-frontend-xxxxx.onrender.com`
2. Try running a research query
3. Check browser console (F12) for any errors
4. Check if requests reach the backend (look at backend logs in Render)

### 3. Check Backend Health
```bash
curl https://mars-i690.onrender.com/health
# Should return: {"status": "ok", "version": "1.0"}
```

### 4. Check API Communication
Open browser DevTools → Network tab and:
1. Run a test query in the frontend
2. Look for requests going to `https://mars-i690.onrender.com/api/v1/...`
3. Verify responses are successful (HTTP 200-201)

## Environment Variable Verification

The backend URL is baked into the frontend at build time. To verify:

1. Inspect the built JavaScript in browser DevTools
2. Search for the backend URL in `main.*.js` files
3. Should find: `https://mars-i690.onrender.com`

If you see `http://localhost:8000`, the environment variable wasn't set correctly during build.

## Troubleshooting

### Issue: Build Fails
**Solution**: 
- Check build logs in Render dashboard
- Verify `Dockerfile.frontend` path is correct
- Ensure `frontend/` directory exists in repository

### Issue: Frontend Loads But API Calls Fail
**Causes & Solutions**:
- **Missing `REACT_APP_BACKEND_URL` environment variable**
  - Re-add it in Render dashboard → Environment
  - Trigger a new deploy
- **Backend CORS not configured correctly**
  - Check backend `main.py` for CORS middleware configuration
  - Should allow requests from frontend origin
- **Backend URL is hardcoded to localhost**
  - Verify `frontend/src/api/client.ts` uses environment variable
  - Check that Dockerfile passes the ARG correctly

### Issue: CORS Errors
**Solution**:
Ensure backend's CORS configuration allows requests from the frontend URL:

```python
# In backend/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://mars-frontend-xxxxx.onrender.com",
        "http://localhost:3000",  # for local dev
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Issue: Nginx Health Check Fails
**Solution**:
If nginx health check times out:
- Render's health check might be too strict
- Check nginx error logs: `GET /` should return 200
- Frontend root `/` should serve `index.html`

## Rebuild & Redeploy

If you change the backend URL later:

1. Click **"Settings"** (in Render dashboard for this service)
2. Scroll to **"Environment"**
3. Update `REACT_APP_BACKEND_URL`
4. Click **"Save Changes"**
5. Render will automatically rebuild and deploy

Or manually trigger:
1. Go to **"Deploys"** tab
2. Click **"Deploy latest commit"**

## Production Checklist

- [ ] Frontend service created on Render
- [ ] `REACT_APP_BACKEND_URL=https://mars-i690.onrender.com` set in environment
- [ ] Build successfully completed (check Render logs)
- [ ] Frontend URL accessible and loads correctly
- [ ] Backend health endpoint responds
- [ ] Test API call from frontend works (check Network tab in DevTools)
- [ ] No CORS errors in browser console
- [ ] Research queries execute successfully
- [ ] Results display correctly on frontend
- [ ] Custom domain configured (optional)

## Backend CORS Configuration Reference

For the backend to accept requests from the frontend on Render, verify this in `backend/main.py`:

```python
from fastapi.middleware.cors import CORSMiddleware

# Allow requests from the deployed frontend
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url, "http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Docker Image Build Details

When Render builds the frontend:

```bash
docker build \
  --build-arg REACT_APP_BACKEND_URL=https://mars-i690.onrender.com \
  -f Dockerfile.frontend \
  .
```

The `REACT_APP_BACKEND_URL` is injected at build time and becomes part of the compiled JavaScript bundle, so changing it later requires a rebuild.

## Nginx Configuration Note

The current `nginx.conf` is set up for docker-compose (proxies to local `backend:8000`). For Render deployment:
- Nginx serves the React static files
- Frontend JavaScript makes direct calls to `https://mars-i690.onrender.com`
- No nginx proxying needed for API calls (frontend handles CORS)

This is cleaner than trying to proxy through nginx and avoids additional latency/complexity.
