# MARS Research Platform v3.0 - Production Deployment Guide

## 📋 Table of Contents
1. [System Requirements](#system-requirements)
2. [Setup Instructions](#setup-instructions)
3. [Running the Application](#running-the-application)
4. [Production Deployment](#production-deployment)
5. [Health Checks](#health-checks)
6. [Troubleshooting](#troubleshooting)

---

## System Requirements

### Hardware
- **Memory:** 4GB RAM minimum (8GB recommended)
- **Disk:** 2GB free space
- **CPU:** Dual-core minimum (quad-core recommended)

### Software
- **Python:** 3.12+ (configured via `.venv`)
- **Node.js:** 18+ (for frontend build)
- **npm:** 8+

---

## Setup Instructions

### 1. Install Backend Dependencies
```powershell
cd C:\Users\abdul\Desktop\projects\MARS\research_platform_v2
.\.venv\Scripts\python.exe -m pip install -r backend/requirements.txt
```

### 2. Install Frontend Dependencies
```powershell
cd frontend
npm install
```

### 3. Configure Environment Variables
The `.env` file is already configured at `backend/.env` with:
- ✅ OpenAI API key
- ✅ Database settings
- ✅ RAG/ChromaDB configuration

---

## Running the Application

### Option 1: Automated Startup Scripts (Recommended)

#### Development Mode (with auto-reload)
```powershell
cd C:\Users\abdul\Desktop\projects\MARS\research_platform_v2
.\start-development.ps1
```

#### Production Mode
```powershell
cd C:\Users\abdul\Desktop\projects\MARS\research_platform_v2
.\start-production.ps1
```

### Option 2: Manual Startup

#### Terminal 1 - Backend
```powershell
cd C:\Users\abdul\Desktop\projects\MARS\research_platform_v2\backend
..\​.venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000
```

#### Terminal 2 - Frontend (Production Built)
```powershell
cd C:\Users\abdul\Desktop\projects\MARS\research_platform_v2\frontend
npm start
```

Or serve the production build with:
```powershell
npx serve -s build -l 3000
```

---

## Access Points

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost:3000 | User Interface |
| Backend API | http://localhost:8000 | API Endpoints |
| API Documentation | http://localhost:8000/docs | Interactive Swagger UI |
| Alternative Docs | http://localhost:8000/redoc | ReDoc Documentation |

---

## Production Deployment

### Build Frontend for Production
```powershell
cd frontend
npm run build
```

This creates an optimized `build/` directory with minified assets.

### Environment Variables (Production)
Update `backend/.env` for production:
```env
# Ensure production-safe settings
OPENAI_API_KEY=your_production_key_here
HOST=0.0.0.0
PORT=8000

# Database
DATABASE_URL=sqlite:///./research_system.db

# Security
ALLOW_ORIGINS=https://yourdomain.com
```

### Running with Production WSGI Server
For production, use Gunicorn instead of uvicorn:

```bash
pip install gunicorn
cd backend
gunicorn -w 4 -b 0.0.0.0:8000 main:app
```

### Docker Deployment (Optional)

#### Dockerfile for Backend
```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install -r requirements.txt
COPY backend/ .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

#### Dockerfile for Frontend
```dockerfile
FROM node:18-slim AS builder
WORKDIR /app
COPY frontend .
RUN npm install && npm run build

FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## Health Checks

### Backend Health Check
```bash
curl http://localhost:8000/docs
```

### Frontend Availability
```bash
curl http://localhost:3000
```

### Database Connectivity
```powershell
cd backend
..\​.venv\Scripts\python.exe -c "from memory.database import init_db; init_db(); print('Database OK')"
```

---

## Troubleshooting

### Backend won't start
```powershell
# Verify venv is active and has dependencies
.\.venv\Scripts\python.exe -m pip list | Select-String fastapi

# Verify port 8000 is available
Get-NetTCPConnection -LocalPort 8000

# Kill process on port 8000 if needed
Stop-Process -Id (Get-NetTCPConnection -LocalPort 8000).OwningProcess -Force
```

### Frontend won't build
```powershell
# Clear npm cache
npm cache clean --force

# Remove node_modules
rm -r node_modules

# Reinstall
npm install && npm run build
```

### Database issues
```powershell
# Backup current database
copy backend\research_system.db backend\research_system.db.bak

# Reset database (deletes all data)
rm backend\research_system.db
```

### Module import errors
```powershell
# Reinstall all dependencies fresh
.\.venv\Scripts\python.exe -m pip install --force-reinstall -r backend/requirements.txt
```

---

## Performance Optimization

### Backend
- Enable auto-scaling with multiple worker processes (Gunicorn)
- Use caching for frequently accessed endpoints
- Monitor ChromaDB memory usage

### Frontend
- Apply code splitting for larger bundles
- Enable gzip compression in nginx/production server
- Use CDN for static assets

---

## Monitoring & Logs

### View Backend Logs
```powershell
# Follow logs in real-time
Get-Content backend\logs.txt -Wait
```

### API Documentation
Visit `http://localhost:8000/docs` for interactive API testing

---

## Support & Additional Resources

- **Backend API:** Built with FastAPI (see `/docs`)
- **Frontend:** React 18 with TypeScript
- **Database:** SQLite (sqlite:///./research_system.db)
- **Vector Store:** ChromaDB for RAG

For more details, refer to:
- `backend/README.md`
- `frontend/package.json`
