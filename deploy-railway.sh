#!/bin/bash

# ============================================================================
# Railway Deployment Helper Script
# ============================================================================
# Automates the process of deploying MARS to Railway.app
# Run this script after configuring Railway project
# ============================================================================

set -e  # Exit on error

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║           MARS v3.0 Railway Deployment Helper                 ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# ============================================================================
# Configuration
# ============================================================================

BACKEND_SERVICE="mars-backend"
FRONTEND_SERVICE="mars-frontend"
DOCKER_REGISTRY="railway"

# ============================================================================
# Functions
# ============================================================================

check_command() {
    if ! command -v "$1" &> /dev/null; then
        echo "❌ Error: '$1' is not installed. Please install it first."
        exit 1
    fi
}

verify_dockerfile() {
    echo "📋 Checking Docker configuration..."
    
    if [ ! -f "Dockerfile" ]; then
        echo "❌ Error: Root Dockerfile not found!"
        echo "   Expected: ./Dockerfile"
        exit 1
    fi
    
    if [ ! -f "Dockerfile.frontend" ]; then
        echo "❌ Error: Frontend Dockerfile not found!"
        echo "   Expected: ./Dockerfile.frontend"
        exit 1
    fi
    
    if [ ! -f "railway.toml" ]; then
        echo "❌ Error: railway.toml not found!"
        echo "   Expected: ./railway.toml"
        exit 1
    fi
    
    if [ ! -f "nginx.conf" ]; then
        echo "❌ Error: nginx.conf not found!"
        echo "   Expected: ./nginx.conf"
        exit 1
    fi
    
    echo "✅ All Docker files present"
}

verify_backend_files() {
    echo "📋 Checking backend files..."
    
    if [ ! -f "backend/requirements.txt" ]; then
        echo "❌ Error: backend/requirements.txt not found!"
        exit 1
    fi
    
    if [ ! -f "backend/main.py" ]; then
        echo "❌ Error: backend/main.py not found!"
        exit 1
    fi
    
    if [ ! -f "backend/config.py" ]; then
        echo "❌ Error: backend/config.py not found!"
        exit 1
    fi
    
    echo "✅ All backend files present"
}

verify_frontend_files() {
    echo "📋 Checking frontend files..."
    
    if [ ! -f "frontend/package.json" ]; then
        echo "❌ Error: frontend/package.json not found!"
        exit 1
    fi
    
    if [ ! -d "frontend/src" ]; then
        echo "❌ Error: frontend/src directory not found!"
        exit 1
    fi
    
    echo "✅ All frontend files present"
}

check_git_status() {
    echo "📋 Checking git status..."
    
    if ! git diff --quiet; then
        echo "⚠️  Warning: Uncommitted changes detected"
        echo "   Run 'git status' to see changes"
        echo ""
        read -p "Continue? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    echo "✅ Git status clean"
}

verify_env_secrets() {
    echo "📋 Checking for exposed secrets..."
    
    if grep -r "sk-proj-" . --include="*.py" --include="*.tsx" --include="*.ts" --include="*.toml" --include="*.json" 2>/dev/null | grep -v ".git" | grep -v "node_modules" > /dev/null; then
        echo "❌ Error: Real OpenAI API key detected in files!"
        echo "   DO NOT commit real secrets!"
        exit 1
    fi
    
    if [ -f ".env" ] && grep -q "OPENAI_API_KEY" .env 2>/dev/null; then
        echo "❌ Error: .env file found with secrets!"
        echo "   Verify .env is in .gitignore"
        exit 1
    fi
    
    echo "✅ No exposed secrets detected"
}

build_backend_local() {
    echo ""
    echo "🏗️  Building backend Docker image locally..."
    
    if docker build -f Dockerfile -t mars-backend:test . > /dev/null 2>&1; then
        echo "✅ Backend Docker build successful"
    else
        echo "❌ Backend Docker build failed"
        echo "   Run: docker build -f Dockerfile -t mars-backend:test ."
        exit 1
    fi
}

