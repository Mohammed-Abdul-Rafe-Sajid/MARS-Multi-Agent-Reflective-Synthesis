"""
Evaluation Engine — Section 5
Computes all research metrics defined in Section 5 (Table).
Metrics are computed from stored session data — reproducible across runs.
"""

from utils.schemas import (
    ClaimObject, VerificationStatus, EvidenceDepth,
    SessionMetrics, ReflectionLogObject, AblationMode, MetricsSnapshot
)


def compute_session_metrics(
    session_id: str,
    papers: list,
    claims_initial: list[ClaimObject],
    claims_final: list[ClaimObject],
    reflection_logs: list[ReflectionLogObject],
    ablation_mode: AblationMode,
) -> SessionMetrics:
    """
    Compute all Section 5 metrics for a completed session.
    """
    total = max(len(claims_final), 1)

    # Hallucination reduction — % flagged claims before vs after (Section 5)
    initial_unverified = sum(
        1 for c in claims_initial
        if c.verification_status != VerificationStatus.VERIFIED
    )
    final_unverified = sum(
        1 for c in claims_final
        if c.verification_status != VerificationStatus.VERIFIED
    )
    initial_total = max(len(claims_initial), 1)
    hallucination_reduction = round(
        (initial_unverified / initial_total - final_unverified / total) * 100, 2
    )

    # Evidence coverage — avg papers per verified claim
    verified_claims = [c for c in claims_final if c.verification_status == VerificationStatus.VERIFIED]
    avg_papers = (
        sum(len(c.supporting_paper_ids) for c in verified_claims) / max(len(verified_claims), 1)
    )

    # RAG enrichment
    rag_n = sum(1 for c in claims_final if c.evidence_depth == EvidenceDepth.RAG_ENRICHED)

    # Claim support breakdown
    strong_n = sum(1 for c in claims_final if c.verification_status == VerificationStatus.VERIFIED)
    weak_n   = sum(1 for c in claims_final if c.verification_status == VerificationStatus.WEAK)

    return SessionMetrics(
        session_id=session_id,
        total_papers=len(papers),
        total_claims=total,
        rag_enriched_claims_pct=round(rag_n / total * 100, 2),
        strongly_supported_pct=round(strong_n / total * 100, 2),
        weakly_supported_pct=round(weak_n / total * 100, 2),
        insufficient_evidence_pct=round(
            (total - strong_n - weak_n) / total * 100, 2
        ),
        iterations_to_convergence=len(reflection_logs),
        hallucination_reduction_pct=max(0.0, hallucination_reduction),
        avg_papers_per_claim=round(avg_papers, 2),
        retrieval_mode=ablation_mode,
    )
