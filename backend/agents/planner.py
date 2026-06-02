"""
Planner Agent — Section 3.1
Decomposes the user query into a structured research plan.
Output contract: Section 0.6 / Appendix A.7.
Downstream modules REJECT plain-text outputs — must return PlannerOutput JSON.
"""

import json
import re
from loguru import logger
from utils.llm_client import call_llm
from utils.schemas import PlannerOutput, QueryType, RetrievalDepth, AblationMode

SYSTEM_PROMPT = """You are the Planner Agent in a formal multi-agent research system.

Your ONLY output is a valid JSON object matching this exact schema (no extra fields, no markdown):

{
  "query":                 string,
  "themes":                string[],          // 1-5 distinct research themes, no duplicates
  "comparison_dimensions": string[],          // [] if query_type is "survey"
  "query_type":            "survey" | "comparison" | "gap_analysis",
  "retrieval_depth":       "shallow" | "deep" // "deep" = top-K=5 RAG chunks; "shallow" = abstracts only
}

Rules:
- themes: 1–5 items, no duplicates
- comparison_dimensions: MUST be [] if query_type is "survey"
- retrieval_depth: set "deep" for nuanced queries requiring full-text evidence
- Output ONLY the JSON object. No preamble, no explanation, no markdown fences.
"""


def run(query_text: str, ablation_mode: AblationMode) -> PlannerOutput:
    """
    Run the Planner Agent.
    Returns a validated PlannerOutput. Rejects partial or malformed outputs.
    ablation_mode is logged here — the Planner is the only module permitted
    to set the ablation flag (Section 3.1).
    """
    logger.info(f"[Planner] Decomposing query | ablation_mode={ablation_mode}")

    user_msg = f"Research query: {query_text}\nAblation mode: {ablation_mode}"
    raw = call_llm(SYSTEM_PROMPT, user_msg, max_tokens=512)

    # Strip markdown fences if model slips
    cleaned = re.sub(r"```(?:json)?|```", "", raw).strip()

    try:
        data = json.loads(cleaned)
        plan = PlannerOutput(**data)
        logger.info(f"[Planner] Plan ready | type={plan.query_type} | themes={plan.themes}")
        return plan
    except Exception as exc:
        logger.error(f"[Planner] Output rejected: {exc}\nRaw:\n{raw}")
        raise ValueError(f"Planner output failed schema validation: {exc}") from exc
