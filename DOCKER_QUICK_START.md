# Docker Quick Start & Troubleshooting — MARS v3.0

## 🚀 Quick Start (5 Minutes)

### Step 1: Prepare Environment File
```bash
# Copy template
cp .env.example .env

# Edit .env and add your OpenAI key
# Windows: notepad .env
# macOS/Linux: nano .env
```

**Required:** `OPENAI_API_KEY=sk-proj-...`

### Step 2: Build Images
```bash
# First time or after code changes
docker-compose build

# Output should show:
# Building backend ... done
# Building frontend ... done
```

### Step 3: Start Services
```bash
docker-compose up -d

# Check status
docker-compose ps

# Should show:
# NAME          STATUS
# mars_backend  Up 2 minutes (healthy)
# mars_frontend Up 2 minutes (healthy)
```

### Step 4: Test
```bash
# Open in browser
# http://localhost/          ← React frontend
# http://localhost/docs      ← FastAPI docs
# http://localhost:8000/docs ← Direct backend access
```

---

## 📋 File Structure

```
research_platform_v2/
├── .dockerignore              ✓ Prevents copying unnecessary files
├── .env                        ✓ Your secrets (NEVER commit)
├── .env.example                ✓ Template for .env
├── Dockerfile.backend          ✓ Python 3.11-slim, FastAPI
├── Dockerfile.frontend         ✓ Node:22 build, Nginx serve
├── docker-compose.yml          ✓ Orchestration, volumes, networks
├── nginx.conf                  ✓ Reverse proxy, caching, security
├── DOCKER_DEPLOYMENT_GUIDE.md  ✓ Detailed architecture docs
├── DOCKER_QUICK_START.md       ✓ This file
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   ├── config.py
│   ├── agents/
│   ├── api/
│   ├── rag/
│   ├── memory/
│   └── chromadb_store/         ✓ Mounted as volume
├── frontend/
│   ├── package.json
│   ├── src/
│   ├── public/
│   └── build/                  ✓ Output of npm build
└── research_system.db          ✓ Persisted in volume
```

---

## 🔧 Common Tasks

### View Logs
```bash
# All services
docker-compose logs -f

# Single service
docker-compose logs -f backend
docker-compose logs -f frontend

# Last 20 lines
docker-compose logs --tail=20 backend

# Specific time range
docker-compose logs --since 2025-06-02T10:00:00 backend
```

### Access Running Container
```bash
# Backend shell (Python)
docker exec -it mars_backend bash

# Frontend shell (Alpine Linux)
docker exec -it mars_frontend sh
```

### Restart Services
```bash
# Restart all
docker-compose restart

# Restart single service
docker-compose restart backend
docker-compose restart frontend

# Restart and update config
docker-compose down && docker-compose up -d
```

### Update Backend Code
```bash
# After editing backend/*.py
docker-compose restart backend

# To force rebuild:
docker-compose build backend && docker-compose up -d backend
```

### Update Frontend Code
```bash
# After editing frontend/src/*
docker-compose build frontend && docker-compose up -d frontend

# Takes 2-3 minutes (React build time)
```

### Check Resource Usage
```bash
docker stats

# Output:
# CONTAINER  CPU %  MEM USAGE / LIMIT
# mars_backend  0.2%  150MiB / 1GiB
# mars_frontend 0.1%  45MiB / 1GiB
```

### Inspect Volumes
```bash
# List all volumes
docker volume ls

# Inspect specific volume
docker volume inspect research_platform_v2_db_data

# View volume contents (macOS/Linux)
docker run -v research_platform_v2_db_data:/data alpine ls -la /data

# Windows: Use Docker Desktop → Volumes
```

### Backup Database
```bash
# Backup SQLite
docker run --rm -v research_platform_v2_db_data:/data -v $(pwd):/backup alpine tar czf /backup/db_backup.tar.gz /data/

# Backup ChromaDB
docker run --rm -v research_platform_v2_chroma_data:/data -v $(pwd):/backup alpine tar czf /backup/chroma_backup.tar.gz /data/
```

---

## ❌ Troubleshooting

### Problem: "Cannot bind port 80"
```
Error: bind: permission denied
```

**Solution 1: Use different port**
```yaml
# Edit docker-compose.yml
services:
  frontend:
    ports:
      - "8080:80"  # Changed from 80:80
```

**Solution 2: Run with sudo**
```bash
sudo docker-compose up -d
```

**Solution 3: Windows/macOS (Docker Desktop)**
- Port 80 is typically available. Try restarting Docker Desktop.

---

### Problem: "Cannot bind port 8000"
```
Error: bind: address already in use
```

**Solution:**
```bash
# Find what's using port 8000
lsof -i :8000

# Kill process
kill -9 <PID>

# Or use different port:
# Edit docker-compose.yml backend: ports: ["9000:8000"]
```

---

### Problem: Backend Container Exits Immediately
```
mars_backend exited with code 1
```

**Debug:**
```bash
docker-compose logs backend

# Look for errors like:
# - ModuleNotFoundError: No module named 'fastapi'
# - openai.error.AuthenticationError
# - sqlite3.OperationalError
```

**Solutions:**

1. **Missing OpenAI API Key**
   ```bash
   # Check if .env file exists
   ls -la .env
   
   # Verify it has OPENAI_API_KEY
   grep OPENAI_API_KEY .env
   
   # Should output: OPENAI_API_KEY=sk-proj-...
   ```

2. **Rebuild after requirements.txt change**
   ```bash
   docker-compose build backend --no-cache
   docker-compose up -d backend
   ```

