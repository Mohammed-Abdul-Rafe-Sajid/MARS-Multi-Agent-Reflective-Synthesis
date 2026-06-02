# Self-Reflective Multi-Agent AI Research Platform — v3.0

A formally specified, citation-enforced multi-agent research system using **OpenAI GPT-4o** for all LLM calls and **text-embedding-3-small** for RAG embeddings. Built with FastAPI + ChromaDB + SQLite + arXiv API.

---

## Architecture

```
User Query
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│  Planner Agent  (gpt-4o)                                │
│  → PlannerOutput: themes[], query_type, retrieval_depth  │
└───────────────────────┬─────────────────────────────────┘
                        │
          ┌─────────────┴──────────────┐
          ▼                            ▼
  arXiv API Retrieval          ChromaDB RAG Retrieval
  (up to 15 papers)            (text-embedding-3-small)
          │                            │
          └─────────────┬──────────────┘
                        ▼
              Evidence Structurer
              (merges abstract + RAG chunks, tags source_type)
                        │
                        ▼
           Claim Graph Builder (gpt-4o)
           (3–8 typed, cited claims per paper)
                        │
          ┌─────────────▼──────────────┐
          │   Reflection Loop (max 4)  │
          │                            │
          │  Synthesizer (gpt-4o)      │
          │       ↓                    │
          │  Verifier                  │
          │  (Section 0.4 decision     │
          │   tree: verified/weak/     │
          │   contradicted)            │
          │       ↓                    │
          │  Reflection Policy Engine  │
          │  (Section 0.5 strategy:    │
          │   rewrite/retrieve/narrow/ │
          │   flag_uncertainty)        │
          │       ↓                    │
          │  Convergence? (Δ < 10%)   │
          │  Yes → stop, No → loop     │
          └─────────────┬──────────────┘
                        │
                        ▼
              Citation Manager
              (APA + BibTeX validation)
                        │
                        ▼
              Structured Report (JSON)
              + Session Metrics (Section 5)
```

---

## Quick Start

### 1. Install dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure

```bash
cp .env.example .env
# Edit .env — add your OPENAI_API_KEY
```

### 3. Run

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 4. Open Swagger UI

```
http://localhost:8000/docs
```

---

## API Reference (Section 8)

### `POST /api/v1/run_query`
Start a research session. Returns immediately; pipeline runs in background.

**Request:**
```json
{
  "query_text": "What are the latest advances in federated learning privacy?",
  "ablation_mode": "both",
  "max_iterations": 4
}
```

**ablation_mode options:**
- `"both"` — arXiv API + ChromaDB RAG (default, recommended)
- `"api_only"` — arXiv abstracts only (faster, less evidence depth)
- `"rag_only"` — RAG chunks only (requires prior indexing)

