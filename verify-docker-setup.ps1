# Docker Verification Script for MARS v3.0 (Windows PowerShell)
# Usage: .\verify-docker-setup.ps1

$ErrorActionPreference = "Continue"

Write-Host "========================================" -ForegroundColor White -BackgroundColor Black
Write-Host "MARS v3.0 Docker Setup Verification" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor White -BackgroundColor Black
Write-Host ""

# Counters
$passed = 0
$failed = 0

# Test function
function Test-Check {
    param(
        [string]$TestName,
        [scriptblock]$Command
    )
    
    Write-Host -NoNewline "Testing: $TestName... "
    
    try {
        $result = & $Command 2>$null
        if ($result -or $LASTEXITCODE -eq 0) {
            Write-Host "✓ PASS" -ForegroundColor Green
            $script:passed++
        } else {
            Write-Host "✗ FAIL" -ForegroundColor Red
            $script:failed++
        }
    } catch {
        Write-Host "✗ FAIL" -ForegroundColor Red
        $script:failed++
    }
}

Write-Host "1. Checking Prerequisites" -ForegroundColor Yellow
Write-Host "=========================" -ForegroundColor Yellow
Test-Check "Docker installed" { docker --version }
Test-Check "Docker Compose installed" { docker-compose --version }
Test-Check "Docker daemon running" { docker ps }

Write-Host ""
Write-Host "2. Checking Project Structure" -ForegroundColor Yellow
Write-Host "==============================" -ForegroundColor Yellow
Test-Check ".dockerignore exists" { Test-Path ".dockerignore" }
Test-Check "Dockerfile.backend exists" { Test-Path "Dockerfile.backend" }
Test-Check "Dockerfile.frontend exists" { Test-Path "Dockerfile.frontend" }
Test-Check "docker-compose.yml exists" { Test-Path "docker-compose.yml" }
Test-Check "nginx.conf exists" { Test-Path "nginx.conf" }
Test-Check ".env.example exists" { Test-Path ".env.example" }

Write-Host ""
Write-Host "3. Checking Required Files" -ForegroundColor Yellow
Write-Host "===========================" -ForegroundColor Yellow
Test-Check "backend/main.py exists" { Test-Path "backend/main.py" }
Test-Check "backend/requirements.txt exists" { Test-Path "backend/requirements.txt" }
Test-Check "frontend/package.json exists" { Test-Path "frontend/package.json" }
Test-Check "frontend/tsconfig.json exists" { Test-Path "frontend/tsconfig.json" }

Write-Host ""
Write-Host "4. Environment Configuration" -ForegroundColor Yellow
Write-Host "============================" -ForegroundColor Yellow

if (Test-Path ".env") {
    Write-Host "✓ .env file exists" -ForegroundColor Green
    $script:passed++
    
    $envContent = Get-Content ".env"
    if ($envContent -match "OPENAI_API_KEY") {
        if ($envContent -match "OPENAI_API_KEY=sk-") {
            Write-Host "✓ OPENAI_API_KEY is set" -ForegroundColor Green
            $script:passed++
        } else {
            Write-Host "⚠ OPENAI_API_KEY may not be valid (should start with 'sk-')" -ForegroundColor Yellow
            $script:failed++
        }
    } else {
        Write-Host "⚠ OPENAI_API_KEY not found in .env" -ForegroundColor Yellow
        $script:failed++
    }
} else {
    Write-Host "⚠ .env file not found (create from .env.example)" -ForegroundColor Yellow
    $script:failed++
    Write-Host "  Run: copy .env.example .env"
}

Write-Host ""
Write-Host "5. Docker Image Status" -ForegroundColor Yellow
Write-Host "======================" -ForegroundColor Yellow

$backendImage = docker images 2>$null | Select-String "research_platform_v2.*backend|mars_backend"
$frontendImage = docker images 2>$null | Select-String "research_platform_v2.*frontend|mars_frontend"

if ($backendImage) {
    Write-Host "✓ Backend image found" -ForegroundColor Green
    $script:passed++
} else {
    Write-Host "ℹ Backend image not built yet (will build on 'docker-compose build')" -ForegroundColor Cyan
}

if ($frontendImage) {
    Write-Host "✓ Frontend image found" -ForegroundColor Green
    $script:passed++
} else {
    Write-Host "ℹ Frontend image not built yet (will build on 'docker-compose build')" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "6. Docker Compose Configuration" -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor Yellow

try {
    $composeConfig = docker-compose config 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ docker-compose.yml is valid YAML" -ForegroundColor Green
        $script:passed++
    } else {
        Write-Host "✗ docker-compose.yml validation failed" -ForegroundColor Red
        Write-Host "  Error: $composeConfig" -ForegroundColor Red
        $script:failed++
    }
} catch {
    Write-Host "✗ Could not validate docker-compose.yml" -ForegroundColor Red
    $script:failed++
}

