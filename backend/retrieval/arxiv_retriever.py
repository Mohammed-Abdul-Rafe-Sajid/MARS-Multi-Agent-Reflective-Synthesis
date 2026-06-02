"""
arXiv Retrieval Engine — Section 3.2
Bounded by retrieval constraints defined in Section 0.7.
Returns structured PaperObjects — never raw dicts.
"""

import uuid
from datetime import datetime
from loguru import logger
from config import settings
from utils.schemas import PaperObject, EvidenceObject, SourceType

try:
    import arxiv
    _ARXIV_AVAILABLE = True
except ImportError:
    _ARXIV_AVAILABLE = False
    logger.warning("[ArxivRetriever] arxiv package not installed. Using mock data.")


def _mock_papers(query: str, n: int) -> list[PaperObject]:
    """Fallback mock papers for development/testing without API access."""
    return [
        PaperObject(
            id=f"mock_{i}_{str(uuid.uuid4())[:8]}",
            title=f"[MOCK] Paper {i} on: {query[:40]}",
            authors=[f"Author {i}A", f"Author {i}B"],
            year=2023 + (i % 2),
            abstract=f"This mock paper discusses aspects of '{query}'. "
                     f"It presents findings related to the research theme and provides evidence for several claims.",
            url=f"https://arxiv.org/abs/mock{i:04d}",
            doi=None,
            arxiv_link=f"https://arxiv.org/abs/mock{i:04d}",
            extracted_claims=[],
            evidence_snippets=[
                EvidenceObject(
                    text=f"Mock evidence snippet from paper {i} related to {query[:30]}.",
                    paper_id=f"mock_{i}",
                    chunk_id=None,
                    source_type=SourceType.ABSTRACT,
                )
            ],
            chunk_ids=[],
            rag_available=False,
        )
        for i in range(n)
    ]


def retrieve(
    themes: list[str],
    max_papers: int | None = None,
    age_cutoff_years: int | None = None,
) -> list[PaperObject]:
    """
    Retrieve papers from arXiv for all themes.
    Bounded by Section 0.7: max_papers, age_cutoff_years.
    Returns deduplicated list of PaperObjects.
    """
    max_p = max_papers or settings.max_papers_per_query
    cutoff = age_cutoff_years or settings.paper_age_cutoff_years
    cutoff_year = datetime.now().year - cutoff

    if not _ARXIV_AVAILABLE:
        logger.warning("[ArxivRetriever] Using mock papers (arxiv not installed).")
        return _mock_papers(" ".join(themes), min(max_p, 8))

    papers: list[PaperObject] = []
    seen_ids: set[str] = set()
    per_theme = max(1, max_p // len(themes))

    for theme in themes:
        try:
            search = arxiv.Search(
                query=theme,
                max_results=per_theme,
                sort_by=arxiv.SortCriterion.Relevance,
            )
            for result in search.results():
                if result.published.year < cutoff_year:
                    continue
                pid = result.entry_id.split("/")[-1]
                if pid in seen_ids:
                    continue
                seen_ids.add(pid)

                evidence = EvidenceObject(
                    text=result.summary[:600],
                    paper_id=pid,
                    chunk_id=None,
                    source_type=SourceType.ABSTRACT,
                )

                papers.append(PaperObject(
                    id=pid,
                    title=result.title,
                    authors=[str(a) for a in result.authors[:5]],
                    year=result.published.year,
                    abstract=result.summary,
                    url=result.entry_id,
                    doi=result.doi,
                    arxiv_link=result.entry_id,
                    extracted_claims=[],
                    evidence_snippets=[evidence],
                    chunk_ids=[],
                    rag_available=False,
                ))
        except Exception as exc:
            logger.error(f"[ArxivRetriever] Error retrieving theme '{theme}': {exc}")

    logger.info(f"[ArxivRetriever] Retrieved {len(papers)} papers for {len(themes)} themes")
    return papers[:max_p]
