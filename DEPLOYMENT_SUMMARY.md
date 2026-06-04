# ============================================================================
# MARS v3.0 - Complete Production Deployment Summary
# ============================================================================
# Railway.app Deployment - Step by Step Instructions
# Last Updated: June 4, 2026
# ============================================================================

## 🎯 Quick Overview

This document provides exact steps to deploy MARS to Railway.app production environment. After following these steps, MARS will have:

✅ Public frontend URL (React SPA served via Nginx)
✅ Private backend API (FastAPI with OpenAI integration)
✅ Persistent SQLite database (survives restarts)
✅ Persistent ChromaDB vector store (survives restarts)
✅ Automatic HTTPS/SSL certificates
✅ Health monitoring and auto-restart

---

## 📋 Prerequisites

Verify you have:

1. **GitHub Account** - Repository already set up
2. **Railway Account** - Free tier available at https://railway.app
3. **OpenAI API Key** - From https://platform.openai.com/api-keys
4. **Local Tools** (for testing):
   - Docker installed
   - Git installed

---

## 🚀 Step-by-Step Deployment

### Step 1: Verify Local Repository

```bash
# Navigate to MARS project
cd /path/to/MARS/research_platform_v2

# Check git status - should be clean
git status

# Expected output: "On branch main... nothing to commit..."
```

**If you see uncommitted changes:**
```bash
git add -A
git commit -m "Latest changes before Railway deployment"
```

### Step 2: Verify All Docker Files Present

```bash
# Check root Dockerfile exists
ls -la Dockerfile              # Must exist
ls -la Dockerfile.frontend     # Must exist
ls -la docker-compose.yml      # Reference (local)
ls -la nginx.conf             # Nginx config
ls -la railway.toml           # Railway config
```

**Expected:** All files should be listed without errors

### Step 3: Verify No Secrets in Repository

```bash
# Check for real API keys (should find nothing)
grep -r "sk-proj-" . --include="*.py" --include="*.toml" --include="*.json" 2>/dev/null

# Check .gitignore includes .env
cat .gitignore | grep ".env"

# Expected: Nothing found for API keys, .env in gitignore
```

### Step 4: Create Railway Account (If Needed)

Visit: https://railway.app

1. Click "Login with GitHub"
2. Authorize Railway to access GitHub
3. Create new project
4. SKIP "Create database" - we'll use Railway's file storage

### Step 5: Connect GitHub Repository to Railway

**In Railway Dashboard:**

1. Click "+ New Project" or your existing project
2. Click "Deploy from GitHub"
3. Select your MARS repository
4. Select `main` branch
5. Railway will:
   - Clone repository
   - Auto-detect Dockerfile at root
   - Start building backend service
   - Build may take 2-3 minutes

**Watch the build:**
```
Railway → Project → Deployments → [Latest] → Build Logs
```

Expected success:
```
[...build output...]
Successfully built image: railway/mars-backend:latest
```

### Step 6: Configure Environment Variables

**In Railway Dashboard:**

1. Go to "Variables" tab
2. Click "+ Add Variable"
3. Add the secret key:

```
Name: OPENAI_API_KEY
Value: sk-proj-your_actual_key_from_openai
Type: [X] Private (checks the SECRET checkbox)
```

4. Click "Update"
5. Service will auto-restart with new variable

**Verify it's set:**
```
Railway → Project → Variables
See: OPENAI_API_KEY ••••••••• (masked, showing it's SECRET)
```

### Step 7: Deploy Frontend

The frontend service needs separate configuration. Create it:

**In Railway Dashboard:**

1. Click "+ Add Service"
2. Select "Deploy from Git"  OR  "Create new service"
3. If prompted:
   - Repository: your MARS repo
   - Branch: main
   - Dockerfile: `Dockerfile.frontend`

4. Railway will build frontend (3-5 minutes)

**Watch the build:**
```
Railway → Deployments → Frontend → Build Logs
```

### Step 8: Configure Backend-Frontend Networking

Railroad automatically creates internal networking. Nginx needs to find the backend:

**Update nginx.conf for Production:**

Edit: `nginx.conf`