3. **Port already in use**
   ```bash
   docker-compose down
   docker-compose up -d
   ```

---

### Problem: Frontend Shows "Cannot GET /"
```
Frontend loads but shows blank page or error
```

**Debug:**
```bash
# Check Nginx logs
docker-compose logs frontend

# Test Nginx config
docker exec mars_frontend nginx -t

# Check if index.html exists
docker exec mars_frontend ls -la /usr/share/nginx/html/
```

**Solutions:**

1. **React build failed**
   ```bash
   docker-compose build frontend --no-cache
   ```

2. **Missing package.json or missing packages**
   ```bash
   # Verify package.json exists
   ls frontend/package.json
   
   # Rebuild
   docker-compose build frontend
   ```

3. **Nginx config problem**
   - Check `nginx.conf` syntax
   - Common issue: typos in `try_files` directive

---

### Problem: Backend Returns "503 Bad Gateway"
```
Nginx can't reach backend
```

**Debug:**
```bash
# Test backend health from frontend container
docker exec mars_frontend wget http://backend:8000/docs -O-

# Check backend logs
docker-compose logs backend

# Verify network
docker network ls
docker network inspect research_platform_v2_mars_network
```

**Solutions:**

1. **Backend not fully started**
   ```bash
   # Wait 10-15 seconds for startup
   docker-compose logs -f backend | grep "Application startup complete"
   ```

2. **Backend crashed**
   ```bash
   docker-compose restart backend
   ```

3. **Network issue**
   ```bash
   docker-compose down
   docker-compose up -d
   ```

---

### Problem: "ModuleNotFoundError: No module named 'fastapi'"
```
When running docker exec ... python main.py
```

**Solution:** Use activated venv
```bash
# Wrong:
docker exec mars_backend python main.py

# Right:
docker exec mars_backend /opt/venv/bin/python main.py

# Or: Use the pre-configured CMD
docker-compose logs backend
```

---

### Problem: "OpenAI API Error: Invalid API Key"
```
openai.error.AuthenticationError
```

**Check:**
```bash
# Is key in .env?
cat .env | grep OPENAI_API_KEY

# Is it valid?
# Visit: https://platform.openai.com/account/api-keys

# Check inside container
docker exec mars_backend cat /proc/1/environ | grep OPENAI

# Should show: OPENAI_API_KEY=sk-proj-...
```

---

### Problem: Database File Not Persisting
```
Data lost after docker-compose down
```

**Check:**
```bash
# Verify volume exists
docker volume ls | grep chroma_data
docker volume ls | grep db_data

# Verify volume mount in container
docker inspect mars_backend | grep -A 10 Mounts

# Should show mount points for /app/data and /app/chromadb_store
```

**Ensure:**
```yaml
# docker-compose.yml backend section must have:
volumes:
  - db_data:/app/data
  - chroma_data:/app/chromadb_store
```

---

### Problem: "too many open files"
```
Error during ChromaDB operations
```

**Solution:**
```bash
# Increase limit
ulimit -n 4096

# Or set in container:
# Add to docker-compose.yml:
ulimits:
  nofile:
    soft: 4096
    hard: 8192
```

---

### Problem: Out of Disk Space
```
write error: No space left on device
```

**Clean up:**
```bash
# Stop containers
docker-compose down

# Remove unused images
docker image prune

# Remove dangling volumes
docker volume prune

# Remove build cache
docker builder prune

# Check disk usage
docker system df
```

---

## 🔍 Health Checks

All services have built-in health checks:

```bash
# View health status
docker-compose ps

# STATUS column shows:
# - "Up X minutes (healthy)"   ✓ Good
# - "Up X minutes (health: starting)"  → Wait
# - "Up X minutes (unhealthy)" ✗ Problem

# Check backend health
docker exec mars_backend curl localhost:8000/docs

# Check frontend health
docker exec mars_frontend wget http://localhost:80/ -O-
```

---

## 📊 Performance Monitoring

### Real-Time Resource Usage
```bash
docker stats --no-stream
```

### CPU & Memory by Container
```bash
docker stats mars_backend mars_frontend
```

### Historical Stats (Linux only)
```bash
docker run --rm -v=/var/run/docker.sock:/var/run/docker.sock \
  prom/node-exporter --collector.systemd=true
```

---

## 🛑 Stopping & Cleanup

### Graceful Stop (keeps data)
```bash
docker-compose down

# Containers removed, volumes kept
# Run docker-compose up -d to restart with data intact
```

### Full Cleanup (removes everything)
```bash
docker-compose down -v

# WARNING: Deletes volumes!
# All database and ChromaDB data lost!
```

### Stop Single Service
```bash
docker-compose stop backend

# To restart:
docker-compose start backend
```

---

## 🚀 Performance Tips

1. **Faster Frontend Builds**
   ```bash
   # Use .dockerignore to skip copying node_modules
   # (Already done)
   ```

2. **Faster Backend Startup**
   ```bash
   # Remove --reload for production
   # Edit Dockerfile.backend CMD line
   ```

3. **Database Optimization**
   ```bash
   # For 100+ concurrent users:
   # Migrate from SQLite to PostgreSQL
   ```

4. **ChromaDB Speedup**
   ```bash
   # Persist to SSD volume for faster indexing
   # Restart time: 30-60s typical
   ```

---

## 📚 Further Reading

- [Docker Compose CLI Reference](https://docs.docker.com/compose/reference/)
- [Docker Troubleshooting Guide](https://docs.docker.com/config/containers/troubleshoot/)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/docker/)
- [Nginx Configuration Best Practices](https://nginx.org/en/docs/http/ngx_http_core_module.html)