# Check for services
$composeContent = Get-Content "docker-compose.yml"
if ($composeContent -match "services:" -and $composeContent -match "backend:" -and $composeContent -match "frontend:") {
    Write-Host "✓ Backend and frontend services defined" -ForegroundColor Green
    $script:passed++
} else {
    Write-Host "✗ Services not properly configured" -ForegroundColor Red
    $script:failed++
}

# Check for volumes
if ($composeContent -match "volumes:" -and $composeContent -match "db_data:" -and $composeContent -match "chroma_data:") {
    Write-Host "✓ Persistent volumes configured" -ForegroundColor Green
    $script:passed++
} else {
    Write-Host "✗ Volumes not properly configured" -ForegroundColor Red
    $script:failed++
}

Write-Host ""
Write-Host "7. Network Configuration" -ForegroundColor Yellow
Write-Host "========================" -ForegroundColor Yellow
if ($composeContent -match "mars_network:") {
    Write-Host "✓ Docker Compose network defined" -ForegroundColor Green
    $script:passed++
} else {
    Write-Host "✗ Docker network not configured" -ForegroundColor Red
    $script:failed++
}

Write-Host ""
Write-Host "8. Port Availability (Windows)" -ForegroundColor Yellow
Write-Host "==============================" -ForegroundColor Yellow

try {
    $port80 = netstat -an 2>$null | Select-String ":80\s" | Select-String "LISTEN"
    if ($port80) {
        Write-Host "⚠ Port 80 may already be in use" -ForegroundColor Yellow
    } else {
        Write-Host "✓ Port 80 is available" -ForegroundColor Green
        $script:passed++
    }
} catch {
    Write-Host "ℹ Could not determine port 80 status" -ForegroundColor Cyan
}

try {
    $port8000 = netstat -an 2>$null | Select-String ":8000\s" | Select-String "LISTEN"
    if ($port8000) {
        Write-Host "⚠ Port 8000 may already be in use" -ForegroundColor Yellow
    } else {
        Write-Host "✓ Port 8000 is available" -ForegroundColor Green
        $script:passed++
    }
} catch {
    Write-Host "ℹ Could not determine port 8000 status" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "9. Content Verification" -ForegroundColor Yellow
Write-Host "=======================" -ForegroundColor Yellow

# Check Dockerfile.backend content
$backendDockerfile = Get-Content "Dockerfile.backend" | Out-String
if ($backendDockerfile -match "python:3.11-slim" -and $backendDockerfile -match "uvicorn") {
    Write-Host "✓ Dockerfile.backend looks correct" -ForegroundColor Green
    $script:passed++
} else {
    Write-Host "⚠ Dockerfile.backend may have issues" -ForegroundColor Yellow
    $script:failed++
}

# Check Dockerfile.frontend content
$frontendDockerfile = Get-Content "Dockerfile.frontend" | Out-String
if ($frontendDockerfile -match "node:22" -and $frontendDockerfile -match "nginx:alpine") {
    Write-Host "✓ Dockerfile.frontend looks correct" -ForegroundColor Green
    $script:passed++
} else {
    Write-Host "⚠ Dockerfile.frontend may have issues" -ForegroundColor Yellow
    $script:failed++
}

# Check nginx.conf content
$nginxConf = Get-Content "nginx.conf" | Out-String
if ($nginxConf -match "server\s+{" -and $nginxConf -match "upstream backend") {
    Write-Host "✓ nginx.conf looks correct" -ForegroundColor Green
    $script:passed++
} else {
    Write-Host "⚠ nginx.conf may have issues" -ForegroundColor Yellow
    $script:failed++
}

Write-Host ""
Write-Host "========================================" -ForegroundColor White -BackgroundColor Black
Write-Host "Verification Summary" -ForegroundColor Cyan -BackgroundColor Black
Write-Host "========================================" -ForegroundColor White -BackgroundColor Black
Write-Host "Passed: $passed" -ForegroundColor Green
Write-Host "Failed: $failed" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor White -BackgroundColor Black

if ($failed -eq 0) {
    Write-Host ""
    Write-Host "✓ All critical checks passed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. docker-compose build" -ForegroundColor White
    Write-Host "2. docker-compose up -d" -ForegroundColor White
    Write-Host "3. http://localhost (in your browser)" -ForegroundColor White
    Write-Host ""
    exit 0
} else {
    Write-Host ""
    Write-Host "✗ Some checks failed. Review above." -ForegroundColor Red
    exit 1
}
