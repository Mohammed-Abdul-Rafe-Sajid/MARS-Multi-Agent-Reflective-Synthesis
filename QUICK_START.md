# 🚀 MARS Research Platform - Quick Start Guide

## One-Command Start (Production)

Run this from the project root to start both backend and frontend:

```powershell
.\start-production.ps1
```

This will:
1. Build the frontend (optimized production build)
2. Start the backend on port 8000
3. Start the frontend on port 3000
4. Open http://localhost:3000 automatically

---

## One-Command Start (Development)

Use auto-reload for development:

```powershell
.\start-development.ps1
```

This includes:
- Backend auto-reload on file changes
- Frontend hot reload on file changes
- Same port configuration as production

---

## Manual Start (Terminal by Terminal)

### Step 1: Start Backend (Terminal 1)
```powershell
cd C:\Users\abdul\Desktop\projects\MARS\research_platform_v2\backend
..\​.venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000
```

Expected output:
```
Uvicorn running on http://0.0.0.0:8000
Application startup complete
```

### Step 2: Start Frontend (Terminal 2)
```powershell
cd C:\Users\abdul\Desktop\projects\MARS\research_platform_v2\frontend
npm start
```

Expected output:
```
Compiled successfully!
You can now view sraip-frontend in the browser.
On Your Network: http://localhost:3000
```

---

## Verify Everything is Working

After starting both services:

✅ **Frontend:** http://localhost:3000
✅ **Backend API:** http://localhost:8000
✅ **API Documentation:** http://localhost:8000/docs

---

## Environment & Configuration

### Backend Configuration  
Located in `backend/.env`:
- OpenAI API Key: `sk-proj-...` ✅ Already configured
- Port: 8000
- Host: 0.0.0.0
- Database: SQLite at `./research_system.db`

### Frontend Configuration
Located in `frontend/package.json`:
- Port: 3000
- Backend Proxy: http://localhost:8000 (automatic)

---

## Project Structure

```
research_platform_v2/
├── backend/                 # Python FastAPI backend
│   ├── main.py             # App entry point
│   ├── requirements.txt     # Python dependencies
│   ├── .env                # Environment variables
│   ├── agents/             # AI agents
│   ├── api/                # API routes
│   ├── memory/             # Database layer
│   ├── rag/                # RAG retrieval
│   └── evaluation/         # Metrics & evaluation
├── frontend/               # React TypeScript frontend
│   ├── src/                # Source code
│   ├── package.json        # NPM dependencies
│   └── public/             # Static assets
├── .venv/                  # Virtual environment
├── start-production.ps1    # Production startup script
├── start-development.ps1   # Development startup script
└── PRODUCTION_GUIDE.md     # Full deployment guide
```

---

## Common Tasks

### Restart Everything
```powershell
# Kill any running processes
Get-Process -Name python,node | Stop-Process -Force

# Start again
.\start-production.ps1
```

### View Backend Logs
```powershell
# Backend logs appear in the terminal window where it's running
# For persistent logs, append to file:
..\​.venv\Scripts\python.exe -m uvicorn main:app --log-level debug 2>&1 | Tee-Object -FilePath backend.log
```

### Install New Frontend Dependencies
```powershell
cd frontend
npm install <package-name>
```

### Install New Backend Dependencies
```powershell
.\.venv\Scripts\python.exe -m pip install <package-name>
# Then update requirements.txt:
.\.venv\Scripts\python.exe -m pip freeze > backend/requirements.txt
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Port 8000 already in use | `Stop-Process -Id (Get-NetTCPConnection -LocalPort 8000).OwningProcess -Force` |
| Port 3000 already in use | `Stop-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess -Force` |
| Module not found (backend) | `cd backend && ..\​.venv\Scripts\python.exe -m pip install -r requirements.txt` |
| npm modules not found | `cd frontend && npm install` |
| Build fails | `npm cache clean --force && rm -r node_modules && npm install` |

---

## Next Steps

1. **Access the application:** http://localhost:3000
2. **Explore the API:** http://localhost:8000/docs
3. **Configure your research:** Edit `.env` for your API keys if needed
4. **Read docs:** See `PRODUCTION_GUIDE.md` for advanced configuration

---

**Status:** ✅ Ready to run for production use!
