"""
Canonical data schemas — Appendix A (v3.0).
ALL inter-module communication uses these models exclusively.
"""

from __future__ import annotations
from enum import Enum
from typing import List, Optional, Dict
from pydantic import BaseModel, Field, field_validator, model_validator
from datetime import datetime


class ClaimType(str, Enum):
    METHOD     = "method"
    RESULT     = "result"
    LIMITATION = "limitation"
    COMPARISON = "comparison"

class VerificationStatus(str, Enum):
    VERIFIED     = "verified"
    WEAK         = "weak"
    CONTRADICTED = "contradicted"

class EvidenceDepth(str, Enum):
    ABSTRACT_ONLY = "abstract_only"
    RAG_ENRICHED  = "rag_enriched"

class SourceType(str, Enum):
    ABSTRACT  = "abstract"
    RAG_CHUNK = "rag_chunk"

class QueryType(str, Enum):
    SURVEY       = "survey"
    COMPARISON   = "comparison"
    GAP_ANALYSIS = "gap_analysis"

class RetrievalDepth(str, Enum):
    SHALLOW = "shallow"
    DEEP    = "deep"

class AblationMode(str, Enum):
    API_ONLY = "api_only"
    RAG_ONLY = "rag_only"
    BOTH     = "both"

class ReflectionStrategy(str, Enum):
    REWRITE_SYNTHESIS = "rewrite_synthesis"
    RETRIEVE_EVIDENCE = "retrieve_evidence"
    NARROW_SCOPE      = "narrow_scope"
    FLAG_UNCERTAINTY  = "flag_uncertainty"

class SessionStatus(str, Enum):
    PENDING    = "pending"
    RUNNING    = "running"
    REFLECTING = "reflecting"
    DONE       = "done"
    FAILED     = "failed"


class EvidenceObject(BaseModel):
    text:        str
    paper_id:    str
    chunk_id:    Optional[str] = None
    source_type: SourceType


class PaperObject(BaseModel):
    id:                str
    title:             str
    authors:           List[str]
    year:              int
    abstract:          str
    url:               str
    doi:               Optional[str] = None
    arxiv_link:        Optional[str] = None
    extracted_claims:  List[str] = Field(default_factory=list)
    evidence_snippets: List[EvidenceObject] = Field(default_factory=list)
    chunk_ids:         List[str] = Field(default_factory=list)
    rag_available:     bool = False


class ClaimObject(BaseModel):
    claim_id:             str
    claim_text:           str
    claim_type:           ClaimType
    supporting_paper_ids: List[str]
    supporting_chunks:    List[str] = Field(default_factory=list)
    support_strength:     float = Field(..., ge=0.0, le=1.0)
    confidence_score:     float = Field(..., ge=0.0, le=1.0)
    verification_status:  VerificationStatus
    iteration_version:    int
    evidence_depth:       EvidenceDepth = EvidenceDepth.ABSTRACT_ONLY

    @field_validator("supporting_paper_ids")
    @classmethod
    def must_have_papers(cls, v: List[str]) -> List[str]:
        if not v:
            raise ValueError("supporting_paper_ids must not be empty — no uncited claims (Section 0.9)")
        return v


class MetricsSnapshot(BaseModel):
    total_claims:            int
    verified_pct:            float
    weak_pct:                float
    contradicted_pct:        float
    avg_support_strength:    float
    rag_enriched_claims_pct: float


class ReflectionLogObject(BaseModel):
    iteration:         int
    strategy:          ReflectionStrategy
    reason:            str
    changed_claim_ids: List[str]
    new_paper_ids:     List[str] = Field(default_factory=list)
    new_chunk_ids:     List[str] = Field(default_factory=list)
    metrics_before:    MetricsSnapshot
    metrics_after:     MetricsSnapshot
    claim_delta:       float


class SessionMetrics(BaseModel):
    session_id:                  str
    total_papers:                int
    total_claims:                int
    rag_enriched_claims_pct:     float
    strongly_supported_pct:      float
    weakly_supported_pct:        float
    insufficient_evidence_pct:   float
    iterations_to_convergence:   int
    hallucination_reduction_pct: float
    avg_papers_per_claim:        float
    retrieval_mode:              AblationMode


class PaperChunk(BaseModel):
    chunk_id:    str
    paper_id:    str
    session_id:  str
    text:        str
    embedding:   List[float] = Field(default_factory=list)
    token_start: int
    token_end:   int
    chunk_index: int


class RAGQueryResultItem(BaseModel):
    chunk_id:         str
    paper_id:         str
    similarity_score: float
    text:             str


class RAGQueryResult(BaseModel):
    query_text: str
    top_k:      int
    results:    List[RAGQueryResultItem]


class PlannerOutput(BaseModel):
    query:                 str
    themes:                List[str]
    comparison_dimensions: List[str]
    query_type:            QueryType
    retrieval_depth:       RetrievalDepth

    @model_validator(mode="after")
    def check_comparison_dims(self) -> "PlannerOutput":
        if self.query_type == QueryType.SURVEY and self.comparison_dimensions:
            raise ValueError("comparison_dimensions must be [] when query_type is 'survey'")
        return self


class StructuredReport(BaseModel):
    executive_summary:    str
    thematic_sections:    Dict[str, str]
    comparative_table:    Optional[str] = None
    limitations_and_gaps: str
    confidence_metrics:   str
    references:           List[PaperObject]


class RunQueryRequest(BaseModel):
    query_text:     str = Field(..., min_length=5)
    ablation_mode:  AblationMode = AblationMode.BOTH
    max_iterations: int = Field(default=4, ge=1, le=4)


class RunQueryResponse(BaseModel):
    session_id:           str
    status:               SessionStatus
    estimated_iterations: int
    ablation_mode:        AblationMode


class IterationSnapshot(BaseModel):
    iteration_number: int
    synthesis_text:   str
    claims:           List[ClaimObject]
    reflection_log:   Optional[ReflectionLogObject] = None
    claim_delta:      Optional[float] = None


class GetResultResponse(BaseModel):
    session_id: str
    status:     SessionStatus
    report:     Optional[StructuredReport] = None


class GetMetricsResponse(BaseModel):
    session_id:      str
    metrics:         Optional[SessionMetrics] = None
    reflection_logs: List[ReflectionLogObject] = Field(default_factory=list)


class GetIterationsResponse(BaseModel):
    session_id: str
    iterations: List[IterationSnapshot]


class HealthResponse(BaseModel):
    status:  str
    version: str