**Response (202):**
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "pending",
  "estimated_iterations": 4,
  "ablation_mode": "both"
}
```

---

### `GET /api/v1/get_result/{session_id}`
Poll for the final structured research report.

**Response when `status = "done"`:**
```json
{
  "session_id": "...",
  "status": "done",
  "report": {
    "executive_summary": "...",
    "thematic_sections": {
      "Privacy Mechanisms": "...",
      "Communication Efficiency": "..."
    },
    "comparative_table": "| Method | Privacy | Accuracy |\n|---|---|---|\n...",
    "limitations_and_gaps": "...",
    "confidence_metrics": "Papers analysed: 12 | RAG-enriched claims: 67% | ...",
    "references": [...]
  }
}
```

**Session statuses:**
| Status | Meaning |
|---|---|
| `pending` | Queued, not started |
| `running` | Agents are processing |
| `reflecting` | Verifier + Reflection Engine running |
| `done` | Complete — report ready |
| `failed` | Error — check server logs |

---

### `GET /api/v1/get_metrics/{session_id}`
Convergence and reliability metrics (Section 5).

```json
{
  "session_id": "...",
  "metrics": {
    "total_papers": 12,
    "total_claims": 47,
    "rag_enriched_claims_pct": 68.1,
    "strongly_supported_pct": 72.3,
    "weakly_supported_pct": 21.3,
    "insufficient_evidence_pct": 6.4,
    "iterations_to_convergence": 2,
    "hallucination_reduction_pct": 34.2,
    "avg_papers_per_claim": 2.1,
    "retrieval_mode": "both"
  },
  "reflection_logs": [
    {
      "iteration": 1,
      "strategy": "rewrite_synthesis",
      "reason": "Weak claim ratio 42% exceeds threshold 30%",
      "claim_delta": 0.38,
      "metrics_before": {...},
      "metrics_after": {...}
    }
  ]
}
```

---

### `GET /api/v1/get_iterations/{session_id}`
Full per-iteration history with versioned claims and reflection logs.

---

### `GET /api/v1/export_bibtex/{session_id}`
Download `.bib` file for all session references.

---

### `GET /api/v1/health`
```json
{ "status": "ok", "version": "3.0.0" }
```

---

## Project Structure

```
backend/
├── main.py                          ← FastAPI app + startup
├── config.py                        ← All settings (pydantic-settings)
├── requirements.txt
├── .env.example                     ← Copy to .env
│
├── agents/
│   ├── planner.py                   ← §3.1  Query decomposition (gpt-4o)
│   ├── claim_graph_builder.py       ← §3.4  Typed claim extraction (gpt-4o)
│   ├── synthesizer.py               ← §3.5  Structured report generation (gpt-4o)
│   ├── verifier.py                  ← §3.6  §0.4 decision tree verification
│   ├── reflection_engine.py         ← §3.7  §0.5 policy-driven strategy selection
│   └── citation_manager.py          ← §3.8  APA + BibTeX citation management
│
├── retrieval/
│   ├── arxiv_retriever.py           ← §3.2  arXiv API (bounded by §0.7)
│   └── evidence_structurer.py       ← §3.3  Merges abstract + RAG evidence
│
├── rag/
│   ├── chunker.py                   ← §3.2.1 512-token chunks, 50-token overlap
│   ├── indexer.py                   ← §3.2.1 text-embedding-3-small → ChromaDB
│   └── retriever.py                 ← §3.2.1 Semantic similarity query (top-K)
│
├── api/
│   ├── routes.py                    ← §8    FastAPI endpoints
│   └── orchestrator.py              ← §2.2  Full pipeline controller (background task)
│
├── memory/
│   ├── database.py                  ← SQLAlchemy ORM models
│   └── repository.py                ← All DB read/write operations
│
├── evaluation/
│   └── metrics.py                   ← §5    Session reliability metrics
│
└── utils/
    ├── schemas.py                   ← Appendix A  All canonical Pydantic schemas
    ├── llm_client.py                ← OpenAI gpt-4o wrapper (retry logic)
    └── support_strength.py          ← §0.3  Mandatory support strength formula
```

---

## Key Formulas

### Support Strength (§0.3 — mandatory, not estimated)
```
support_strength = (0.4 × min(n/5, 1)) + (0.4 × s) + (0.2 × d)

n = independent supporting papers
s = cosine similarity claim ↔ evidence  (0–1)
d = 1.0 if RAG chunk  |  0.5 if abstract only
```

### Convergence (§0.8)
```
claim_delta = (modified + added + removed) / total_claims_before
Stop when: claim_delta < 0.10  (< 10% claims changed)
```

### Verification Decision Tree (§0.4)
```
IF similarity > 0.75 AND n_papers ≥ 2  →  VERIFIED
ELIF contradiction detected             →  CONTRADICTED
ELIF similarity > 0.60                 →  WEAK
ELSE                                   →  WEAK
```

---

## Configuration (`.env`)

| Variable | Default | Description |
|---|---|---|
| `OPENAI_API_KEY` | — | **Required.** Used for gpt-4o + embeddings |
| `LLM_MODEL` | `gpt-4o` | OpenAI model for all agents |
| `LLM_MAX_TOKENS` | `4096` | Max tokens per LLM call |
| `MAX_PAPERS_PER_QUERY` | `15` | arXiv retrieval cap (§0.7) |
| `TOP_K_RAG_CHUNKS` | `5` | ChromaDB top-K per theme (§0.7) |
| `PAPER_AGE_CUTOFF_YEARS` | `10` | Ignore papers older than N years |
| `RAG_SIMILARITY_THRESHOLD` | `0.60` | Min cosine similarity for RAG results |
| `MAX_ITERATIONS` | `4` | Max reflection loop iterations |
| `CLAIM_DELTA_THRESHOLD` | `0.10` | Convergence threshold (§0.8) |
| `WEAK_CLAIM_RATIO_THRESHOLD` | `0.30` | Triggers reflection strategy (§0.5) |
| `SIMILARITY_VERIFIED_THRESHOLD` | `0.75` | Verifier: verified status |
| `SIMILARITY_WEAK_THRESHOLD` | `0.60` | Verifier: weak status |
| `MIN_SUPPORTING_PAPERS` | `2` | Min papers to mark claim verified |
| `CHROMA_PERSIST_DIR` | `./chromadb_store` | ChromaDB storage path |
| `DATABASE_URL` | `sqlite:///./research_system.db` | SQLAlchemy DB URL |

---

## Switching to PostgreSQL

```env
DATABASE_URL=postgresql://user:password@localhost:5432/research_db
```

No code changes needed — remove `check_same_thread` is handled automatically.
