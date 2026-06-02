"""
Support Strength Calculator — Section 0.3 (MANDATORY FORMULA).

support_strength = (0.4 × min(n/5, 1))  +  (0.4 × s)  +  (0.2 × d)

  n = number of independent supporting papers
  s = cosine similarity between claim and evidence (0–1)
  d = 1.0 if evidence source is a RAG chunk, 0.5 if abstract only

Claude MUST NOT estimate or guess this value (Section 0.3).
"""

from utils.schemas import EvidenceDepth


def compute_support_strength(
    n_papers: int,
    cosine_similarity: float,
    evidence_depth: EvidenceDepth,
) -> float:
    """
    Compute support_strength per Section 0.3.
    All three inputs are required before calling this function.
    """
    n = min(n_papers / 5.0, 1.0)               # paper count contribution (max at n≥5)
    s = max(0.0, min(cosine_similarity, 1.0))   # semantic alignment (clamp)
    d = 1.0 if evidence_depth == EvidenceDepth.RAG_ENRICHED else 0.5

    strength = (0.4 * n) + (0.4 * s) + (0.2 * d)
    return round(min(max(strength, 0.0), 1.0), 4)
