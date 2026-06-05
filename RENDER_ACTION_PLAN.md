# ⚡ RENDER FRONTEND DEPLOYMENT - ACTION PLAN

## What's Been Done ✓

### Code Changes (Ready to Deploy)
1. **✓ Frontend API Client** - Now uses `REACT_APP_BACKEND_URL` environment variable
   - File: [frontend/src/api/client.ts](frontend/src/api/client.ts)
   - Falls back to `http://localhost:8000` for local development
   - Uses `https://mars-i690.onrender.com` when set in environment

2. **✓ Docker Configuration** - Accepts backend URL as build argument
   - File: [Dockerfile.frontend](Dockerfile.frontend)
   - Build arg: `REACT_APP_BACKEND_URL` (defaults to localhost)
   - Ready to receive `--build-arg REACT_APP_BACKEND_URL=https://mars-i690.onrender.com`

3. **✓ Backend CORS** - Already configured correctly
   - File: `backend/main.py`
   - Allows `*` origins (all requests accepted)
   - No changes needed

4. **✓ Nginx Configuration** - Production-ready
   - File: [nginx.conf](nginx.conf)
   - Serves React SPA correctly
   - Frontend makes direct API calls (no proxying needed)
   - No changes needed

---

## What You Need to Do in Render Dashboard 📋

### Step-by-Step Instructions

#### **1. Go to Render Dashboard**
- URL: https://dashboard.render.com
- Make sure you're logged in

#### **2. Create New Web Service**
- Click blue **"New +"** button (top-right)
- Select **"Web Service"**

#### **3. Connect Repository**
- Select your GitHub repository
- Choose **`main`** branch (or your deployment branch)
- Click "Connect"

#### **4. Configure Service** - FILL IN THESE FIELDS:

| Field | Input |
|-------|-------|
| **Name** | `mars-frontend` |
| **Environment** | `Docker` ← Select this |
| **Region** | `US East` (or same as backend) |
| **Dockerfile path** | `Dockerfile.frontend` ← Important! |
| **Docker context** | `.` |
| **Build command** | *(leave empty)* |
| **Start command** | *(leave empty)* |

#### **5. Set Environment Variable** ⭐ CRITICAL STEP
- Scroll to **"Environment"** section
- Click **"Add Environment Variable"**
- Fill in:
  - **Key**: `REACT_APP_BACKEND_URL`
  - **Value**: `https://mars-i690.onrender.com`
- Click **"Save"**

#### **6. Choose Plan**
- **Free**: Works fine for testing
- **Paid**: Recommended for production ($7/month+)
- Select and continue

#### **7. Review & Create**
- Click **"Create Web Service"**
- Wait for build to complete (~2-5 minutes)
- Monitor the **"Logs"** tab

#### **8. Get Your Frontend URL**
Once deployed successfully:
- Render assigns: `https://mars-frontend-xxxxx.onrender.com`
- This is your new frontend URL

#### **9. Update Any External References** (e.g., DNS, documentation)
If you have a custom domain:
- In Render: **Settings** → **Custom domains**
- Add your domain (e.g., `research.example.com`)
- Follow DNS setup instructions

---

## Verification Checklist ✅

After deployment, verify everything works:

### 1. Frontend Loads
```bash
curl https://mars-frontend-xxxxx.onrender.com
# Should return HTML, not errors
```

### 2. Backend Is Reachable
```bash
curl https://mars-i690.onrender.com/health
# Should return: {"status": "ok", "version": "3.0.0"}
```

### 3. Test in Browser
- Open: `https://mars-frontend-xxxxx.onrender.com`
- Press **F12** to open Developer Tools
- Go to **"Console"** tab (check for errors)
- Go to **"Network"** tab
- Try running a research query
- Watch Network tab - requests should go to `mars-i690.onrender.com`
- Should see responses like: `200 OK`

### 4. Full Feature Test
- [ ] Frontend UI loads without errors
- [ ] Can navigate between pages
- [ ] Can submit a research query
- [ ] Results display in pipeline tracker
- [ ] Results display on report page
- [ ] Can export BibTeX
- [ ] No CORS errors in console
- [ ] No "localhost" references in Network tab

---

## Deployment URL Formats

| Component | URL |
|-----------|-----|
| Frontend | `https://mars-frontend-xxxxx.onrender.com` |
| Backend | `https://mars-i690.onrender.com` |
| Backend Health | `https://mars-i690.onrender.com/health` |
| Backend API | `https://mars-i690.onrender.com/api/v1/...` |

