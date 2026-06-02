# Production Startup Script
# Runs both backend and frontend for production

$projectRoot = "C:\Users\abdul\Desktop\projects\MARS\research_platform_v2"
$venvPath = "$projectRoot\.venv\Scripts\python.exe"

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "MARS Research Platform v3.0 - Production Start" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Check if venv exists
if (-not (Test-Path $venvPath)) {
    Write-Host "ERROR: Virtual environment not found at $venvPath" -ForegroundColor Red
    exit 1
}

# Build frontend
Write-Host "Building frontend..." -ForegroundColor Yellow
Push-Location "$projectRoot\frontend"
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Frontend build failed!" -ForegroundColor Red
    exit 1
}
Pop-Location
Write-Host "✓ Frontend built successfully" -ForegroundColor Green
Write-Host ""

# Start backend (in new window)
Write-Host "Starting backend server..." -ForegroundColor Yellow
$backendStartScript = @"
cd $projectRoot\backend
&"$venvPath" -m uvicorn main:app --host 0.0.0.0 --port 8000
"@

$backendProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendStartScript -PassThru
Write-Host "✓ Backend started (PID: $($backendProcess.Id))" -ForegroundColor Green
Write-Host "  Available at: http://localhost:8000" -ForegroundColor Cyan
Write-Host "  API Docs: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""

# Start frontend (in new window)
Write-Host "Starting frontend server..." -ForegroundColor Yellow
$frontendStartScript = @"
cd $projectRoot\frontend
npm start
"@

$frontendProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendStartScript -PassThru
Write-Host "✓ Frontend started (PID: $($frontendProcess.Id))" -ForegroundColor Green
Write-Host "  Available at: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""

Write-Host "=====================================" -ForegroundColor Green
Write-Host "Application is running!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""
Write-Host "Frontend:  http://localhost:3000" -ForegroundColor Cyan
Write-Host "Backend:   http://localhost:8000" -ForegroundColor Cyan
Write-Host "Backend Docs: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press CTRL+C to stop all services" -ForegroundColor Yellow
Write-Host ""

# Keep script running
Read-Host "Press Enter to exit (this will stop both services)"

# Cleanup
Write-Host "Stopping services..." -ForegroundColor Yellow
Stop-Process -Id $backendProcess.Id -Force -ErrorAction SilentlyContinue
Stop-Process -Id $frontendProcess.Id -Force -ErrorAction SilentlyContinue
Write-Host "Services stopped." -ForegroundColor Green
