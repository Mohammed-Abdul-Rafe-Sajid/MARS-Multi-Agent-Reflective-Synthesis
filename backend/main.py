"""
Self-Reflective Multi-Agent AI Research Platform — v3.0
FastAPI application entry point.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger

from memory.database import init_db
from api.routes import router

app = FastAPI(
    title="Self-Reflective Multi-Agent AI Research Platform",
    description=(
        "A formally specified, citation-enforced, self-reflective AI research system "
        "with hybrid dual retrieval (arXiv API + ChromaDB RAG), policy-driven reflection, "
        "and measurable reliability dynamics. v3.0"
    ),
    version="3.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],           # tighten to frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    logger.info("Starting Self-Reflective Multi-Agent Research Platform v3.0")
    init_db()
    logger.info("Database initialised. Server ready.")


@app.get("/health")
async def health_check():
    """Health check endpoint for container orchestration."""
    return {"status": "ok", "version": "3.0.0"}


app.include_router(router, prefix="/api/v1")