build_frontend_local() {
    echo ""
    echo "🏗️  Building frontend Docker image locally..."
    
    if docker build -f Dockerfile.frontend -t mars-frontend:test . > /dev/null 2>&1; then
        echo "✅ Frontend Docker build successful"
    else
        echo "❌ Frontend Docker build failed"
        echo "   Run: docker build -f Dockerfile.frontend -t mars-frontend:test ."
        exit 1
    fi
}

verify_railway_config() {
    echo ""
    echo "📋 Verifying Railway configuration..."
    
    # Check railway.toml for required sections
    if grep -q "\[build\]" railway.toml && \
       grep -q "dockerfile = \"Dockerfile\"" railway.toml && \
       grep -q "\[deploy\]" railway.toml && \
       grep -q "healthcheckPath = \"/health\"" railway.toml; then
        echo "✅ railway.toml properly configured"
    else
        echo "⚠️  Warning: railway.toml may be missing required configuration"
        echo "   Verify by reviewing: railway.toml"
    fi
}

push_to_github() {
    echo ""
    echo "📤 Pushing changes to GitHub..."
    
    if [ ! -d ".git" ]; then
        echo "❌ Error: Not a git repository!"
        exit 1
    fi
    
    # Get current branch
    BRANCH=$(git rev-parse --abbrev-ref HEAD)
    
    echo "   Branch: $BRANCH"
    
    if git add -A && git commit -m "🚀 Deploy to Railway"; then
        echo "   Committed changes"
    else
        echo "   No changes to commit (or already committed)"
    fi
    
    if git push origin "$BRANCH"; then
        echo "✅ Pushed to GitHub"
    else
        echo "❌ GitHub push failed"
        exit 1
    fi
}

summary() {
    echo ""
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║                  DEPLOYMENT CHECKLIST                         ║"
    echo "╚════════════════════════════════════════════════════════════════╝"
    echo ""
    echo "✅ Local Prerequisites Complete"
    echo ""
    echo "📋 Configure in Railway Dashboard:"
    echo ""
    echo "   1. Backend Service (mars-backend)"
    echo "      - GitHub: Connect your repository"
    echo "      - Branch: main"
    echo "      - Dockerfile: Dockerfile (at root)"
    echo "      - Build: Should auto-trigger on git push"
    echo ""
    echo "   2. Frontend Service (mars-frontend)"
    echo "      - Dockerfile: Dockerfile.frontend"
    echo "      - Build: Should auto-trigger on git push"
    echo ""
    echo "   3. Environment Variables (Railway Dashboard)"
    echo "      - OPENAI_API_KEY = sk-proj-your_key_here (SECRET)"
    echo "      - LLM_MODEL = gpt-4o"
    echo "      - All other vars in railway.toml (optional, can override)"
    echo ""
    echo "   4. Verify URLs After Deploy"
    echo "      - Backend: https://mars-backend-xxx.railway.app/health"
    echo "      - Frontend: https://mars-frontend-xxx.railway.app"
    echo ""
    echo "📚 Full guide: RAILWAY_DEPLOYMENT.md"
    echo ""
}

# ============================================================================
# Main Execution
# ============================================================================

main() {
    echo ""
    
    # Check prerequisites
    check_command "git"
    check_command "docker"
    
    # Verify files
    verify_dockerfile
    verify_backend_files
    verify_frontend_files
    
    # Check git and secrets
    check_git_status
    verify_env_secrets
    
    # Local Docker builds
    read -p "Test build Docker images locally first? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        build_backend_local
        build_frontend_local
    fi
    
    # Verify Railway config
    verify_railway_config
    
    # Push to GitHub
    echo ""
    echo "🚀 Ready to deploy to Railway!"
    echo ""
    read -p "Push to GitHub and trigger Railway deployment? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        push_to_github
        summary
    else
        echo "❌ Deployment skipped"
        exit 0
    fi
}

# Run main
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    main
fi
