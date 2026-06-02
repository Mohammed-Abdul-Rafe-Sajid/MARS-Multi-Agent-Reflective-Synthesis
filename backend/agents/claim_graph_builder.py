"""
Claim Graph Builder — Section 3.4
Extracts typed, evidence-bound claims from paper objects.
Every claim MUST have supporting_paper_ids[] (enforced by schema).
Claims are versioned across reflection iterations.
"""

import uuid
import json
import re
from loguru import logger
from utils.llm_client import call_llm
from utils.schemas import (
    ClaimObject, ClaimType, VerificationStatus,
    EvidenceDepth, PaperObject
)
from utils.support_strength import compute_support_strength

SYSTEM_PROMPT = """You are the Claim Graph Builder in a formal research system.

Given a research paper's metadata, extract atomic, verifiable claims.
Return ONLY a JSON array of claim objects. Each object MUST use this schema exactly:

[
  {
    "claim_text":           string,
    "claim_type":           "method" | "result" | "limitation" | "comparison",
    "supporting_paper_ids": [string],   // MUST include this paper's ID — never empty
    "supporting_chunks":    [string],   // chunk IDs if available, else []
    "confidence_score":     float,      // 0.0–1.0, your assessment
    "evidence_depth":       "abstract_only" | "rag_enriched"
  }
]

Rules:
- Each claim = ONE atomic idea. Never combine two ideas in one claim.
- supporting_paper_ids MUST NOT be empty.
- Extract 3–8 claims per paper.
- Return only the JSON array. No markdown, no explanation.
"""


def extract_claims_from_paper(
    paper: PaperObject,
    iteration_version: int,
) -> list[ClaimObject]:
    """
    Extract claims from a single paper using the LLM.
    Applies default support_strength via formula (Section 0.3).
    """
    has_rag = paper.rag_available and len(paper.chunk_ids) > 0
    evidence_depth = EvidenceDepth.RAG_ENRICHED if has_rag else EvidenceDepth.ABSTRACT_ONLY

    chunk_info = f"chunk_ids available: {paper.chunk_ids[:3]}" if has_rag else "abstract only"

    user_msg = f"""Paper ID: {paper.id}
Title: {paper.title}
Authors: {', '.join(paper.authors[:3])}
Year: {paper.year}
Abstract: {paper.abstract[:1200]}
RAG status: {chunk_info}

Extract atomic claims from this paper."""

    raw = call_llm(SYSTEM_PROMPT, user_msg, max_tokens=1024)
    cleaned = re.sub(r"```(?:json)?|```", "", raw).strip()

    try:
        raw_claims = json.loads(cleaned)
    except json.JSONDecodeError as exc:
        logger.warning(f"[ClaimGraphBuilder] JSON parse failed for paper {paper.id}: {exc}")
        return []

    claims = []
    for rc in raw_claims:
        try:
            # Compute support_strength per Section 0.3
            # Default cosine similarity = 0.65 at claim-extraction stage (pre-verifier)
            strength = compute_support_strength(
                n_papers=len(rc.get("supporting_paper_ids", [paper.id])),
                cosine_similarity=0.65,
                evidence_depth=EvidenceDepth(rc.get("evidence_depth", evidence_depth.value)),
            )
            claim = ClaimObject(
                claim_id=str(uuid.uuid4()),
                claim_text=rc["claim_text"],
                claim_type=ClaimType(rc["claim_type"]),
                supporting_paper_ids=rc.get("supporting_paper_ids") or [paper.id],
                supporting_chunks=rc.get("supporting_chunks", []),
                support_strength=strength,
                confidence_score=float(rc.get("confidence_score", 0.6)),
                verification_status=VerificationStatus.WEAK,   # default before Verifier runs
                iteration_version=iteration_version,
                evidence_depth=EvidenceDepth(rc.get("evidence_depth", evidence_depth.value)),
            )
            claims.append(claim)
        except Exception as exc:
            logger.warning(f"[ClaimGraphBuilder] Skipping malformed claim: {exc}")

    logger.info(f"[ClaimGraphBuilder] Extracted {len(claims)} claims from paper {paper.id}")
    return claims


def build_graph(
    papers: list[PaperObject],
    iteration_version: int,
) -> list[ClaimObject]:
    """Build the full claim graph from all retrieved papers."""
    all_claims: list[ClaimObject] = []
    for paper in papers:
        claims = extract_claims_from_paper(paper, iteration_version)
        all_claims.extend(claims)
    logger.info(f"[ClaimGraphBuilder] Total claims in graph: {len(all_claims)}")
    return all_claims
