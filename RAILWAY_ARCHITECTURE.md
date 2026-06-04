# ============================================================================
# Railway Production Deployment - Architecture & Verification
# ============================================================================

## Production Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          INTERNET / USERS                           │
│                                                                     │
│                   Browser (https://public.url)                     │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           │ HTTPS
                           ↓
        ┌──────────────────────────────────────────┐
        │    Railway (Ingress / Load Balancer)     │
        │  - TLS/SSL Termination                   │
        │  - Domain: mars-frontend-prod.railway.app│
        └──────────★──────────────────────★────────┘
                   │                      │
        ┌──────────↓───┐        ┌────────↓─────────┐
        │  FRONTEND    │        │  API GATEWAY /   │
        │  SERVICE     │        │  BACKEND SERVICE │
        ├──────────────┤        ├──────────────────┤
        │ • React SPA  │        │ • FastAPI        │
        │ • Nginx      │        │ • Uvicorn        │
        │ • Port 80    │        │ • Port 8000      │
        │              │        │                  │
        │ Serves:      │        │ Endpoints:       │
        │ - /          │        │ - GET /health    │
        │ - /*.html    │        │ - GET /docs      │
        │ - /*.js      │        │ - POST /query    │
        │ - /*.css     │        │ - GET /history   │
        │ - /api/*     │        │ - POST /verify   │
        └──────────┬───┘        └────────┬─────────┘
                   │                     │
                   └──────────→ Routes   ←─┘
                       /api/*
                    (internal Railway
                     network DNS)
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ↓                    ↓                    ↓
    ┌───────────┐    ┌──────────────┐    ┌──────────────┐
    │ SQLite DB │    │ ChromaDB     │    │ OpenAI API   │
    │           │    │              │    │              │
    │ Location: │    │ Location:    │    │ gpt-4o       │
    │ /app/data/│    │ /app/data/   │    │ (external)   │
    │ research_ │    │ chromadb_    │    │              │
    │ system.   │    │ store        │    │ LLM calls    │
    │ db        │    │              │    │ for queries  │
    │           │    │ Persisted on │    │              │
    │ Persisted │    │ Railway      │    │ API Key via  │
    │ on        │    │ (automatic)  │    │ Railway      │
    │ Railway   │    │              │    │ Variables    │
    │ (auto)    │    │              │    │ (secure)     │
    └───────────┘    └──────────────┘    └──────────────┘
```

---

## Component Details

### Frontend Service (mars-frontend)

**Technology Stack:**
- React 18.3.1
- TypeScript 5.0+
- Nginx (Alpine)
- Node.js 22 (build only)

**Responsibilities:**
- Serve React Single Page Application
- Proxy API calls to backend service
- Handle SPA routing (reset to index.html for unmatched routes)
- Cache static assets (CSS, JS, images)
- HTTPS via Railway

**Dockerfile:** `Dockerfile.frontend`
- Build stage: Node.js 22-alpine
  - `npm install` dependencies
  - `npm run build` production bundle
- Runtime stage: Nginx:alpine
  - Copy built React app to `/usr/share/nginx/html`
  - Copy nginx.conf for reverse proxy configuration

**Environment Variables:** 
- None required (frontend is static after build)
- If using env vars at runtime, pass via `.env.local` during build

**Health Check:**
- GET / returns 200 OK with HTML

**Logs:** `/var/log/nginx`

### Backend Service (mars-backend)

**Technology Stack:**
- FastAPI 0.111.0
- Uvicorn 0.29.0 (ASGI server)
- Python 3.11-slim
- SQLite + ChromaDB

**Responsibilities:**
- API endpoints for research platform
- LLM integration (OpenAI gpt-4o)
- Document retrieval (arXiv)
- Claim verification
- Data persistence

**Dockerfile:** `Dockerfile` (root level)
- Build stage: Python 3.11-slim
  - `pip install` from requirements.txt to /root/.local
- Runtime stage: Python 3.11-slim
  - Copy only necessary packages (slim size)
  - Copy backend source code

**Environment Variables (via railway.toml):**
```
OPENAI_API_KEY          [RAILWAY SECRET]
LLM_MODEL               gpt-4o
LLM_MAX_TOKENS          4096
MAX_PAPERS_PER_QUERY    15
TOP_K_RAG_CHUNKS        5
PAPER_AGE_CUTOFF_YEARS  10
[... 10 more config variables ...]
DATABASE_URL            sqlite:///./data/research_system.db
CHROMA_PERSIST_DIR      /app/data/chromadb_store
```

**Health Check:**
- GET /health returns `{"status": "ok"}`
- Railway checks every 30 seconds

**Logs:** 
- stdout/stderr captured by Railway
- View via: Railway Dashboard → Logs

**Startup Command:**
```bash
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --workers 1 --log-level info
```

### Data Persistence

**SQLite Database**
- Path: `/app/data/research_system.db`
- Railway persistent volume: automatic
- Auto-created if doesn't exist
- Survives service restarts

**ChromaDB Vectors**
- Path: `/app/data/chromadb_store`
- Railway persistent volume: automatic
- Survives service restarts

**Logs**
- Path: `/app/logs` (optional)
- Can be ephemeral (not persisted)

---

## Deployment Flow

```
1. User pushes code to GitHub
        ↓
2. Railway detects push (webhook)
        ↓
3. Railway clones repository
        ↓
4. Backend Service Build
   - Reads ./Dockerfile
   - `docker build -f Dockerfile .`
   - Installs Python dependencies
   - Creates image
   - Pushes to Railway registry
        ↓
5. Frontend Service Build
   - Reads ./Dockerfile.frontend
   - `npm install && npm run build`
   - Creates optimized production bundle
   - Builds Nginx image
   - Pushes to Railway registry
        ↓
6. Deploy Stage
   - Backend: Start Uvicorn on port 8000
   - Frontend: Start Nginx on port 80
   - Wait for health checks to pass
   - Route ingress traffic to frontend
        ↓
7. Active
   - Frontend accessible at public URL
   - Backend accessible internally (from frontend)
   - Both services in same Docker network
   - Both can access persistent storage
        ↓
8. Monitoring
   - Railway monitors health checks
   - Logs streamed to dashboard
   - Metrics available in Monitoring tab
```

---

## Network Communication

### Internal (Railway Docker Network)

```
Frontend (nginx:80)
    └→ proxy_pass http://mars-backend:8000/api/
    
Backend detects request:
    GET http://mars-backend:8000/api/v1/research
    
Backend responds:
    200 OK + JSON response
    
Frontend serves to browser:
    200 OK + React HTML + JS that calls /api/*
```

### CORS Configuration

Backend (`backend/main.py`):
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Or specific Railway frontend URL
    allow_methods=["*"],
    allow_headers=["*"],
)
```

This allows frontend to make requests to backend without CORS errors.

---

## Deployment Environment Variables

### Via railway.toml (provided)

All 16 configuration variables pre-configured with sensible defaults:

```toml
[env]
LLM_MODEL = "gpt-4o"
LLM_MAX_TOKENS = "4096"
MAX_PAPERS_PER_QUERY = "15"
TOP_K_RAG_CHUNKS = "5"
PAPER_AGE_CUTOFF_YEARS = "10"
RAG_SIMILARITY_THRESHOLD = "0.60"
DEFAULT_ABLATION_MODE = "both"
MAX_ITERATIONS = "4"
CLAIM_DELTA_THRESHOLD = "0.10"
WEAK_CLAIM_RATIO_THRESHOLD = "0.30"
SIMILARITY_VERIFIED_THRESHOLD = "0.75"
SIMILARITY_WEAK_THRESHOLD = "0.60"
MIN_SUPPORTING_PAPERS = "2"
CHUNK_SIZE_TOKENS = "512"
CHUNK_OVERLAP_TOKENS = "50"
EMBEDDING_MODEL = "text-embedding-3-small"
DATABASE_URL = "sqlite:///./data/research_system.db"
CHROMA_PERSIST_DIR = "/app/data/chromadb_store"
```

### Via Railway Variables (override)

In Railway Dashboard → Project Settings → Variables:

```
Name: OPENAI_API_KEY
Value: sk-proj-your_actual_key
Type: SECRET (checkbox)
```

This overrides the value (if any) in railway.toml.

---

## Production Verification Checklist

### Pre-Deployment

- [ ] All Docker files present:
  - [ ] `./Dockerfile` (root)
  - [ ] `./Dockerfile.frontend`
  - [ ] `./docker-compose.yml` (local reference only)
  - [ ] `./nginx.conf`
  - [ ] `./railway.toml`

- [ ] Configuration files valid:
  - [ ] `railway.toml` has `[build]`, `[deploy]`, `[env]` sections
  - [ ] `nginx.conf` includes `upstream backend_api { server mars-backend:8000; }`
  - [ ] `backend/config.py` uses `/app/data/` paths (not relative paths)

- [ ] Security:
  - [ ] No real OpenAI API keys in repository
  - [ ] `.env` file in `.gitignore`
  - [ ] No hardcoded secrets in any file

- [ ] Git:
  - [ ] All changes committed: `git status` is clean
  - [ ] Ready to push: `git log --oneline -5` shows recent commits
  - [ ] Remote configured: `git remote -v` shows origin

### Deployment (GitHub Push)

```bash
# Commit changes
git add -A
git commit -m "🚀 Deploy MARS to Railway"

# Push to GitHub
git push origin main

# Expected: Railway automatically triggers builds
```

### Post-Deployment (In Railway Dashboard)

- [ ] **Backend Build**
  - [ ] Build started automatically (webhook)
  - [ ] Build logs visible (no Python errors)
  - [ ] Build completed (indicates "success")
  - [ ] Service shows "green" status

- [ ] **Frontend Build**
  - [ ] Build started automatically
  - [ ] Build logs visible (no npm errors)
  - [ ] Build completed
  - [ ] Service shows "green" status

- [ ] **Environment Variables**
  - [ ] Variables tab: All 16 config vars present
  - [ ] Variables tab: OPENAI_API_KEY set (SECRET checkbox marked)
  - [ ] Save/Apply button clicked

- [ ] **Health Checks**
  - [ ] Backend: `curl https://mars-backend-xxx.railway.app/health`
    - Expected: `{"status":"ok"}`
  - [ ] Frontend: `curl https://mars-frontend-xxx.railway.app`
    - Expected: 200 OK (HTML response)

### Functional Testing

- [ ] **Open Frontend in Browser**
  - [ ] Navigate to `https://mars-frontend-xxx.railway.app`
  - [ ] Expected: React app loads (no 404)
  - [ ] Check DevTools Console: No red errors

- [ ] **Test API Proxy**
  - [ ] Open browser console (F12)
  - [ ] Click any research feature
  - [ ] Network tab: Check requests to `/api/v1/*`
  - [ ] Expected: HTTP 200 responses
  - [ ] Expected: No CORS errors

- [ ] **Test Backend Directly** (Optional)
  - [ ] `curl https://mars-backend-xxx.railway.app/docs`
  - [ ] Expected: Swagger UI loads (status 200)
  - [ ] Try a simple endpoint via Swagger

- [ ] **Test Data Persistence**
  - [ ] Create a research session via frontend
  - [ ] In Railway Dashboard: Restart backend service
  - [ ] Expected: Data survives restart (visible in frontend history)

### Performance & Monitoring

- [ ] **Logs Look Good**
  - [ ] Railway → Logs tab: No ERROR logs
  - [ ] Expected: INFO logs show startup and health checks
  - [ ] Watch for: Any 500 errors in API calls

- [ ] **Metrics Available**
  - [ ] Railway → Monitoring: CPU < 50%
  - [ ] Railway → Monitoring: Memory < 500MB
  - [ ] Railway → Monitoring: No restarts (if all good)

### Troubleshooting Quick Reference

| Issue | Check |
|-------|-------|
| Build fails | Railway → Deploy → Logs (scroll to errors) |
| Services stuck | Re-deploy: Deployments → Redeploy |
| Frontend can't reach backend | nginx.conf upstream, backend service name |
| Database gone | Check CHROMA_PERSIST_DIR, DATABASE_URL path |
| API key error | Railway Variables → OPENAI_API_KEY (type: SECRET) |
| Performance slow | Check Railway Monitoring → CPU/Memory |
| 500 errors on API | Railway → Backend Logs (look for stack traces) |

---

## Public URLs After Deployment

Once deployment succeeds and health checks pass, your application is available at:

```
🌐 Frontend:     https://mars-frontend-xxx.railway.app
🔌 Backend API:  https://mars-backend-xxx.railway.app
📚 API Docs:     https://mars-backend-xxx.railway.app/docs
❤️  Health:      https://mars-backend-xxx.railway.app/health
```

**Share Frontend URL with users** - they only need the frontend URL.

---

## Maintenance & Scaling

### Scale Resources

Railway Dashboard → mars-backend → Settings:
- **CPU**: Increase if API responses slow
- **Memory**: Increase if service restarts frequently
- **Replicas**: Add more instances for load balancing

### Update Deployment

```bash
# Make changes to code
# Commit and push
git push origin main

# Railway automatically rebuilds and redeploys both services
```

### Monitor Issues

```bash
# View latest logs
railway logs

# Check deployment status
railway list

# Restart service
railway redeploy
```

---

## Appendix A: File Structure Expected by Railway

```
/
├── Dockerfile (root - CRITICAL)
├── Dockerfile.frontend
├── docker-compose.yml (local reference)
├── nginx.conf
├── railway.toml (service config)
├── backend/
│   ├── main.py (Uvicorn app, has /health)
│   ├── config.py (env var loading)
│   ├── requirements.txt
│   └── ...
├── frontend/
│   ├── package.json (build config)
│   ├── src/
│   │   ├── App.tsx
│   │   ├── index.tsx
│   │   └── ...
│   └── public/
│       └── index.html
└── .gitignore (must exclude .env and secrets)
```

Railway will:
1. Clone repository
2. Look for `Dockerfile` at root (first priority)
3. Build using multi-stage process
4. Deploy and assign public URL

---

## Appendix B: Switching Between Local & Production

### Local Development
```bash
docker-compose up
# Frontend: http://localhost:3000
# Backend: http://localhost:8000
# Database: ./data/ (local bind mount)
```

### Production (Railway)
```bash
git push origin main
# Frontend: https://mars-frontend-xxx.railway.app
# Backend: https://mars-backend-xxx.railway.app (internal)
# Database: /app/data/ (Railway persistent storage)
```

---