Find the section:
```nginx
upstream backend_api {
    server backend:8000;    # This is for docker-compose
    keepalive 32;
}
```

FOR RAILWAY, check if this needs updating. In most cases, Railway's internal DNS (`mars-backend:8000`) works automatically if the service name is `mars-backend`.

**To verify service name in Railway:**
- Railway Dashboard → Select Backend Service → Settings → Service Name

If it's `mars-backend`, nginx.conf is already correct.

### Step 9: Test Backend Health

```bash
# Get backend URL from Railway dashboard
# Railway → Backend Service → Domain

# Test health endpoint
curl https://mars-backend-xxx.railway.app/health

# Expected response:
# {"status":"ok","version":"3.0.0","uptime":123.45}
```

### Step 10: Test Frontend

```bash
# Get frontend URL from Railway dashboard
# Railway → Frontend Service → Domain

# Open in browser
https://mars-frontend-xxx.railway.app

# Expected: React app loads with no console errors
```

### Step 11: Test Full Integration

1. **Open Frontend URL in Browser**
   - https://mars-frontend-xxx.railway.app

2. **Check Browser Console (F12)**
   - Network tab → No failed requests
   - Console tab → No red error messages

3. **Try a Research Query**
   - Click "Research"
   - Enter a query (e.g., "climate change impacts")
   - Click "Start Research"
   - Expected: Progress updates appear

4. **Verify API Calls**
   - Browser Network tab → Filter "api"
   - Should see: GET/POST to `/api/v1/*`
   - Status should be: 200 OK

### Step 12: Test Data Persistence

```bash
# In Railway Dashboard:
1. Backend Service → Deployments → Current
2. Click the three dots (•••) → Restart

# Service will restart (takes ~30 seconds)

# Then:
1. Open frontend: https://mars-frontend-xxx.railway.app
2. Go to History
3. Expected: Your previous research is still there
```

---

## 🔧 Configuration Reference

### Backend Service Settings

**Railway Dashboard Path:**
```
Project → Services → mars-backend → Settings
```

| Setting | Value |
|---------|-------|
| Builder | Dockerfile |
| Dockerfile | `Dockerfile` |
| Start Command | (auto, via railway.toml) |
| Port | 8000 (internal) |
| Health Check | GET /health |
| Restart Policy | On Failure (auto) |
| CPU | 0.5-1.0 (default) |
| Memory | 512MB (default) |

### Frontend Service Settings

**Railway Dashboard Path:**
```
Project → Services → mars-frontend → Settings
```

| Setting | Value |
|---------|-------|
| Builder | Dockerfile |
| Dockerfile | `Dockerfile.frontend` |
| Port | 80 (internal), 443 (public) |
| Health Check | GET / |
| Restart Policy | On Failure (auto) |
| CPU | 0.5 (default) |
| Memory | 256MB (default) |

### Environment Variables

**Railway Dashboard Path:**
```
Project → Settings → Variables
```

| Variable | Value | Type | Required |
|----------|-------|------|----------|
| OPENAI_API_KEY | sk-proj-... | SECRET | ✅ YES |
| LLM_MODEL | gpt-4o | Public | ✅ From railway.toml |
| MAX_PAPERS_PER_QUERY | 15 | Public | (default) |
| ... | ... | ... | (15 more from railway.toml) |

---

## 📊 Monitoring & Troubleshooting

### View Logs

**Real-time logs:**
```bash
# Via Railway CLI
railway login
railway logs --service mars-backend

# Via Dashboard
Railway → Section → Service → Logs
```

**Expected logs (normal):**
```
INFO: Application startup complete
INFO: Uvicorn running on 0.0.0.0:8000
INFO: 127.0.0.1:xxxxx - "GET /health HTTP/1.1" 200 OK
```

### Common Issues & Fixes

| Problem | Cause | Solution |
|---------|-------|----------|
| "Build failed" | Docker syntax error | Check Dockerfile locally: `docker build -f Dockerfile .` |
| Backend won't start | Missing OPENAI_API_KEY | Add to Railway Variables as SECRET |
| Frontend can't reach backend | Wrong service name | Check nginx.conf upstream, verify service name in Railway |
| 500 errors on API | Python error | Check backend logs for stack traces |
| No data after restart | Wrong database path | Check DATABASE_URL in railway.toml (must be `/app/data/...`) |
| Slow performance | Resource limits | Railway → Settings → Increase CPU/Memory |

