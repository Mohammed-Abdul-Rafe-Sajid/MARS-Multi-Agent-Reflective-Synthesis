"""
Synthesizer Agent — Section 3.5
Generates structured research sections from the verified claim graph.
All output is traceable to source paper IDs (and chunk IDs when rag_available=true).
"""

import json
import re
from loguru import logger
from utils.llm_client import call_llm
from utils.schemas import ClaimObject, PaperObject, PlannerOutput, StructuredReport

SYSTEM_PROMPT = """You are the Synthesizer Agent in a formal multi-agent research system.

You receive: a research plan, a list of verified claims (with paper IDs), and paper metadata.
You produce: a structured research report in JSON.

Output ONLY this JSON structure (no markdown fences, no preamble):

{
  "executive_summary": string,
  "thematic_sections": {
    "<theme_name>": string
  },
  "comparative_table": string | null,
  "limitations_and_gaps": string
}

Rules:
- Every factual claim in sections MUST cite paper IDs inline like [paper_id].
- executive_summary: 2–4 sentences, high-level synthesis.
- thematic_sections: one section per theme from the plan.
- comparative_table: include ONLY if query_type is "comparison". Render as markdown table.
- limitations_and_gaps: explicit open problems and missing evidence.
- Do NOT invent facts. Use only the provided claims and papers.
"""


def run(
    plan: PlannerOutput,
    verified_claims: list[ClaimObject],
    papers: list[PaperObject],
) -> StructuredReport:
    """
    Synthesize the research report from the verified claim graph.
    """
    logger.info(f"[Synthesizer] Building report | themes={plan.themes} | claims={len(verified_claims)}")

    # Build compact claim summary for the prompt
    claim_summary = "\n".join(
        f"[{c.claim_id[:8]}] ({c.claim_type.value}, {c.verification_status.value}, "
        f"strength={c.support_strength:.2f}) papers={c.supporting_paper_ids[:2]}: {c.claim_text[:120]}"
        for c in verified_claims[:40]   # cap to avoid context overflow
    )

    paper_refs = "\n".join(
        f"{p.id}: {p.title} ({p.year}) — {p.authors[0] if p.authors else 'Unknown'}"
        for p in papers[:20]
    )

    user_msg = f"""Research Plan:
query: {plan.query}
themes: {plan.themes}
query_type: {plan.query_type}
comparison_dimensions: {plan.comparison_dimensions}

Verified Claims:
{claim_summary}

Papers:
{paper_refs}

Synthesize the structured research report."""

    raw = call_llm(SYSTEM_PROMPT, user_msg)
    cleaned = re.sub(r"```(?:json)?|```", "", raw).strip()

    try:
        data = json.loads(cleaned)
        # Build confidence_metrics string (Section 4)
        total = len(verified_claims)
        verified_n  = sum(1 for c in verified_claims if c.verification_status.value == "verified")
        weak_n      = sum(1 for c in verified_claims if c.verification_status.value == "weak")
        rag_n       = sum(1 for c in verified_claims if c.evidence_depth.value == "rag_enriched")
        conf_metrics = (
            f"Papers analysed: {len(papers)}  |  "
            f"RAG-enriched claims: {round(rag_n/max(total,1)*100)}%  |  "
            f"Strongly supported: {round(verified_n/max(total,1)*100)}%  |  "
            f"Weakly supported: {round(weak_n/max(total,1)*100)}%  |  "
            f"Insufficient evidence: {round((total-verified_n-weak_n)/max(total,1)*100)}%"
        )

        return StructuredReport(
            executive_summary=data.get("executive_summary", ""),
            thematic_sections=data.get("thematic_sections", {}),
            comparative_table=data.get("comparative_table"),
            limitations_and_gaps=data.get("limitations_and_gaps", ""),
            confidence_metrics=conf_metrics,
            references=papers,
        )
    except Exception as exc:
        logger.error(f"[Synthesizer] Output parse failed: {exc}")
        raise ValueError(f"Synthesizer output failed schema validation: {exc}") from exc
