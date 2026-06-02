"""
Database layer — SQLAlchemy ORM.
Stores: sessions, iterations, claims, reflection logs, metrics.
All inter-module communication still uses Pydantic schemas;
ORM models are only for persistence.
"""

import json
from datetime import datetime
from sqlalchemy import (
    create_engine, Column, String, Integer, Float, Boolean,
    Text, DateTime, ForeignKey, Enum as SAEnum
)
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from config import settings
from loguru import logger

Base = declarative_base()
engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False} if "sqlite" in settings.database_url else {},
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# ── ORM Models ────────────────────────────────────────────────────────────────

class ResearchSession(Base):
    __tablename__ = "research_sessions"

    id             = Column(String, primary_key=True, index=True)
    query_text     = Column(Text, nullable=False)
    ablation_mode  = Column(String, default="both")
    max_iterations = Column(Integer, default=4)
    status         = Column(String, default="pending")
    planner_output = Column(Text, nullable=True)     # JSON
    final_report   = Column(Text, nullable=True)     # JSON
    metrics        = Column(Text, nullable=True)     # JSON
    created_at     = Column(DateTime, default=datetime.utcnow)
    completed_at   = Column(DateTime, nullable=True)

    iterations     = relationship("IterationModel", back_populates="session",
                                  cascade="all, delete-orphan",
                                  order_by="IterationModel.iteration_number")


class IterationModel(Base):
    __tablename__ = "research_iterations"

    id               = Column(Integer, primary_key=True, autoincrement=True)
    session_id       = Column(String, ForeignKey("research_sessions.id"), nullable=False)
    iteration_number = Column(Integer, nullable=False)
    synthesis_text   = Column(Text, default="")
    claims_json      = Column(Text, default="[]")         # JSON list of ClaimObject
    reflection_log   = Column(Text, nullable=True)        # JSON ReflectionLogObject
    claim_delta      = Column(Float, nullable=True)
    created_at       = Column(DateTime, default=datetime.utcnow)

    session = relationship("ResearchSession", back_populates="iterations")


class PaperModel(Base):
    __tablename__ = "papers"

    id          = Column(String, primary_key=True)
    session_id  = Column(String, ForeignKey("research_sessions.id"), nullable=False)
    paper_json  = Column(Text, default="{}")    # full PaperObject JSON
    created_at  = Column(DateTime, default=datetime.utcnow)


# ── Helpers ───────────────────────────────────────────────────────────────────

def init_db():
    logger.info("Initialising database tables...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database ready.")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
