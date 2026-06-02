"""
Configuration — all settings loaded from .env via pydantic-settings.
Every constant referenced in Sections 0.3–0.9 lives here.
"""

import os
from pathlib import Path
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # API keys
    openai_api_key: str = ""       # used for both LLM (gpt-4o) and embeddings (text-embedding-3-small)

    # LLM
    llm_model: str = "gpt-4o"
    llm_max_tokens: int = 4096

    # Retrieval — Section 0.7
    max_papers_per_query: int = 15
    top_k_rag_chunks: int = 5
    paper_age_cutoff_years: int = 10
    rag_similarity_threshold: float = 0.60
    default_ablation_mode: str = "both"

    # Reflection Engine — Sections 0.5 / 0.8
    max_iterations: int = 4
    claim_delta_threshold: float = 0.10
    weak_claim_ratio_threshold: float = 0.30

    # Verifier — Section 0.4
    similarity_verified_threshold: float = 0.75
    similarity_weak_threshold: float = 0.60
    min_supporting_papers: int = 2

    # RAG / ChromaDB
    chroma_persist_dir: str = "./chromadb_store"
    chunk_size_tokens: int = 512
    chunk_overlap_tokens: int = 50
    embedding_model: str = "text-embedding-3-small"

    # Database
    database_url: str = "sqlite:///./research_system.db"

    # Server
    host: str = "0.0.0.0"
    port: int = 8000

    class Config:
        # Look for .env in current dir first, then parent dir (handles backend/ subfolder)
        env_file = ".env"
        
        @staticmethod
        def settings_customise_sources(
            settings_cls,
            init_settings,
            env_settings,
            dotenv_settings,
            file_settings,
            env_file,
            env_file_encoding,
        ):
            # Try to find .env in current path or parent paths
            dotenv_path = Path(".env")
            if not dotenv_path.exists():
                dotenv_path = Path("../.env")
            if not dotenv_path.exists():
                dotenv_path = Path("../../.env")
            
            if dotenv_path.exists():
                from dotenv import dotenv_values
                dotenv_dict = dotenv_values(str(dotenv_path))
                dotenv_settings = type.__call__(type(file_settings), **dotenv_dict)
            
            return (
                init_settings,
                env_settings,
                dotenv_settings,
                file_settings,
            )


settings = Settings()
