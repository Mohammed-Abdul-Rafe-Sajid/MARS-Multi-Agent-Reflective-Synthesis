# ============================================================================
# Railway Production Deployment Guide - MARS v3.0
# ============================================================================
# Complete instructions for deploying MARS on Railway.app
# Includes backend API service and frontend static service
# ============================================================================

## Overview

Railway.app is a modern cloud platform that simplifies deployment. This guide covers:
1. **Backend Service** - FastAPI API server
2. **Frontend Service** - React/Nginx static hosting
3. **Persistent Storage** - SQLite + ChromaDB
4. **Environment Variables** - OpenAI and application config

---

## Architecture

```
Internet
  ↓
Railway (Ingress)
  ↓
Frontend Service (Nginx, Port 80/443)
  ├→ Serves React SPA (public URL)
  └→ Proxies /api/* to Backend Service
  ↓
Backend Service (FastAPI, Port 8000)
  ├→ /health - health checks
  ├→ /docs - API documentation
  ├→ /api/v1/* - API endpoints
  └→ Accesses:
      ├→ SQLite Database (persistent storage)
      ├→ ChromaDB Vector Store (persistent storage)
      └→ OpenAI API (via OPENAI_API_KEY)
```

---

## Prerequisites

1. **Railway Account** - Sign up at https://railway.app
2. **GitHub Repository** - Your MARS code (already done)
3. **OpenAI API Key** - From https://platform.openai.com/api-keys

---

## Step 1: Deploy Backend Service

### 1.1 Create Backend Service in Railway

```bash
# Via Railway CLI
railway login
railway init

# Via Railway Dashboard
# 1. Go to https://railway.app
# 2. Click "Create New Project"
# 3. Select "Deploy from GitHub"
# 4. Connect your MARS repository
# 5. Select the main branch
```

### 1.2 Configure Backend Service

**In Railway Dashboard:**

1. **Service Name**: `mars-backend`
2. **Dockerfile**: `Dockerfile` (root level, automatically detected)
3. **Port**: Let Railway assign automatically, or set to 8000

### 1.3 Set Environment Variables (Railway Variables)

In Railway Dashboard → Project Settings → Variables:

```
# REQUIRED - Secret Variable
OPENAI_API_KEY = sk-proj-your_actual_api_key_here

# LLM Configuration
LLM_MODEL = gpt-4o
LLM_MAX_TOKENS = 4096

# Retrieval Settings
MAX_PAPERS_PER_QUERY = 15
TOP_K_RAG_CHUNKS = 5
PAPER_AGE_CUTOFF_YEARS = 10
RAG_SIMILARITY_THRESHOLD = 0.60
DEFAULT_ABLATION_MODE = both

# Reflection Engine
MAX_ITERATIONS = 4
CLAIM_DELTA_THRESHOLD = 0.10
WEAK_CLAIM_RATIO_THRESHOLD = 0.30

# Verifier Thresholds
SIMILARITY_VERIFIED_THRESHOLD = 0.75
SIMILARITY_WEAK_THRESHOLD = 0.60
MIN_SUPPORTING_PAPERS = 2

# RAG / Chunking
CHUNK_SIZE_TOKENS = 512
CHUNK_OVERLAP_TOKENS = 50
EMBEDDING_MODEL = text-embedding-3-small

# Database paths (Railroad-specific)
DATABASE_URL = sqlite:///./data/research_system.db
CHROMA_PERSIST_DIR = /app/data/chromadb_store
```

### 1.4 Deploy Backend

```bash
# Push to GitHub triggers automatic Railway deployment
git push origin main

# OR manual trigger via Railway Dashboard
# Railway → Project → Deployments → Deploy
```

**Expected Output:**
- Build succeeds (2-3 minutes)
- Backend service goes online
- Public URL assigned (e.g., `mars-backend-prod.railway.app`)
- Health endpoint: `https://mars-backend-prod.railway.app/health`

---

## Step 2: Deploy Frontend Service

### 2.1 Create Frontend Service in Railway

**Option A: Via CLI (Recommended)**

```bash
# Create separate Railway service for frontend
railway service add mars-frontend --dockerfile Dockerfile.frontend

# OR navigate Railway dashboard → Add Service
```

### 2.2 Configure Frontend Service

**Service Configuration:**
- **Name**: `mars-frontend`
- **Dockerfile**: `Dockerfile.frontend` (if Railway asks)
- **Port**: 80 (Nginx)
- **Build Context**: `.` (root of repository)

### 2.3 Frontend Environment Variables

In Railway → mars-frontend → Variables:

```
# None required for frontend (it's static + Nginx)
# But if serving React with env vars:
VITEapi_URL=https://mars-backend-prod.railway.app/api
```

### 2.4 Update Nginx Configuration for Production

Edit `nginx.conf` to point to Railway backend:

```nginx
# Instead of localhost, use Railway backend domain
upstream backend_api {
    server mars-backend-prod.railway.app;  # Replace with actual Railway domain
    keepalive 32;
}
```

**Get Backend Domain:**
- Railway Dashboard → mars-backend → Settings → Domain

### 2.5 Deploy Frontend

```bash
git push origin main
```

