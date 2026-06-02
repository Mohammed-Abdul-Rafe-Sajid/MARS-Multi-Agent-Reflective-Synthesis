"""
FastAPI routes — Section 8 endpoint specification.
All endpoints return typed JSON. Plain text is rejected.
"""

import uuid
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session as DBSession

from memory.database import get_db
from memory import repository
from utils.schemas import (
    RunQueryRequest, RunQueryResponse,
    GetResultResponse, GetMetricsResponse,
    GetIterationsResponse, HealthResponse,
    SessionStatus, AblationMode
)
from agents.citation_manager import export_bibtex
from api.orchestrator import run_pipeline

router = APIRouter()


# ── POST /run_query ────────────────────────────────────────────────────────────

@router.post(
    "/run_query",
    response_model=RunQueryResponse,
    status_code=202,
    summary="Submit a research query — starts the multi-agent pipeline",
)
def run_query(
    body: RunQueryRequest,
    background_tasks: BackgroundTasks,
    db: DBSession = Depends(get_db),
):
    """
    Section 8: Accepts query, ablation_mode, max_iterations.
    Returns session_id immediately. Pipeline runs as background task.
    """
    session_id = str(uuid.uuid4())

    repository.create_session(
        db=db,
        session_id=session_id,
        query_text=body.query_text,
        ablation_mode=body.ablation_mode,
        max_iterations=body.max_iterations,
    )

    background_tasks.add_task(
        run_pipeline,
        session_id=session_id,
        query_text=body.query_text,
        ablation_mode=body.ablation_mode,
        max_iterations=body.max_iterations,
        db=db,
    )

    return RunQueryResponse(
        session_id=session_id,
        status=SessionStatus.PENDING,
        estimated_iterations=body.max_iterations,
        ablation_mode=body.ablation_mode,
    )


# ── GET /get_result/{id} ───────────────────────────────────────────────────────

@router.get(
    "/get_result/{session_id}",
    response_model=GetResultResponse,
    summary="Retrieve the final structured research report",
)
def get_result(
    session_id: str,
    db: DBSession = Depends(get_db),
):
    """Section 8: Returns full typed report JSON for a completed session."""
    session = repository.get_session(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found.")

    report = repository.get_final_report(db, session_id)
    return GetResultResponse(
        session_id=session_id,
        status=SessionStatus(session.status),
        report=report,
    )


# ── GET /get_metrics/{id} ──────────────────────────────────────────────────────

@router.get(
    "/get_metrics/{session_id}",
    response_model=GetMetricsResponse,
    summary="Retrieve convergence and reliability metrics",
)
def get_metrics(
    session_id: str,
    db: DBSession = Depends(get_db),
):
    """Section 8: Metrics with per-iteration breakdown + retrieval_mode field."""
    session = repository.get_session(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found.")

    return GetMetricsResponse(
        session_id=session_id,
        metrics=repository.get_metrics(db, session_id),
        reflection_logs=repository.get_reflection_logs(db, session_id),
    )


# ── GET /get_iterations/{id} ──────────────────────────────────────────────────

@router.get(
    "/get_iterations/{session_id}",
    response_model=GetIterationsResponse,
    summary="Full iteration history with diffs and reflection logs",
)
def get_iterations(
    session_id: str,
    db: DBSession = Depends(get_db),
):
    """Section 8: Array of versioned synthesis objects."""
    session = repository.get_session(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found.")

    return GetIterationsResponse(
        session_id=session_id,
        iterations=repository.get_iterations(db, session_id),
    )


# ── GET /export_bibtex/{id} ───────────────────────────────────────────────────

@router.get(
    "/export_bibtex/{session_id}",
    response_class=PlainTextResponse,
    summary="Export BibTeX for all session references",
)
def export_bibtex_route(
    session_id: str,
    db: DBSession = Depends(get_db),
):
    """Section 8: Returns raw .bib file content."""
    session = repository.get_session(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found.")

    papers = repository.get_papers(db, session_id)
    if not papers:
        raise HTTPException(status_code=404, detail="No papers found for this session.")

    bib_content = export_bibtex(papers)
    return PlainTextResponse(
        content=bib_content,
        media_type="application/x-bibtex",
        headers={"Content-Disposition": f'attachment; filename="session_{session_id[:8]}.bib"'},
    )


# ── GET /health ────────────────────────────────────────────────────────────────

@router.get(
    "/health",
    response_model=HealthResponse,
    summary="System health check",
)
def health():
    return HealthResponse(status="ok", version="3.0.0")
