"""
Repository — all DB read/write operations.
Route handlers never touch ORM models directly.
"""

import json
from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session as DBSession

from memory.database import ResearchSession, IterationModel, PaperModel
from utils.schemas import (
    SessionStatus, PlannerOutput, StructuredReport,
    ClaimObject, ReflectionLogObject, SessionMetrics,
    PaperObject, IterationSnapshot, AblationMode
)


# ── Session ────────────────────────────────────────────────────────────────────

def create_session(
    db: DBSession,
    session_id: str,
    query_text: str,
    ablation_mode: AblationMode,
    max_iterations: int,
) -> ResearchSession:
    s = ResearchSession(
        id=session_id,
        query_text=query_text,
        ablation_mode=ablation_mode.value,
        max_iterations=max_iterations,
        status=SessionStatus.PENDING.value,
    )
    db.add(s)
    db.commit()
    db.refresh(s)
    return s


def get_session(db: DBSession, session_id: str) -> Optional[ResearchSession]:
    return db.query(ResearchSession).filter(ResearchSession.id == session_id).first()


def list_sessions(db: DBSession, skip: int = 0, limit: int = 50) -> list[ResearchSession]:
    return (
        db.query(ResearchSession)
        .order_by(ResearchSession.created_at.desc())
        .offset(skip).limit(limit).all()
    )


def update_status(db: DBSession, session_id: str, status: SessionStatus):
    db.query(ResearchSession).filter(ResearchSession.id == session_id).update(
        {"status": status.value}
    )
    db.commit()


def save_planner_output(db: DBSession, session_id: str, plan: PlannerOutput):
    db.query(ResearchSession).filter(ResearchSession.id == session_id).update(
        {"planner_output": plan.model_dump_json()}
    )
    db.commit()


def finalize(
    db: DBSession,
    session_id: str,
    report: StructuredReport,
    metrics: SessionMetrics,
):
    db.query(ResearchSession).filter(ResearchSession.id == session_id).update({
        "status": SessionStatus.DONE.value,
        "final_report": report.model_dump_json(),
        "metrics": metrics.model_dump_json(),
        "completed_at": datetime.utcnow(),
    })
    db.commit()


def fail_session(db: DBSession, session_id: str):
    db.query(ResearchSession).filter(ResearchSession.id == session_id).update({
        "status": SessionStatus.FAILED.value,
        "completed_at": datetime.utcnow(),
    })
    db.commit()


# ── Iterations ─────────────────────────────────────────────────────────────────

def save_iteration(
    db: DBSession,
    session_id: str,
    iteration_number: int,
    synthesis_text: str,
    claims: list[ClaimObject],
    reflection_log: Optional[ReflectionLogObject],
    claim_delta: Optional[float],
):
    model = IterationModel(
        session_id=session_id,
        iteration_number=iteration_number,
        synthesis_text=synthesis_text,
        claims_json=json.dumps([c.model_dump() for c in claims]),
        reflection_log=reflection_log.model_dump_json() if reflection_log else None,
        claim_delta=claim_delta,
    )
    db.add(model)
    db.commit()


# ── Papers ─────────────────────────────────────────────────────────────────────

def save_papers(db: DBSession, session_id: str, papers: list[PaperObject]):
    for p in papers:
        db.merge(PaperModel(
            id=p.id,
            session_id=session_id,
            paper_json=p.model_dump_json(),
        ))
    db.commit()


def get_papers(db: DBSession, session_id: str) -> list[PaperObject]:
    rows = db.query(PaperModel).filter(PaperModel.session_id == session_id).all()
    return [PaperObject(**json.loads(r.paper_json)) for r in rows]


# ── Response builders ──────────────────────────────────────────────────────────

def get_iterations(db: DBSession, session_id: str) -> list[IterationSnapshot]:
    rows = db.query(IterationModel).filter(
        IterationModel.session_id == session_id
    ).order_by(IterationModel.iteration_number).all()

    snapshots = []
    for row in rows:
        claims = [ClaimObject(**c) for c in json.loads(row.claims_json or "[]")]
        rlog = ReflectionLogObject(**json.loads(row.reflection_log)) if row.reflection_log else None
        snapshots.append(IterationSnapshot(
            iteration_number=row.iteration_number,
            synthesis_text=row.synthesis_text or "",
            claims=claims,
            reflection_log=rlog,
            claim_delta=row.claim_delta,
        ))
    return snapshots


def get_metrics(db: DBSession, session_id: str) -> Optional[SessionMetrics]:
    session = get_session(db, session_id)
    if not session or not session.metrics:
        return None
    return SessionMetrics(**json.loads(session.metrics))


def get_final_report(db: DBSession, session_id: str) -> Optional[StructuredReport]:
    session = get_session(db, session_id)
    if not session or not session.final_report:
        return None
    return StructuredReport(**json.loads(session.final_report))


def get_reflection_logs(db: DBSession, session_id: str) -> list[ReflectionLogObject]:
    rows = db.query(IterationModel).filter(
        IterationModel.session_id == session_id,
        IterationModel.reflection_log.isnot(None),
    ).all()
    return [ReflectionLogObject(**json.loads(r.reflection_log)) for r in rows]
