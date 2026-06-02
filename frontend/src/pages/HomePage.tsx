import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FlaskConical, Zap, GitBranch, BarChart3, BookOpen, ArrowRight, Database, Search, RefreshCw } from 'lucide-react';
import { useResearch } from '../hooks/useResearch';
import { PipelineTracker } from '../components/PipelineTracker';

function FeatureCard({ icon, title, desc, color }: { icon: React.ReactNode; title: string; desc: string; color: string }) {
  return (
    <div className="card" style={{ borderColor: color + '22' }}>
      <div style={{
        width: 38, height: 38, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: color + '15', border: `1px solid ${color}33`, marginBottom: '0.85rem',
      }}>
        {icon}
      </div>
      <div style={{ fontFamily: 'var(--f-display)', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.3rem' }}>{title}</div>
      <div style={{ fontSize: '0.8rem', color: 'var(--prose-3)', lineHeight: 1.6 }}>{desc}</div>
    </div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const { current, result, metrics, isLoading } = useResearch();

  const m = metrics?.metrics;

  return (
    <div className="page anim-fadeUp">
      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, var(--ink-2) 0%, var(--ink-1) 100%)',
        border: '1px solid var(--wire)',
        borderRadius: 'var(--r-xl)',
        padding: '3rem 2.5rem',
        marginBottom: '2rem',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Scan line decoration */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: 'linear-gradient(90deg, transparent, var(--aqua), transparent)',
          animation: 'shimmer 3s linear infinite',
          backgroundSize: '200% auto',
          opacity: 0.6,
        }} />

        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.25rem 0.75rem', borderRadius: 99,
          background: 'var(--aqua-dim)', border: '1px solid var(--wire-hi)',
          fontSize: '0.65rem', fontFamily: 'var(--f-mono)', color: 'var(--aqua)',
          letterSpacing: '0.08em', marginBottom: '1.25rem',
        }}>
          CITATION-ENFORCED · POLICY-DRIVEN REFLECTION · GPT-4o
        </div>

        <h1 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: '0.9rem' }}>
          Self-Reflective<br />
          <span style={{ background: 'linear-gradient(135deg, var(--aqua), var(--lavender))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Multi-Agent Research
          </span>
        </h1>

        <p style={{ color: 'var(--prose-2)', fontSize: '0.95rem', maxWidth: 560, lineHeight: 1.7, marginBottom: '1.75rem' }}>
          Five AI agents collaborate with formally-specified self-reflection to produce
          citation-bound, convergence-verified research reports.
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" style={{ padding: '0.65rem 1.4rem', fontSize: '0.88rem' }}
            onClick={() => navigate('/research')}>
            <Search size={15} /> Start Research
          </button>
          {current && (
            <button className="btn btn-ghost" style={{ padding: '0.65rem 1.2rem', fontSize: '0.88rem' }}
              onClick={() => navigate('/report')}>
              View Current Report <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Active session status */}
      {current && (
        <div className="card anim-fadeIn" style={{ marginBottom: '2rem', padding: '1.25rem 1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <div className="section-label" style={{ marginBottom: '0.3rem' }}>Active Session</div>
              <div style={{ fontFamily: 'var(--f-display)', fontWeight: 700, fontSize: '0.9rem', color: 'var(--prose)' }}>
                {current.query.length > 80 ? current.query.slice(0, 80) + '…' : current.query}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span className={`badge badge-${current.status}`}>{current.status}</span>
              <span className={`badge badge-${current.ablationMode}`}>{current.ablationMode}</span>
            </div>
          </div>
          <PipelineTracker status={current.status} isLoading={isLoading} />
        </div>
      )}

      {/* Metrics strip */}
      {m && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', marginBottom: '2rem' }}
          className="anim-fadeIn">
          {[
            { label: 'Papers', val: m.total_papers, color: 'var(--aqua)' },
            { label: 'Claims', val: m.total_claims, color: 'var(--lavender)' },
            { label: 'Verified', val: `${m.strongly_supported_pct.toFixed(0)}%`, color: 'var(--jade)' },
            { label: 'Halluci. Reduction', val: `${m.hallucination_reduction_pct.toFixed(0)}%`, color: 'var(--gold)' },
            { label: 'Iterations', val: m.iterations_to_convergence, color: 'var(--aqua)' },
            { label: 'RAG-Enriched', val: `${m.rag_enriched_claims_pct.toFixed(0)}%`, color: 'var(--lavender)' },
          ].map(s => (
            <div key={s.label} className="card" style={{ padding: '0.9rem 1rem', textAlign: 'center' }}>
              <div className="stat-num" style={{ color: s.color, fontSize: '1.5rem' }}>{s.val}</div>
              <div className="section-label" style={{ marginTop: '0.2rem' }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Feature grid */}
      <div>
        <h2 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--prose-2)', fontWeight: 600 }}>System Architecture</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
          <FeatureCard icon={<Search size={17} color="var(--aqua)" />} color="var(--aqua)"
            title="Dual Retrieval" desc="arXiv API + ChromaDB RAG — abstracts for recency, full-text chunks for depth." />
          <FeatureCard icon={<GitBranch size={17} color="var(--jade)" />} color="var(--jade)"
            title="Claim Graph" desc="Every claim is typed, cited, and bound to supporting paper IDs with computed support strength." />
          <FeatureCard icon={<RefreshCw size={17} color="var(--lavender)" />} color="var(--lavender)"
            title="Policy Reflection" desc="Threshold-based strategy selection: rewrite, retrieve, narrow, or flag uncertainty." />
          <FeatureCard icon={<BarChart3 size={17} color="var(--gold)" />} color="var(--gold)"
            title="Reliability Metrics" desc="Convergence tracking, hallucination reduction %, and evidence coverage — all measurable." />
        </div>
      </div>
    </div>
  );
}
