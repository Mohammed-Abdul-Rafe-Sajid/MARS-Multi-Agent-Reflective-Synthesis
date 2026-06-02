"""
RAGIndexer — Section 3.2.1
Embeds PaperChunks with text-embedding-3-small (OpenAI)
and stores them in ChromaDB.
"""

from loguru import logger
from config import settings
from utils.schemas import PaperChunk

try:
    import chromadb
    from chromadb.config import Settings as ChromaSettings
    _CHROMA = True
except ImportError:
    _CHROMA = False
    logger.warning("[RAGIndexer] chromadb not installed — RAG disabled.")

try:
    from openai import OpenAI
    _OPENAI = True
except ImportError:
    _OPENAI = False
    logger.warning("[RAGIndexer] openai not installed — using zero embeddings.")

_chroma_client = None
_openai_client = None


def _get_chroma():
    global _chroma_client
    if _chroma_client is None and _CHROMA:
        _chroma_client = chromadb.PersistentClient(
            path=settings.chroma_persist_dir,
        )
    return _chroma_client


def _get_openai():
    global _openai_client
    if _openai_client is None and _OPENAI:
        _openai_client = OpenAI(api_key=settings.openai_api_key)
    return _openai_client


def _embed(texts: list[str]) -> list[list[float]]:
    """Embed texts with text-embedding-3-small (Section 3.2.1)."""
    client = _get_openai()
    if not client:
        # Return zero vectors as fallback
        return [[0.0] * 1536 for _ in texts]
    resp = client.embeddings.create(model=settings.embedding_model, input=texts)
    return [item.embedding for item in resp.data]


def index_chunks(chunks: list[PaperChunk], collection_name: str = "research_papers") -> list[PaperChunk]:
    """
    Embed and store chunks in ChromaDB.
    Returns chunks with embedding field populated.
    """
    if not chunks:
        return chunks

    chroma = _get_chroma()
    if not chroma:
        logger.warning("[RAGIndexer] ChromaDB unavailable — skipping indexing.")
        return chunks

    collection = chroma.get_or_create_collection(
        name=collection_name,
        metadata={"hnsw:space": "cosine"},
    )

    texts = [c.text for c in chunks]
    embeddings = _embed(texts)

    # Store in ChromaDB
    collection.upsert(
        ids=[c.chunk_id for c in chunks],
        embeddings=embeddings,
        documents=texts,
        metadatas=[{
            "chunk_id":    c.chunk_id,
            "paper_id":    c.paper_id,
            "session_id":  c.session_id,
            "chunk_index": c.chunk_index,
            "token_start": c.token_start,
            "token_end":   c.token_end,
        } for c in chunks],
    )

    # Attach embeddings to chunk objects
    indexed = [
        c.model_copy(update={"embedding": emb})
        for c, emb in zip(chunks, embeddings)
    ]
    logger.info(f"[RAGIndexer] Indexed {len(indexed)} chunks in collection '{collection_name}'")
    return indexed
