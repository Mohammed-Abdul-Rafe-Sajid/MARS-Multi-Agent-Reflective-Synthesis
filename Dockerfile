# ============================================================================
# Dockerfile - Backend Service (ROOT LEVEL - for Railway)
# ============================================================================
# Railway-optimized FastAPI backend container
# This file serves as the standard Dockerfile for Railway deployments
# It builds the backend service for the MARS platform
# ============================================================================

# Reference the backend-specific Dockerfile
# Railway will find this file at the repository root
FROM python:3.11-slim as builder

WORKDIR /build

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Copy requirements file
COPY backend/requirements.txt .

# Install Python dependencies to user site-packages
RUN pip install --user --no-warn-script-location \
    -r requirements.txt


# ============================================================================
# STAGE 2: Runtime - Final production image
# ============================================================================
FROM python:3.11-slim

WORKDIR /app

# Set environment variables for production
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PATH=/root/.local/bin:$PATH \
    PYTHONPATH=/app:$PYTHONPATH

# Install runtime system dependencies only
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy installed Python packages from builder stage
COPY --from=builder /root/.local /root/.local

# Copy backend source code
COPY backend/ .

# Create directories for data persistence
RUN mkdir -p /app/chromadb_store \
    && mkdir -p /app/data \
    && mkdir -p /app/logs

# Health check using Python
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:$PORT/health')" || exit 1

# Expose port - Railway sets PORT environment variable automatically
EXPOSE 8000

# Run FastAPI with Uvicorn - Railway uses PORT env variable
CMD ["python", "-m", "uvicorn", \
     "main:app", \
     "--host", "0.0.0.0", \
     "--port", "8000", \
     "--workers", "1", \
     "--log-level", "info"]