**Expected Output:**
- Frontend builds (3-5 minutes with npm)
- Nginx spins up
- Public frontend URL assigned (e.g., `mars-frontend-prod.railway.app`)

---

## Step 3: Configure Networking

### 3.1 Cross-Service Communication

Railway automatically creates internal networking. Backend and Frontend can communicate via:

```
Backend URL (internally): http://mars-backend:8000
Frontend can access: http://mars-backend:8000/api/*
```

### 3.2 Update Nginx to Use Railway Internal Network

Edit `nginx.conf`:

```nginx
upstream backend_api {
    # Railway internal service name
    server mars-backend:8000;
    keepalive 32;
}

location /api/ {
    proxy_pass http://backend_api;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Host $host;
}
```

---

## Step 4: Persistent Storage

### 4.1 SQLite Database

Railway automatically provides persistent volumes. Files at:
- `/app/data/research_system.db` - persisted
- `/app/chromadb_store/` - persisted

**Important**: These paths are preserved across restarts. No additional config needed.

### 4.2 ChromaDB Vectors

ChromaDB directory is automatically persisted at `/app/data/chromadb_store`

**Verify Persistence:**
1. Deploy backend
2. Create research session via API
3. Restart service (Railway Dashboard → Redeploy)
4. Verify data is still there

---

## Step 5: Verify Deployment

### 5.1 Test Backend

```bash
# Get backend URL from Railway dashboard
BACKEND_URL=https://mars-backend-prod.railway.app

# Test health
curl $BACKEND_URL/health
# Expected: {"status":"ok","version":"3.0.0"}

# Test API docs
curl $BACKEND_URL/docs
# Expected: 200 OK (Swagger UI)
```

### 5.2 Test Frontend

```bash
# Get frontend URL from Railway dashboard
FRONTEND_URL=https://mars-frontend-prod.railway.app

# Test homepage
curl $FRONTEND_URL
# Expected: 200 OK (React app HTML)

# Test API proxy
curl $FRONTEND_URL/api/v1/health
# Expected: proxied to backend
```

### 5.3 Test Full Integration

1. Open frontend URL in browser
2. Click on any research feature
3. Verify it makes API calls to backend
4. Check browser console for CORS/network errors

---

## Troubleshooting

### Issue: "couldn't locate a dockerfile"

**Solution:** Root `Dockerfile` is required. Verify:
```bash
ls -la Dockerfile  # Must exist at root
```

### Issue: Backend fails to build

**Check:** `docker build -f Dockerfile .` locally first

### Issue: Frontend can't reach backend

**Check:**
1. Backend service is running and healthy
2. API proxy URL in `nginx.conf` is correct
3. Both services are in same Railway project
4. CORS is enabled in backend (`allow_origins=["*"]`)

### Issue: Database not persisting

**Check:**
1. Using `/app/data/` directory
2. Not using ephemeral storage paths
3. Enable Railway's persistent volumes

---

## Environment Variables Reference

### Required
```
OPENAI_API_KEY=sk-... (Secret variable in Railway)
```

### Optional (with defaults)
```
LLM_MODEL=gpt-4o
LLM_MAX_TOKENS=4096
MAX_PAPERS_PER_QUERY=15
...etc
```

All other vars can be left as defaults. Update via Railway Variables UI.

---

## Monitoring & Logs

### View Logs in Railway

```bash
# Via CLI
railway logs

# Via Dashboard
# Railway → Project → Services → mars-backend → Logs
```

### Common Log Entries

```
# Expected successful startup
INFO: Application startup complete
INFO: Uvicorn running on 0.0.0.0:8000

# Health checks (normal, expected every 30s)
INFO: 127.0.0.1:xxxxx - "GET /health HTTP/1.1" 200 OK
```

---

## Production Checklist

- [ ] Backend service deployed and healthy
- [ ] Frontend service deployed and accessible
- [ ] OPENAI_API_KEY set as Railway secret variable
- [ ] Cross-service communication working (frontend → backend API)
- [ ] Health endpoints responding
- [ ] Database persistence verified
- [ ] ChromaDB persistence verified
- [ ] Frontend can load and make API requests
- [ ] No CORS errors in browser console
- [ ] SSL/HTTPS working (automatic via Railway)

---

## Production URLs

After deployment, your application will be available at:

```
Frontend: https://mars-frontend-prod.railway.app
Backend API: https://mars-backend-prod.railway.app
API Docs: https://mars-backend-prod.railway.app/docs
Health: https://mars-backend-prod.railway.app/health
```

Replace with actual Railway-assigned domains.

---

## Rollback

If deployment fails:

```bash
# Via Railway Dashboard
1. Go to Project → Deployments
2. Click on previous successful deployment
3. Click "Redeploy"

# This rolls back both services to last known good state
```

---

## Next Steps

1. **Scale Backend** (if needed): Railway → mars-backend → Settings → Increase CPU/Memory
2. **Enable Monitoring**: Railway → Monitoring tab for metrics
3. **Set up Email Alerts**: Railway → Project → Alerts
4. **Custom Domain**: Railway → Settings → Add Custom Domain
5. **SSL Certificate**: Railway automatically provisions via Let's Encrypt

---

## Support

- **Railway Docs**: https://docs.railway.app
- **Railway Status**: https://status.railway.app
- **GitHub Issues**: Post issues to repository