### Check System Health

```bash
# View health endpoint
curl https://mars-backend-xxx.railway.app/health

# Expected: 200 OK with JSON response

# View API docs (useful for testing)
curl https://mars-backend-xxx.railway.app/docs

# Expected: 200 OK with Swagger UI
```

---

## 📤 Updating Production

After deployment, to update the application:

```bash
# Make code changes locally
# Test locally:
docker-compose up    # Verify everything works

# Commit changes
git add -A
git commit -m "Update: [brief description]"

# Push to GitHub (triggers Railway rebuild)
git push origin main

# Watch deployment in Railway Dashboard
# → Deployments → New deployment should start automatically
```

---

## 🔐 Security Checklist

- [ ] OPENAI_API_KEY added to Railway Variables as SECRET
- [ ] .env file in .gitignore (never committed to GitHub)
- [ ] No hardcoded API keys in source code
- [ ] No secrets in docker images
- [ ] HTTPS enforcement (Railway automatic)
- [ ] CORS configured in backend (allow_origins in FastAPI)
- [ ] Input validation in API endpoints

---

## 📋 Final Deployment Verification

Run through this checklist to ensure production is working:

**Backend Service:**
- [ ] Service status is "green" (healthy)
- [ ] Build succeeded (0 errors in build log)
- [ ] Can reach https://mars-backend-xxx.railway.app/health
- [ ] Health endpoint returns 200 with {"status":"ok"}
- [ ] API docs accessible at /docs

**Frontend Service:**
- [ ] Service status is "green" (healthy)
- [ ] Build succeeded (0 npm errors)
- [ ] Frontend loads at https://mars-frontend-xxx.railway.app
- [ ] Browser console has no red errors
- [ ] React DevTools shows app mounted

**Integration:**
- [ ] Frontend can make API calls to backend
- [ ] Network tab shows /api/* requests returning 200
- [ ] Research queries work end-to-end
- [ ] History page shows previous research sessions

**Data Persistence:**
- [ ] Database files exist in /app/data/
- [ ] Create test research, restart service, verify data persists
- [ ] ChromaDB vectors persist across restarts

**Environment:**
- [ ] OPENAI_API_KEY is set and masked (SECRET)
- [ ] All 16 config variables present in Variables tab
- [ ] No errors in backend logs about missing variables

---

## 🎉 Success!

If all checks pass, your production deployment is complete!

### Public URLs

Share with users:
```
📱 Application: https://mars-frontend-xxx.railway.app
```

Internal URLs (for debugging):
```
🔧 Backend API: https://mars-backend-xxx.railway.app
📚 API Docs: https://mars-backend-xxx.railway.app/docs
❤️  Health: https://mars-backend-xxx.railway.app/health
```

### Next Steps

1. **Share public URL** with users
2. **Monitor logs** regularly
3. **Scale resources** if needed (CPU/Memory)
4. **Set up alerts** for downtime
5. **Configure custom domain** (optional, via Railway)

---

## 📚 Reference Documentation

- **Architecture & Networking:** See `RAILWAY_ARCHITECTURE.md`
- **Detailed Deployment Steps:** See `RAILWAY_DEPLOYMENT.md`
- **Automation Script:** See `deploy-railway.sh`
- **Railway Documentation:** https://docs.railway.app

---

## 📞 Support

**If something breaks:**

1. Check Railway logs first:
   ```bash
   railway logs
   ```

2. Verify environment variables:
   ```
   Railway Dashboard → Variables
   ```

3. Check local Docker build:
   ```bash
   docker build -f Dockerfile .
   docker build -f Dockerfile.frontend .
   ```

4. Review GitHub repo:
   ```bash
   git log --oneline -10
   git status
   ```

---

**Deployment created on:** June 4, 2026
**Status:** ✅ Production Ready

---
