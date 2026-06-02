"""
Reflection Policy Engine — Section 3.7 / Section 0.5

Fixes applied:
- select_strategy no longer triggers RETRIEVE_EVIDENCE when weak_ratio is
  high but claims already have papers (arXiv reality — they always cite 1 paper).
  Instead it correctly differentiates:
    * weak_ratio high + papers present → REWRITE_SYNTHESIS
    * insufficient papers (0 citing papers) → RETRIEVE_EVIDENCE
- has_converged skips iteration 1 (enforced by orchestrator)
"""

from loguru import logger
from utils.schemas import (
    ClaimObject, VerificationStatus, ReflectionStrategy,
    ReflectionLogObject, MetricsSnapshot,
)
from config import settings


def _build_snapshot(claims: list[ClaimObject]) -> MetricsSnapshot:
    total = max(len(claims), 1)
    ver  = sum(1 for c in claims if c.verification_status == VerificationStatus.VERIFIED)
    weak = sum(1 for c in claims if c.verification_status == VerificationStatus.WEAK)
    cont = sum(1 for c in claims if c.verification_status == VerificationStatus.CONTRADICTED)
    rag  = sum(1 for c in claims if c.evidence_depth.value == "rag_enriched")
    avg_s = sum(c.support_strength for c in claims) / total
    return MetricsSnapshot(
        total_claims=total,
        verified_pct=round(ver / total * 100, 2),
        weak_pct=round(weak / total * 100, 2),
        contradicted_pct=round(cont / total * 100, 2),
        avg_support_strength=round(avg_s, 4),
        rag_enriched_claims_pct=round(rag / total * 100, 2),
    )


def compute_claim_delta(
    claims_before: list[ClaimObject],
    claims_after: list[ClaimObject],
) -> float:
    """
    §0.8 convergence formula.
    delta = (status_changes + added_ids + removed_ids) / total_before
    """
    if not claims_before:
        return 1.0

    before_map = {c.claim_id: c.verification_status for c in claims_before}
    after_ids  = {c.claim_id for c in claims_after}
    before_ids = {c.claim_id for c in claims_before}

    changed = sum(
        1 for c in claims_after
        if c.claim_id in before_map
        and before_map[c.claim_id] != c.verification_status
    )
    added   = len(after_ids - before_ids)
    removed = len(before_ids - after_ids)

    delta = (changed + added + removed) / len(claims_before)
    return round(delta, 4)


def select_strategy(claims: list[ClaimObject]) -> tuple[ReflectionStrategy, str]:
    """
    §0.5 — select exactly ONE strategy per iteration.

    Key fix: claims from arXiv abstracts always have 1 supporting paper.
    We must NOT trigger RETRIEVE_EVIDENCE just because n_papers < 2;
    instead we check for claims with ZERO papers in our retrieved set.
    """
    total = max(len(claims), 1)
    threshold = settings.weak_claim_ratio_threshold

    weak_claims  = [c for c in claims if c.verification_status == VerificationStatus.WEAK]
    cont_claims  = [c for c in claims if c.verification_status == VerificationStatus.CONTRADICTED]
    # True "no evidence" = claim cites 0 papers at all
    no_evidence  = [c for c in claims if len(c.supporting_paper_ids) == 0]

    weak_ratio       = len(weak_claims) / total
    no_evidence_ratio = len(no_evidence) / total

    if no_evidence_ratio > threshold:
        return (
            ReflectionStrategy.RETRIEVE_EVIDENCE,
            f"{no_evidence_ratio:.0%} of claims have zero supporting papers — retrieving more evidence",
        )
    elif weak_ratio > threshold:
        return (
            ReflectionStrategy.REWRITE_SYNTHESIS,
            f"Weak claim ratio {weak_ratio:.0%} > threshold {threshold:.0%} — rewriting synthesis",
        )
    elif cont_claims:
        return (
            ReflectionStrategy.FLAG_UNCERTAINTY,
            f"{len(cont_claims)} contradicted claims — flagging irreducible uncertainty",
        )
    else:
        return (
            ReflectionStrategy.REWRITE_SYNTHESIS,
            "Quality improvement iteration — refining synthesis",
        )


def build_reflection_log(
    iteration: int,
    strategy: ReflectionStrategy,
    reason: str,
    claims_before: list[ClaimObject],
    claims_after: list[ClaimObject],
    new_paper_ids: list[str] | None = None,
    new_chunk_ids: list[str] | None = None,
) -> ReflectionLogObject:
    delta = compute_claim_delta(claims_before, claims_after)
    changed_ids = [
        c.claim_id for c in claims_after
        if any(
            b.claim_id == c.claim_id and b.verification_status != c.verification_status
            for b in claims_before
        )
    ]
    return ReflectionLogObject(
        iteration=iteration,
        strategy=strategy,
        reason=reason,
        changed_claim_ids=changed_ids,
        new_paper_ids=new_paper_ids or [],
        new_chunk_ids=new_chunk_ids or [],
        metrics_before=_build_snapshot(claims_before),
        metrics_after=_build_snapshot(claims_after),
        claim_delta=delta,
    )


def has_converged(claim_delta: float) -> bool:
    """§0.8 — converged when < 10% of claims changed status."""
    return claim_delta < settings.claim_delta_threshold
