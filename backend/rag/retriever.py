"""
RAGRetriever — Section 3.2.1
Queries ChromaDB by semantic similarity.
Returns top-K chunks per research theme (K defined in Section 0.7).
Minimum similarity threshold: 0.60 (Section 0.7).
"""

from loguru import logger
from config import settings
from utils.schemas import RAGQueryResult, RAGQueryResultItem, EvidenceObject, SourceType

try:
    import chromadb
    _CHROMA = True
except ImportError:
    _CHROMA = False

try:
    from openai import OpenAI
    _OPENAI = True
except ImportError:
    _OPENAI = False

_chroma_client = None
_openai_client = None


def _get_chroma():
    global _chroma_client
    if _chroma_client is None and _CHROMA:
        _chroma_client = chromadb.PersistentClient(path=settings.chroma_persist_dir)
    return _chroma_client


def _get_openai():
    global _openai_client
    if _openai_client is None and _OPENAI:
        _openai_client = OpenAI(api_key=settings.openai_api_key)
    return _openai_client


def _embed_query(text: str) -> list[float]:
    client = _get_openai()
    if not client:
        return [0.0] * 1536
    resp = client.embeddings.create(model=settings.embedding_model, input=[text])
    return resp.data[0].embedding


def query(
    theme: str,
    top_k: int | None = None,
    collection_name: str = "research_papers",
    min_similarity: float | None = None,
) -> RAGQueryResult:
    """Query ChromaDB for top-K most relevant chunks for a theme."""
    k = top_k or settings.top_k_rag_chunks
    min_sim = min_similarity if min_similarity is not None else settings.rag_similarity_threshold

    chroma = _get_chroma()
    if not chroma:
        logger.warning("[RAGRetriever] ChromaDB unavailable — returning empty results.")
        return RAGQueryResult(query_text=theme, top_k=k, results=[])

    try:
        collection = chroma.get_or_create_collection(name=collection_name)

        # If collection is empty, return early to avoid ChromaDB error
        count = collection.count()
        if count == 0:
            logger.info(f"[RAGRetriever] Collection '{collection_name}' is empty.")
            return RAGQueryResult(query_text=theme, top_k=k, results=[])

        # n_results must not exceed number of items in collection
        n_results = min(k, count)
        query_emb = _embed_query(theme)

        results = collection.query(
            query_embeddings=[query_emb],
            n_results=n_results,
            include=["documents", "metadatas", "distances"],
        )

        items: list[RAGQueryResultItem] = []
        docs      = results.get("documents", [[]])[0]
        metas     = results.get("metadatas", [[]])[0]
        distances = results.get("distances", [[]])[0]

        for doc, meta, dist in zip(docs, metas, distances):
            similarity = 1.0 - dist   # ChromaDB cosine distance → similarity
            if similarity < min_sim:
                continue
            items.append(RAGQueryResultItem(
                chunk_id=meta.get("chunk_id", meta.get("paper_id", "")),
                paper_id=meta.get("paper_id", ""),
                similarity_score=round(similarity, 4),
                text=doc,
            ))

        logger.info(f"[RAGRetriever] {len(items)} chunks for theme: '{theme[:50]}'")
        return RAGQueryResult(query_text=theme, top_k=k, results=items)

    except Exception as exc:
        logger.error(f"[RAGRetriever] Query failed: {exc}")
        return RAGQueryResult(query_text=theme, top_k=k, results=[])


def query_all_themes(
    themes: list[str],
    collection_name: str = "research_papers",
) -> dict[str, list[EvidenceObject]]:
    """
    Run RAG queries for all themes, aggregate per paper_id.
    collection_name MUST match what was used during indexing.
    """
    paper_evidence: dict[str, list[EvidenceObject]] = {}

    for theme in themes:
        result = query(theme, collection_name=collection_name)
        for item in result.results:
            ev = EvidenceObject(
                text=item.text,
                paper_id=item.paper_id,
                chunk_id=item.chunk_id or None,
                source_type=SourceType.RAG_CHUNK,
            )
            paper_evidence.setdefault(item.paper_id, []).append(ev)

    return paper_evidence
