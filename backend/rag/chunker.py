"""
PaperChunker — Section 3.2.1 (RAG Module)
Downloads PDF → extracts text → chunks at 512 tokens with 50-token overlap.
chunk_ids stored in PaperObject so every chunk traces back to its source.
"""

import uuid
import hashlib
from loguru import logger
from utils.schemas import PaperChunk
from config import settings

try:
    import tiktoken
    _enc = tiktoken.get_encoding("cl100k_base")
    _TIKTOKEN = True
except ImportError:
    _TIKTOKEN = False

try:
    from pypdf import PdfReader
    import httpx
    _PDF = True
except ImportError:
    _PDF = False


def _tokenize(text: str) -> list[int]:
    if _TIKTOKEN:
        return _enc.encode(text)
    return text.split()   # fallback: word-level tokens


def _detokenize(tokens: list) -> str:
    if _TIKTOKEN:
        return _enc.decode(tokens)
    return " ".join(str(t) for t in tokens)


def chunk_text(
    text: str,
    paper_id: str,
    session_id: str,
    chunk_size: int = None,
    overlap: int = None,
) -> list[PaperChunk]:
    """
    Chunk text into overlapping windows per Section 3.2.1.
    chunk_size = 512 tokens, overlap = 50 tokens (configurable in settings).
    """
    size    = chunk_size or settings.chunk_size_tokens
    overlap_n = overlap or settings.chunk_overlap_tokens

    tokens = _tokenize(text)
    chunks: list[PaperChunk] = []
    start = 0
    idx   = 0

    while start < len(tokens):
        end = min(start + size, len(tokens))
        chunk_tokens = tokens[start:end]
        chunk_text_str = _detokenize(chunk_tokens)

        chunk_id = f"chunk_{hashlib.sha256((paper_id + str(idx)).encode()).hexdigest()[:12]}"
        chunks.append(PaperChunk(
            chunk_id=chunk_id,
            paper_id=paper_id,
            session_id=session_id,
            text=chunk_text_str,
            embedding=[],        # populated by RAGIndexer
            token_start=start,
            token_end=end,
            chunk_index=idx,
        ))
        start += size - overlap_n
        idx   += 1
        if end == len(tokens):
            break

    logger.info(f"[PaperChunker] {len(chunks)} chunks for paper {paper_id}")
    return chunks


def chunk_abstract(paper_id: str, session_id: str, abstract: str) -> list[PaperChunk]:
    """Chunk from abstract only (when PDF unavailable)."""
    return chunk_text(abstract, paper_id, session_id)
