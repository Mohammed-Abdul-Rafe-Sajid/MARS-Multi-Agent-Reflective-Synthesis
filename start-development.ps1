# Development Startup Script
# Runs both backend and frontend with hot reload for development

$projectRoot = "C:\Users\abdul\Desktop\projects\MARS\research_platform_v2"
$venvPath = "$projectRoot\.venv\Scripts\python.exe"

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "MARS Research Platform v3.0 - Development Start" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Check if venv exists
if (-not (Test-Path $venvPath)) {
    Write-Host "ERROR: Virtual environment not found at $venvPath" -ForegroundColor Red
    exit 1
}

# Start backend (in new window) with auto-reload
Write-Host "Starting backend server (with auto-reload)..." -ForegroundColor Yellow
$backendStartScript = @"
cd $projectRoot\backend
&"$venvPath" -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
"@

$backendProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendStartScript -PassThru
Write-Host "✓ Backend started (PID: $($backendProcess.Id)) with auto-reload enabled" -ForegroundColor Green
Write-Host "  Available at: http://localhost:8000" -ForegroundColor Cyan
Write-Host "  API Docs: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""

# Start frontend (in new window) with dev server
Write-Host "Starting frontend dev server..." -ForegroundColor Yellow
$frontendStartScript = @"
cd $projectRoot\frontend
npm start
"@

$frontendProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendStartScript -PassThru
Write-Host "✓ Frontend started (PID: $($frontendProcess.Id)) with hot reload enabled" -ForegroundColor Green
Write-Host "  Available at: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""

Write-Host "=====================================" -ForegroundColor Green
Write-Host "Development environment is running!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""
Write-Host "Frontend:  http://localhost:3000 (Hot reload enabled)" -ForegroundColor Cyan
Write-Host "Backend:   http://localhost:8000 (Auto-reload enabled)" -ForegroundColor Cyan
Write-Host "Backend Docs: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "Changes to source files will automatically reload." -ForegroundColor Yellow
Write-Host "Press CTRL+C in the original terminal to stop all services" -ForegroundColor Yellow
Write-Host ""

# Keep script running
Read-Host "Press Enter to exit both terminals"

# Cleanup
Write-Host "Stopping services..." -ForegroundColor Yellow
Stop-Process -Id $backendProcess.Id -Force -ErrorAction SilentlyContinue
Stop-Process -Id $frontendProcess.Id -Force -ErrorAction SilentlyContinue
Write-Host "Services stopped." -ForegroundColor Green
