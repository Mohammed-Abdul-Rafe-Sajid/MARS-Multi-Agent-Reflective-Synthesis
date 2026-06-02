"""
Evidence Structurer — Section 3.3
Merges evidence from arXiv API (abstracts) and ChromaDB RAG (full-text chunks).
Tags each evidence item with source_type per Section 0.2 schema.
Applies evidence depth scores: d=1.0 (rag_chunk) vs d=0.5 (abstract).
"""

from loguru import logger
from utils.schemas import PaperObject, EvidenceObject, SourceType, EvidenceDepth


def merge_evidence(
    papers: list[PaperObject],
    rag_results: dict[str, list[EvidenceObject]],  # paper_id → RAG chunks
) -> list[PaperObject]:
    """
    Merge abstract-level and RAG chunk evidence into unified paper objects.
    Sets rag_available=True and evidence_depth accordingly.
    """
    enriched: list[PaperObject] = []

    for paper in papers:
        rag_chunks = rag_results.get(paper.id, [])

        # Unified evidence_snippets[] with source tagging (Section 3.3)
        all_evidence: list[EvidenceObject] = []

        # Abstract-level (API source)
        for ev in paper.evidence_snippets:
            all_evidence.append(EvidenceObject(
                text=ev.text,
                paper_id=paper.id,
                chunk_id=None,
                source_type=SourceType.ABSTRACT,
            ))

        # RAG chunks (full-text source)
        chunk_ids: list[str] = list(paper.chunk_ids)
        for chunk_ev in rag_chunks:
            all_evidence.append(EvidenceObject(
                text=chunk_ev.text,
                paper_id=paper.id,
                chunk_id=chunk_ev.chunk_id,
                source_type=SourceType.RAG_CHUNK,
            ))
            if chunk_ev.chunk_id and chunk_ev.chunk_id not in chunk_ids:
                chunk_ids.append(chunk_ev.chunk_id)

        has_rag = len(rag_chunks) > 0
        enriched.append(paper.model_copy(update={
            "evidence_snippets": all_evidence,
            "chunk_ids": chunk_ids,
            "rag_available": has_rag,
        }))

    rag_count = sum(1 for p in enriched if p.rag_available)
    logger.info(f"[EvidenceStructurer] {rag_count}/{len(enriched)} papers RAG-enriched")
    return enriched


def build_evidence_map(papers: list[PaperObject]) -> dict[str, list[EvidenceObject]]:
    """Build a paper_id → evidence_snippets lookup for the Verifier."""
    return {p.id: p.evidence_snippets for p in papers}