---

## Environment Variable Explanation

```
┌──────────────────────────────────────────────────────────┐
│  REACT_APP_BACKEND_URL=https://mars-i690.onrender.com   │
│                                                          │
│  This variable is used at BUILD TIME (not runtime)      │
│  It gets compiled into the React JavaScript bundle      │
│                                                          │
│  Result: When users run queries, the frontend will      │
│  call: https://mars-i690.onrender.com/api/v1/run_query │
└──────────────────────────────────────────────────────────┘
```

**If you change this later:**
1. Update in Render dashboard → Environment
2. Trigger a new build (click "Redeploy")
3. Wait ~2-5 minutes for new build to complete

---

## Rollback Plan (If Something Goes Wrong)

1. In Render dashboard, click **"Deploys"** tab
2. Find the previous successful deployment
3. Click **"Redeploy"** on that version
4. Instantly reverts to working state

---

## Common Issues & Solutions

### ❌ "Cannot GET /" - Nginx Not Serving Frontend
**Solution**: Check build logs. React build might have failed during Docker build.

### ❌ API Calls Fail with CORS Error
**Solution**: 
- Verify `REACT_APP_BACKEND_URL` is set correctly in Render
- Trigger a new deploy (redeploy)
- Wait for rebuild to complete

### ❌ API Calls Go to Localhost Instead of Backend
**Solution**: 
- Environment variable not set or not reloaded
- Manually trigger "Redeploy" in Render dashboard

### ❌ Backend Endpoint Returns 404
**Solution**: 
- Backend service not running on Render
- Check backend service logs in Render dashboard
- Verify backend URL: https://mars-i690.onrender.com/health

### ❌ Build Fails - "Dockerfile.frontend not found"
**Solution**: 
- Check that `Dockerfile.frontend` exists in root of repo
- Verify path in Render: `Dockerfile.frontend` (not `frontend/Dockerfile`)

---

## After Frontend Is Deployed

### Optional Enhancements

1. **Custom Domain** (if you have one)
   - In Render: Settings → Custom Domains
   - Add your domain
   - Configure DNS records as directed

2. **Auto-Deploys** (so updates push automatically)
   - In Render: Deploy → Webhook
   - Add to your GitHub repository settings
   - Every push to main branch deploys automatically

3. **Monitoring**
   - Enable email alerts for deployment failures
   - Monitor error rate in Render dashboard

4. **Database Backups** (for backend)
   - Already managed by Render for backend
   - No action needed

---

## Final Checklist Before Clicking "Create"

- [ ] Repository is public or Render has access
- [ ] Main branch has all latest changes committed
- [ ] `Dockerfile.frontend` exists in project root
- [ ] Backend URL in Render env var: `https://mars-i690.onrender.com`
- [ ] Region matches backend region (US East recommended)
- [ ] Read RENDER_FRONTEND_DEPLOYMENT.md for detailed info

---

## Support Documents

For more detailed information:

1. **[RENDER_FRONTEND_DEPLOYMENT.md](RENDER_FRONTEND_DEPLOYMENT.md)** - Complete deployment guide
2. **[FRONTEND_DEPLOYMENT_CHECKLIST.md](FRONTEND_DEPLOYMENT_CHECKLIST.md)** - Detailed checklist with troubleshooting
3. **[Dockerfile.frontend](Dockerfile.frontend)** - Frontend Docker configuration
4. **[nginx.conf](nginx.conf)** - Nginx web server configuration
5. **[DOCKER_DEPLOYMENT_GUIDE.md](DOCKER_DEPLOYMENT_GUIDE.md)** - General Docker info

---

## Time Estimate
- **Setup in Render**: 2-3 minutes
- **Build time**: 2-5 minutes
- **Deployment**: 1 minute
- **Total**: ~5-10 minutes to go live

---

## Quick Reference: What Changed

```diff
# frontend/src/api/client.ts
- const BASE = 'http://localhost:8000/api/v1';
+ const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
+ const BASE = `${BACKEND_URL}/api/v1`;

# Dockerfile.frontend
+ ARG REACT_APP_BACKEND_URL=http://localhost:8000
+ ENV REACT_APP_BACKEND_URL=${REACT_APP_BACKEND_URL}
```

That's it! Everything else is ready to go.

---

## Questions?

Reference the detailed deployment guides for:
- Troubleshooting specific issues
- Understanding the architecture
- Verifying deployment
- Monitoring and scaling

**Status**: ✅ Ready for deployment to Render
