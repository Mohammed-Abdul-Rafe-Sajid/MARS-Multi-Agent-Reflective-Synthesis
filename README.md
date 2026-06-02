# MARS: Multi-Agent Reflective Synthesis

> **An intelligent research platform that leverages multi-agent AI to analyze, synthesize, and verify academic research with reflection-driven convergence.**

![Python](https://img.shields.io/badge/Python-3.12+-blue?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.111+-green?logo=fastapi)
![React](https://img.shields.io/badge/React-18.3+-61dafb?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178c6?logo=typescript&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Technologies](#technologies)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Usage Examples](#usage-examples)
- [Configuration](#configuration)
- [Contributing](#contributing)
- [License](#license)

---

## 📖 Overview

**MARS** is a sophisticated research synthesis platform that combines:

- **Multi-Agent Architecture**: Specialized agents for planning, retrieval, claim extraction, synthesis, and verification
- **Reflection Engine**: Iterative convergence mechanism for improving research quality and reducing hallucinations
- **RAG Integration**: Retrieval-Augmented Generation with ChromaDB for context-aware synthesis
- **Academic Data Pipeline**: Seamless integration with arXiv for paper retrieval and analysis
- **Comprehensive Dashboard**: Real-time tracking of research session progress and metrics

### Use Cases

- 📚 **Literature Review Automation**: Generate comprehensive research summaries from academic papers
- 🔬 **Evidence-Based Claims**: Extract, verify, and trace claims back to source papers
- 📊 **Research Analytics**: Track claim support strength, convergence metrics, and synthesis quality
- 🎯 **Thematic Analysis**: Automatically organize findings by research themes
- ✅ **Fact Verification**: Multi-stage verification process reduces hallucination and improves accuracy

---

## ✨ Key Features

### 🤖 Multi-Agent Pipeline

1. **Planner Agent**
   - Decomposes complex research queries into structured themes
   - Automatically determines research type (survey, deep-dive, comparative)

2. **Retrieval System**
   - Fetches relevant papers from arXiv API
   - Configurable filtering by date, relevance, and quantity
   - Handles 10-15 papers per query (configurable)

3. **Claim Graph Builder**
   - Extracts 3-8 claims per paper using LLM analysis
   - Evaluates claim confidence and evidence support
   - Creates structured knowledge graph

4. **Synthesizer Agent**
   - Generates executive summaries with key insights
   - Organizes findings by research themes
   - Creates comparative analysis tables
   - Documents methodology limitations

5. **Verifier Agent**
   - Cross-references claims with source papers
   - Evaluates support strength (strongly supported/weakly supported/insufficient)
   - Ensures citation accuracy visible on dashboard

6. **Reflection Engine**
   - Iterative convergence: Max 4 iterations (configurable)
   - Monitors claim modification delta (<10% = convergence)
   - Triggers evidence re-retrieval if clarity drops below threshold
   - Reduces hallucinations through multi-pass verification

### 📊 Dashboard & Visualization

- **Real-time Progress Tracking**: Watch pipeline stages execute in real-time
- **Session Metrics**: Papers analyzed, claims extracted, support distribution
- **Interactive Reports**: Thematic breakdowns, citations, limitations
- **Query History**: Persistent storage of all research sessions
- **Export Capabilities**: View and download research iterations and reports

### 🔐 Data Management

- **SQLite Backend**: Persistent session storage
- **ChromaDB Integration**: Vector embeddings for semantic search
- **Session Isolation**: Each research query maintains independent state
- **Iteration Tracking**: Full audit trail of refinements across reflection passes

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React + TypeScript)             │
│  ┌──────┬──────┬──────┬──────┬──────┬──────────┬──────────┐ │
│  │Home  │Search│Report│Metrics│Issues│Iterations│History  │ │
│  └──┬───┴──────┴──────┴──────┴──────┴──────────┴──────────┘ │
│     │ API Calls (localhost:3000 ↔ localhost:8000)            │
└─────┼─────────────────────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────────────────────┐
│            Backend (FastAPI + Uvicorn - Port 8000)          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              API Routes (routes.py)                     │ │
│  │  • POST /research/launch → Orchestrator                │ │
│  │  • GET /research/status/{id} → Current state           │ │
│  │  • GET /research/report/{id} → Final report            │ │
│  │  • GET /research/metrics/{id} → Analytics              │ │
│  │  • GET /research/history → Session list                │ │
│  └─────────────────────┬──────────────────────────────────┘ │
│                        │                                      │
│  ┌─────────────────────▼──────────────────────────────────┐ │
│  │        Orchestrator (orchestrator.py)                  │ │
│  │  Coordinates: Planner → Retrieval → Claims → Verify   │ │
│  └─────────────────────┬──────────────────────────────────┘ │
│                        │                                      │
│  ┌─────────────────────▼──────────────────────────────────┐ │
│  │           Multi-Agent Pipeline (agents/)              │ │
│  │  ┌──────────┬────────┬──────────┬────────┬──────────┐ │ │
│  │  │ Planner  │Claimer │Synthesizer│Verifier│Reflection│ │ │
│  │  └──────────┴────────┴──────────┴────────┴──────────┘ │ │
│  └────────────────┬─────────────────────────────────────┘ │
│                   │                                        │
│  ┌────────────────▼────────────┐  ┌──────────────────┐   │
│  │  External Services          │  │ Data Layer       │   │
│  │  • OpenAI API (gpt-4o)      │  │ • SQLite DB      │   │
│  │  • arXiv API (Papers)       │  │ • ChromaDB       │   │
│  │  • Embeddings (text-emb-3)  │  │ • Session State  │   │
│  └─────────────────────────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Technologies

| Component | Technology | Version |
|-----------|-----------|---------|
| **Backend Framework** | FastAPI | 0.111.0 |
| **ASGI Server** | Uvicorn | 0.29.0 |
| **Python Version** | Python | 3.12+ |
| **LLM Provider** | OpenAI API | gpt-4o |
| **Database** | SQLite | Built-in |
| **Vector DB** | ChromaDB | 0.5.0 |
| **Paper Source** | arXiv API | 2.1.0 |
| **Frontend Framework** | React | 18.3.1 |
| **UI Language** | TypeScript | 5.0+ |
| **Build Tool** | npm | 11.12.1+ |
| **Node Runtime** | Node.js | 24.11.0+ |

**Key Dependencies:**
- `pydantic` & `pydantic-settings`: Configuration management
- `sqlalchemy`: ORM for database operations
- `loguru`: Structured logging
- `tenacity`: Retry logic for API calls
- `httpx`: Async HTTP client
- `arxiv`: Paper retrieval
- `tiktoken`: Token counting for LLM

---

## 📋 Prerequisites

### System Requirements
- **OS**: Windows, macOS, Linux
- **Python**: 3.12 or higher
- **Node.js**: 18+ (recommended: 24.11.0)
- **npm**: 11+ (comes with Node.js)
- **RAM**: Minimum 4GB (8GB recommended)
- **Disk Space**: 500MB for project + dependencies

### External Requirements
- **OpenAI API Key**: Get from https://platform.openai.com/api-keys
  - ⚠️ Requires API credits (gpt-4o costs ~$0.15 per research query)
  - Free tier: 5 projects available
- **Internet Connection**: Required for:
  - OpenAI API calls
  - arXiv paper retrieval
  - Model downloads

---

## 🚀 Installation

### Backend Setup

**1. Clone the repository**
```bash
git clone https://github.com/Mohammed-Abdul-Rafe-Sajid/MARS-Multi-Agent-Reflective-Synthesis.git
cd MARS-Multi-Agent-Reflective-Synthesis
```

**2. Create virtual environment**
```bash
# Windows
python -m venv .venv
.\.venv\Scripts\activate

# macOS/Linux
python3 -m venv .venv
source .venv/bin/activate
```

**3. Upgrade pip**
```bash
python -m pip install --upgrade pip
```

**4. Install Python dependencies**
```bash
pip install -r backend/requirements.txt
```

**5. Configure environment**
```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` and add your OpenAI API key:
```env
OPENAI_API_KEY=sk-proj-your_actual_api_key_here
```

⚠️ **Security Note**: Keep `.env` file off GitHub. It's already in `.gitignore`.

### Frontend Setup

**1. Install Node dependencies**
```bash
cd frontend
npm install
```

**2. Build for production** (Optional)
```bash
npm run build
```

This creates optimized production build in `frontend/build/`.

---

## ▶️ Running the Application

### Option 1: Development Mode (Recommended for Testing)

**Terminal 1 - Start Backend:**
```bash
cd backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Expected output:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

**Terminal 2 - Start Frontend:**
```bash
cd frontend
npm start
```

Expected output:
```
Compiled successfully!
You can now view the app in the browser at:
http://localhost:3000
```

Open browser: **http://localhost:3000**

### Option 2: Production Mode

**Windows PowerShell:**
```powershell
.\start-production.ps1
```

**macOS/Linux:**
```bash
bash start-production.sh
```

This script:
- ✅ Installs dependencies
- ✅ Builds React frontend
- ✅ Starts backend server
- ✅ Serves optimized frontend

---

## 📡 API Documentation

### Main Endpoints

#### **Launch Research Query**
```http
POST /research/launch
Content-Type: application/json

{
  "query": "What are recent advances in federated learning?",
  "ablation_mode": "both"  # "api_only" | "rag_only" | "both"
}
```

Response:
```json
{
  "session_id": "uuid-string",
  "status": "running",
  "started_at": "2024-06-02T13:00:00Z"
}
```

#### **Get Research Status**
```http
GET /research/status/{session_id}
```

Response:
```json
{
  "session_id": "uuid-string",
  "status": "processing",
  "current_stage": "claim_extraction",
  "iterations": [
    {
      "iteration": 1,
      "stage": "retrieval",
      "papers_found": 12,
      "timestamp": "2024-06-02T13:00:15Z"
    }
  ]
}
```

#### **Get Final Report**
```http
GET /research/report/{session_id}
```

Response:
```json
{
  "session_id": "uuid-string",
  "query": "What are recent advances in federated learning?",
  "executive_summary": "Federated learning enables...",
  "thematic_sections": [
    {
      "theme": "Privacy-Preserving Techniques",
      "claims": [...]
    }
  ],
  "references": [
    {
      "paper_id": "2406.xxxxx",
      "title": "...",
      "authors": [...],
      "year": 2024
    }
  ]
}
```

#### **Get Analytics**
```http
GET /research/metrics/{session_id}
```

Response:
```json
{
  "total_papers": 12,
  "total_claims": 47,
  "strongly_supported": 35,
  "weakly_supported": 10,
  "unsupported": 2,
  "avg_support_strength": 0.68,
  "hallucination_reduction": 15.3,
  "convergence_iterations": 2
}
```

#### **Get Session History**
```http
GET /research/history
```

Response:
```json
[
  {
    "session_id": "uuid-1",
    "query": "Federated learning",
    "status": "completed",
    "created_at": "2024-06-02T13:00:00Z"
  },
  {
    "session_id": "uuid-2",
    "query": "Zero-shot learning",
    "status": "completed",
    "created_at": "2024-06-02T12:45:00Z"
  }
]
```

---

## 📁 Project Structure

```
MARS-Multi-Agent-Reflective-Synthesis/
│
├── backend/                          # FastAPI Application
│   ├── agents/                       # Multi-agent pipeline
│   │   ├── planner.py               # Query decomposition
│   │   ├── claim_graph_builder.py   # Claim extraction
│   │   ├── synthesizer.py           # Report generation
│   │   ├── verifier.py              # Claim verification
│   │   └── reflection_engine.py     # Convergence mechanism
│   │
│   ├── api/                          # API Layer
│   │   ├── routes.py                # Endpoint definitions
│   │   └── orchestrator.py          # Pipeline orchestration
│   │
│   ├── retrieval/                    # Paper Retrieval
│   │   ├── arxiv_retriever.py       # arXiv API integration
│   │   └── evidence_structurer.py   # Paper preprocessing
│   │
│   ├── rag/                          # RAG Pipeline
│   │   ├── chunker.py               # Text chunking
│   │   ├── indexer.py               # Vector indexing
│   │   └── retriever.py             # Semantic search
│   │
│   ├── memory/                       # Data Layer
│   │   ├── database.py              # SQLAlchemy ORM
│   │   └── repository.py            # CRUD operations
│   │
│   ├── evaluation/                   # Metrics & Analytics
│   │   └── metrics.py               # Calculation logic
│   │
│   ├── utils/                        # Utilities
│   │   ├── llm_client.py            # OpenAI wrapper
│   │   ├── schemas.py               # Data models
│   │   └── support_strength.py      # Evidence evaluation
│   │
│   ├── config.py                     # Configuration management
│   ├── main.py                       # Application entry point
│   ├── requirements.txt              # Python dependencies
│   ├── .env.example                  # Configuration template
│   └── README.md                     # Backend documentation
│
├── frontend/                         # React Application
│   ├── src/
│   │   ├── components/               # React components
│   │   │   ├── Sidebar.tsx          # Navigation sidebar
│   │   │   ├── Topbar.tsx           # Header bar
│   │   │   └── PipelineTracker.tsx  # Progress display
│   │   │
│   │   ├── pages/                    # Page components
│   │   │   ├── HomePage.tsx         # Landing page
│   │   │   ├── ResearchPage.tsx     # Query interface
│   │   │   ├── ReportPage.tsx       # Results display
│   │   │   ├── MetricsPage.tsx      # Analytics dashboard
│   │   │   ├── ClaimsPage.tsx       # Claim explorer
│   │   │   ├── IterationsPage.tsx   # Reflection history
│   │   │   └── HistoryPage.tsx      # Query history
│   │   │
│   │   ├── hooks/
│   │   │   └── useResearch.tsx      # Custom hook
│   │   │
│   │   ├── api/
│   │   │   └── client.ts            # API client
│   │   │
│   │   ├── types/
│   │   │   └── index.ts             # TypeScript types
│   │   │
│   │   ├── App.tsx                  # Root component
│   │   └── index.tsx                # Entry point
│   │
│   ├── public/
│   │   └── index.html               # HTML template
│   │
│   ├── package.json                 # npm dependencies
│   ├── tsconfig.json                # TypeScript config
│   ├── build/                       # Production build (generated)
│   └── README.md                    # Frontend documentation
│
├── chromadb_store/                  # Vector DB Storage
│   └── [ChromaDB embeddings]
│
├── .gitignore                       # Git ignore rules
├── .env.example                     # Environment template
├── GITHUB_PREP_SUMMARY.md          # GitHub setup guide
├── GITHUB_PUSH_GUIDE.md            # Detailed push instructions
├── FIX_ZERO_METRICS.md             # Zero metrics bug fix
├── QUICK_START.md                  # Quick reference
├── PRODUCTION_GUIDE.md             # Deployment guide
├── SETUP_COMPLETE.md               # Setup status
├── README.md                       # This file
├── start-production.ps1            # Windows production starter
└── start-production.sh             # Unix production starter
```

---

## 💡 Usage Examples

### Example 1: Federated Learning Survey

```bash
# Query
Query: "What are the latest advances in federated learning and privacy-preserving techniques?"

# Processing
Stage 1: Query Planning (0s)
  → Identified themes: Privacy, Scalability, Communication Efficiency
  → Research type: Survey

Stage 2: Paper Retrieval (5s)
  → Retrieved 12 papers from arXiv (2020-2024)

Stage 3: Claim Extraction (15s)
  → Extracted 45 claims spanning privacy techniques, aggregation methods, convergence analysis

Stage 4: Claim Verification (8s)
  → 35 claims strongly supported (78%)
  → 8 claims weakly supported (18%)
  → 2 claims insufficient evidence (4%)

Stage 5: Report Generation (3s)
  → Organized by themes
  → Added executive summary
  → Generated comparison table

Stage 6: Reflection (5s)
  → Iteration 1: 47 claims refined to 45 (4.3% delta)
  → Iteration 2: 45 claims remain stable (0.0% delta)
  → Convergence achieved in 2 iterations

# Total Time: ~36 seconds
# Output: Comprehensive report with 12 citations, 45 verified claims
```

### Example 2: Deep Dive - Zero-Shot Learning

```bash
# Query with specific ablation mode
Query: "Explain zero-shot learning approaches for computer vision"
Mode: "api_only" (LLM-only, no RAG)

# Metrics
Papers analyzed: 10
Claims extracted: 38
Average support strength: 0.72
Hallucination reduction: 12.5%
Convergence iterations: 3
```

---

## ⚙️ Configuration

### Environment Variables

Edit `backend/.env`:

```env
# ━━━ REQUIRED ━━━
OPENAI_API_KEY=sk-proj-...              # Your OpenAI API key

# ━━━ LLM SETTINGS ━━━
LLM_MODEL=gpt-4o                        # Model to use
LLM_MAX_TOKENS=4096                     # Max output tokens

# ━━━ RETRIEVAL SETTINGS ━━━
MAX_PAPERS_PER_QUERY=15                 # Papers to retrieve
TOP_K_RAG_CHUNKS=5                      # RAG context chunks
PAPER_AGE_CUTOFF_YEARS=10               # Only papers from last N years
RAG_SIMILARITY_THRESHOLD=0.60           # Semantic match threshold
DEFAULT_ABLATION_MODE=both              # "api_only" | "rag_only" | "both"

# ━━━ REFLECTION ENGINE ━━━
MAX_ITERATIONS=4                        # Max refinement loops
CLAIM_DELTA_THRESHOLD=0.10              # Convergence: <10% modified
WEAK_CLAIM_RATIO_THRESHOLD=0.30         # Re-retrieve threshold

# ━━━ VERIFICATION SETTINGS ━━━
SIMILARITY_VERIFIED_THRESHOLD=0.75      # Strong support threshold
SIMILARITY_WEAK_THRESHOLD=0.60          # Weak support threshold
MIN_SUPPORTING_PAPERS=2                 # Min papers per claim

# ━━━ RAG / CHROMADB ━━━
CHROMA_PERSIST_DIR=./chromadb_store
CHUNK_SIZE_TOKENS=512
CHUNK_OVERLAP_TOKENS=50
EMBEDDING_MODEL=text-embedding-3-small

# ━━━ DATABASE ━━━
DATABASE_URL=sqlite:///./research_system.db

# ━━━ SERVER ━━━
HOST=0.0.0.0
PORT=8000
```

### Tuning Tips

| Setting | Increase | Decrease |
|---------|----------|----------|
| `MAX_PAPERS_PER_QUERY` | More comprehensive but slower | Faster, less thorough |
| `MAX_ITERATIONS` | Better convergence but more API calls | Reduce costs, faster |
| `LLM_MAX_TOKENS` | More detailed synthesis | Concise output, faster |
| `CHUNK_SIZE_TOKENS` | Larger context window | More granular search |
| `TOP_K_RAG_CHUNKS` | Richer context | Faster processing |

---

## 🔍 Troubleshooting

### Backend Won't Start

**Error: `ModuleNotFoundError: No module named 'loguru'`**
```bash
# Reinstall dependencies
pip install -r backend/requirements.txt --upgrade
```

**Error: `Could not import module "main"`**
```bash
# Ensure you're in the backend directory
cd backend
python -c "import main; print('OK')"

# Start with full path
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

### API Key Issues

**Error: `OpenAI API Key not found`**
```bash
# Verify .env exists in backend directory
cd backend
cat .env | grep OPENAI_API_KEY

# If empty, update it
```

**Error: `Invalid API Key` from OpenAI**
1. Verify key at: https://platform.openai.com/api-keys
2. Check you have sufficient API credits
3. Ensure key hasn't expired

### Frontend Build Issues

**Error: `npm ERR! code ERESOLVE`**
```bash
npm install --legacy-peer-deps
```

**Error: Port 3000 already in use**
```bash
# Kill existing process
lsof -ti:3000 | xargs kill -9  # macOS/Linux
Get-Process -Name node | Stop-Process -Force  # Windows
```

---

## 📊 Performance Metrics

### Typical Query Performance

| Component | Time | Notes |
|-----------|------|-------|
| Query Planning | 0-2s | LLM decomposition |
| Paper Retrieval | 3-5s | arXiv API calls |
| Claim Extraction | 10-20s | LLM per 10-15 papers |
| Verification | 5-10s | Cross-reference claims |
| Synthesis | 3-8s | Report generation |
| Reflection (1-4 iter) | 5-20s | LLM refinement passes |
| **Total** | **30-70s** | Depending on query complexity |

### Scalability

- **Max papers/query**: 15 (configurable)
- **Max claims/paper**: 8 per paper analyzed
- **Max iterations**: 4 (configurable)
- **Concurrent sessions**: Limited by OpenAI API rate limits
- **Database size**: Grows ~500KB per research session

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/MARS-Multi-Agent-Reflective-Synthesis.git
   cd MARS-Multi-Agent-Reflective-Synthesis
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
   - Follow PEP 8 for Python code
   - Follow ESLint rules for TypeScript
   - Add tests for new features

4. **Commit with clear messages**
   ```bash
   git commit -m "feat: add your feature description"
   ```

5. **Push and create a Pull Request**
   ```bash
   git push origin feature/your-feature-name
   ```

### Areas for Contribution

- [ ] Additional LLM provider support (Claude, Gemini, Llama)
- [ ] Alternative paper sources (PubMed, Semantic Scholar)
- [ ] Enhanced claim verification strategies
- [ ] Performance optimizations
- [ ] Additional visualization options
- [ ] Multilingual support
- [ ] Advanced export formats (BibTeX, CSL-JSON)

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

MIT License grants you permission to:
- ✅ Use commercially
- ✅ Modify the code
- ✅ Distribute copies
- ✅ Use privately

With conditions:
- ⚠️ Must include license and copyright notice

---

## 📧 Support & Contact

- **Issues**: Report bugs via [GitHub Issues](https://github.com/Mohammed-Abdul-Rafe-Sajid/MARS-Multi-Agent-Reflective-Synthesis/issues)
- **Discussions**: Ask questions in [GitHub Discussions](https://github.com/Mohammed-Abdul-Rafe-Sajid/MARS-Multi-Agent-Reflective-Synthesis/discussions)
- **Documentation**: Check [detailed guides](./GITHUB_PUSH_GUIDE.md)

---

## 🙏 Acknowledgments

This project builds on cutting-edge research in:
- Multi-Agent Systems
- Retrieval-Augmented Generation (RAG)
- Language Model Verification
- Research Synthesis Automation

**Key Papers:**
- Agents: LLMs: A Survey on AI Agents
- RAG: Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks
- Verification: Factuality in Abstractive Summarization with ContrastiveVE

---

## 🔮 Roadmap

### v1.1 (Q3 2024)
- [ ] SQLite → PostgreSQL migration
- [ ] Batch query processing
- [ ] Advanced claim clustering
- [ ] Custom LLM model support

### v1.2 (Q4 2024)
- [ ] Real-time collaboration
- [ ] Research team workspaces
- [ ] Advanced analytics dashboard
- [ ] Export to academic formats

### v2.0 (2025)
- [ ] Multi-modal research (images, tables)
- [ ] Automatic literature review generation
- [ ] AI-powered research advisor
- [ ] Integration with academic databases

---

## 🎯 Quick Reference

```bash
# Setup (First time only)
git clone https://github.com/Mohammed-Abdul-Rafe-Sajid/MARS-Multi-Agent-Reflective-Synthesis.git
cd MARS-Multi-Agent-Reflective-Synthesis
python -m venv .venv && .\.venv\Scripts\activate  # Windows
pip install -r backend/requirements.txt
cd frontend && npm install && cd ..
cp backend/.env.example backend/.env              # Add API key

# Run development mode
# Terminal 1:
cd backend && python -m uvicorn main:app --reload
# Terminal 2:
cd frontend && npm start

# Visit http://localhost:3000
```

---

**Made with ❤️ by the MARS Research Team**

Last updated: June 2, 2026 | Version: 1.0
