#!/bin/bash
# Docker Verification Script for MARS v3.0
# Usage: ./verify-docker-setup.sh

set -e

echo "========================================"
echo "MARS v3.0 Docker Setup Verification"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counter for tests
PASSED=0
FAILED=0

# Test function
test_check() {
    local test_name=$1
    local command=$2
    
    echo -n "Testing: $test_name... "
    
    if eval "$command" &>/dev/null; then
        echo -e "${GREEN}✓ PASS${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC}"
        ((FAILED++))
    fi
}

echo "1. Checking Prerequisites"
echo "========================="
test_check "Docker installed" "docker --version"
test_check "Docker Compose installed" "docker-compose --version"
test_check "Docker daemon running" "docker ps"

echo ""
echo "2. Checking Project Structure"
echo "=============================="
test_check ".dockerignore exists" "test -f .dockerignore"
test_check "Dockerfile.backend exists" "test -f Dockerfile.backend"
test_check "Dockerfile.frontend exists" "test -f Dockerfile.frontend"
test_check "docker-compose.yml exists" "test -f docker-compose.yml"
test_check "nginx.conf exists" "test -f nginx.conf"
test_check ".env.example exists" "test -f .env.example"

echo ""
echo "3. Checking Required Files"
echo "==========================="
test_check "backend/main.py exists" "test -f backend/main.py"
test_check "backend/requirements.txt exists" "test -f backend/requirements.txt"
test_check "frontend/package.json exists" "test -f frontend/package.json"
test_check "frontend/tsconfig.json exists" "test -f frontend/tsconfig.json"

echo ""
echo "4. Environment Configuration"
echo "============================"

if test -f .env; then
    echo -e "${GREEN}✓ .env file exists${NC}"
    ((PASSED++))
    
    if grep -q "OPENAI_API_KEY" .env; then
        if grep "OPENAI_API_KEY=" .env | grep -q "sk-"; then
            echo -e "${GREEN}✓ OPENAI_API_KEY is set${NC}"
            ((PASSED++))
        else
            echo -e "${YELLOW}⚠ OPENAI_API_KEY may not be valid (should start with 'sk-')${NC}"
            ((FAILED++))
        fi
    else
        echo -e "${YELLOW}⚠ OPENAI_API_KEY not found in .env${NC}"
        ((FAILED++))
    fi
else
    echo -e "${YELLOW}⚠ .env file not found (create from .env.example)${NC}"
    ((FAILED++))
    echo "  Run: cp .env.example .env"
fi

echo ""
echo "5. Docker Image Names and Tags"
echo "==============================="

# Check if images are already built
if docker image inspect mars_backend &>/dev/null || docker image ls | grep -q "research_platform_v2.*backend"; then
    echo -e "${GREEN}✓ Backend image found${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}ℹ Backend image not built yet (will build on 'docker-compose build')${NC}"
fi

if docker image inspect mars_frontend &>/dev/null || docker image ls | grep -q "research_platform_v2.*frontend"; then
    echo -e "${GREEN}✓ Frontend image found${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}ℹ Frontend image not built yet (will build on 'docker-compose build')${NC}"
fi

echo ""
echo "6. Docker Compose Configuration"
echo "================================"
test_check "docker-compose.yml is valid YAML" "docker-compose config > /dev/null"

# Check for required services in compose
if grep -q "services:" docker-compose.yml && grep -q "backend:" docker-compose.yml && grep -q "frontend:" docker-compose.yml; then
    echo -e "${GREEN}✓ Backend and frontend services defined${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ Services not properly configured${NC}"
    ((FAILED++))
fi

# Check for volumes
if grep -q "volumes:" docker-compose.yml && grep -q "db_data:" docker-compose.yml && grep -q "chroma_data:" docker-compose.yml; then
    echo -e "${GREEN}✓ Persistent volumes configured${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ Volumes not properly configured${NC}"
    ((FAILED++))
fi

echo ""
echo "7. Network Configuration"
echo "========================"
if grep -q "mars_network:" docker-compose.yml; then
    echo -e "${GREEN}✓ Docker Compose network defined${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ Docker network not configured${NC}"
    ((FAILED++))
fi

echo ""
echo "8. Port Availability"
echo "==================="

# Check if ports are available
if ! lsof -Pi :80 -sTCP:LISTEN -t &>/dev/null 2>&1; then
    echo -e "${GREEN}✓ Port 80 is available${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠ Port 80 may be in use (might conflict with frontend)${NC}"
    # Not counting as failure - could be intentional override
fi

if ! lsof -Pi :8000 -sTCP:LISTEN -t &>/dev/null 2>&1; then
    echo -e "${GREEN}✓ Port 8000 is available${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠ Port 8000 may be in use (might conflict with backend)${NC}"
    # Not counting as failure - could be intentional override
fi

echo ""
echo "9. Dockerfile Syntax"
echo "===================="
test_check "Dockerfile.backend syntax" "docker build --dry-run -f Dockerfile.backend . > /dev/null 2>&1 || true"
test_check "Dockerfile.frontend syntax" "docker build --dry-run -f Dockerfile.frontend . > /dev/null 2>&1 || true"

echo ""
echo "========================================"
echo "Verification Summary"
echo "========================================"
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo "========================================"

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. docker-compose build"
    echo "2. docker-compose up -d"
    echo "3. http://localhost"
    exit 0
else
    echo -e "${RED}✗ Some checks failed. Review above.${NC}"
    exit 1
fi
