import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Zap, Database, Layers, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { useResearch } from '../hooks/useResearch';
import { PipelineTracker } from '../components/PipelineTracker';
import type { AblationMode } from '../types';

const EXAMPLES = [
  'What are the latest advances in federated learning privacy?',
  'Compare transformer vs. state space models for long-context NLP',
  'Survey open problems in multi-agent reinforcement learning',
  'How do diffusion models compare to GANs for image synthesis?',
  'What hallucination mitigation strategies exist for LLMs?',
];

const MODES: { value: AblationMode; icon: React.ReactNode; label: string; desc: string }[] = [
  { value: 'both',     icon: <Layers size={14} />,   label: 'Hybrid',    desc: 'arXiv + ChromaDB RAG — recommended' },
  { value: 'api_only', icon: <Zap size={14} />,      label: 'API Only',  desc: 'arXiv abstracts, faster' },
  { value: 'rag_only', icon: <Database size={14} />, label: 'RAG Only',  desc: 'Full-text semantic search' },
];

export default function ResearchPage() {
  const { submit, current, isLoading, error } = useResearch();
  const navigate = useNavigate();
  const [query, setQuery] = useState(() => {
    try {
      return localStorage.getItem('mars_current_query') || '';
    } catch {
      return '';
    }
  });
  const [mode, setMode] = useState<AblationMode>('both');
  const [iterations, setIterations] = useState(4);
  const [advanced, setAdvanced] = useState(false);

  const busy = isLoading;

  // Persist query to localStorage as user types
  React.useEffect(() => {
    try {
      localStorage.setItem('mars_current_query', query);
    } catch {}
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length < 5 || busy) return;
    submit(query.trim(), mode, iterations);
    // Keep query in localStorage while pipeline runs
    // It will be cleared when user submits a new query
  };

  const running = current && ['running','reflecting','pending'].includes(current.status);

  return (
    <div className="page anim-fadeUp" style={{ maxWidth: 820 }}>
      <div style={{ marginBottom: '2rem' }}>
        <div className="section-label" style={{ marginBottom: '0.4rem' }}>Research Query</div>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.4rem' }}>
          Launch a Research Session
        </h1>
        <p style={{ color: 'var(--prose-3)', fontSize: '0.85rem' }}>
          Agents will plan, retrieve papers, build a claim graph, verify, reflect, and produce a structured report.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card" style={{ marginBottom: '1.5rem', padding: '1.75rem' }}>
          {/* Query input */}
          <label className="section-label" style={{ display: 'block', marginBottom: '0.5rem' }}>
            Research Question
          </label>
          <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
            <Search size={15} color="var(--prose-3)" style={{ position: 'absolute', top: '0.7rem', left: '0.8rem', pointerEvents: 'none' }} />
            <textarea
              className="input"
              rows={4}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="e.g. What are the latest advances in federated learning privacy?"
              style={{ paddingLeft: '2.3rem' }}
              disabled={busy}
            />
          </div>

          {/* Mode selector */}
          <label className="section-label" style={{ display: 'block', marginBottom: '0.5rem' }}>Retrieval Mode</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '1.25rem' }}>
            {MODES.map(m => (
              <button
                key={m.value}
                type="button"
                onClick={() => setMode(m.value)}
                style={{
                  padding: '0.75rem 0.5rem',
                  borderRadius: 'var(--r)',
                  border: `1px solid ${mode === m.value ? 'var(--wire-hi)' : 'var(--wire)'}`,
                  background: mode === m.value ? 'var(--aqua-dim)' : 'var(--ink-2)',
                  color: mode === m.value ? 'var(--aqua)' : 'var(--prose-3)',
                  cursor: 'pointer', transition: 'all 0.15s',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem',
                }}
              >
                {m.icon}
                <span style={{ fontFamily: 'var(--f-display)', fontWeight: 700, fontSize: '0.78rem' }}>{m.label}</span>
                <span style={{ fontSize: '0.65rem', color: mode === m.value ? 'var(--aqua)' : 'var(--prose-4)', textAlign: 'center', lineHeight: 1.3 }}>{m.desc}</span>
              </button>
            ))}
          </div>

          {/* Advanced */}
          <button type="button" onClick={() => setAdvanced(!advanced)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'none', border: 'none', color: 'var(--prose-3)', fontSize: '0.75rem', fontFamily: 'var(--f-display)', fontWeight: 600, cursor: 'pointer', marginBottom: advanced ? '0.9rem' : 0, padding: 0 }}>
            {advanced ? <ChevronUp size={12} /> : <ChevronDown size={12} />} Advanced
          </button>

          {advanced && (
            <div className="anim-fadeIn" style={{ marginTop: '0.75rem', padding: '1rem', background: 'var(--ink-2)', borderRadius: 'var(--r)', border: '1px solid var(--wire)' }}>
              <label className="section-label" style={{ display: 'block', marginBottom: '0.6rem' }}>
                Max Iterations (§0.8 convergence): <span style={{ color: 'var(--aqua)' }}>{iterations}</span>
              </label>
              <input type="range" min={1} max={4} value={iterations}
                onChange={e => setIterations(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--aqua)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--prose-4)', marginTop: '0.3rem', fontFamily: 'var(--f-mono)' }}>
                {[1,2,3,4].map(n => <span key={n}>{n}</span>)}
              </div>
              <p style={{ fontSize: '0.72rem', color: 'var(--prose-3)', marginTop: '0.5rem' }}>
                System stops early when claim_delta &lt; 10% (convergence criterion §0.8).
              </p>
            </div>
          )}

          <div className="divider" style={{ margin: '1.25rem 0' }} />

          <button type="submit" className="btn btn-primary" disabled={query.trim().length < 5 || busy}
            style={{ width: '100%', padding: '0.8rem', fontSize: '0.9rem' }}>
            {busy ? (
              <><span style={{ animation: 'spin 1s linear infinite', display: 'inline-block', width: 15, height: 15, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }} /> Running Pipeline…</>
            ) : (
              <><Sparkles size={15} /> Launch Research Pipeline</>
            )}
          </button>
        </div>
      </form>

      {/* Pipeline tracker */}
      {current && (
        <div className="card anim-fadeIn" style={{ marginBottom: '1.5rem', padding: '1.25rem 1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <div className="section-label" style={{ marginBottom: '0.2rem' }}>Pipeline Progress</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--prose-2)' }}>
                Session <span style={{ fontFamily: 'var(--f-mono)', color: 'var(--aqua)' }}>{current.sessionId.slice(0,8)}</span>
              </div>
            </div>
            {current.status === 'done' && (
              <button className="btn btn-ghost" style={{ fontSize: '0.78rem', padding: '0.4rem 0.85rem' }}
                onClick={() => navigate('/report')}>
                View Report →
              </button>
            )}
          </div>
          <PipelineTracker status={current.status} isLoading={isLoading} />
          {error && <div className="notice notice-error" style={{ marginTop: '1rem' }}>{error}</div>}
        </div>
      )}

      {/* Examples */}
      <div>
        <div className="section-label" style={{ marginBottom: '0.6rem' }}>Example Queries</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          {EXAMPLES.map((ex, i) => (
            <button key={i} onClick={() => setQuery(ex)}
              style={{
                textAlign: 'left', background: 'var(--ink-1)', border: '1px solid var(--wire)',
                borderRadius: 'var(--r)', padding: '0.55rem 0.85rem',
                color: 'var(--prose-3)', fontSize: '0.82rem', cursor: 'pointer',
                transition: 'all 0.15s', fontFamily: 'var(--f-ui)',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--prose)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--wire-hi)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--prose-3)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--wire)'; }}
            >
              {ex}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
