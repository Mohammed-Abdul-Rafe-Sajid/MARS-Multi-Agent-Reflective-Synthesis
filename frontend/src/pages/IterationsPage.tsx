import React, { useState } from 'react';
import { Activity, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';
import { useResearch } from '../hooks/useResearch';
import type { IterationSnapshot } from '../types';

const STRATEGY_LABELS: Record<string, string> = {
  rewrite_synthesis: 'Rewrite Synthesis',
  retrieve_evidence: 'Retrieve Evidence',
  narrow_scope: 'Narrow Scope',
  flag_uncertainty: 'Flag Uncertainty',
};

function IterCard({ snap }: { snap: IterationSnapshot }) {
  const [open, setOpen] = useState(snap.iteration_number === 1);
  const log = snap.reflection_log;
  const converged = snap.claim_delta !== null && snap.claim_delta < 0.10;

  const v = snap.claims.filter(c => c.verification_status === 'verified').length;
  const w = snap.claims.filter(c => c.verification_status === 'weak').length;
  const co = snap.claims.filter(c => c.verification_status === 'contradicted').length;

  return (
    <div style={{ border: '1px solid var(--wire)', borderRadius: 'var(--r-lg)', marginBottom: '0.75rem', overflow: 'hidden' }}>
      <button onClick={() => setOpen(!open)}
        style={{
          width: '100%', background: open ? 'var(--ink-2)' : 'var(--ink-1)',
          border: 'none', cursor: 'pointer', padding: '1rem 1.25rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'background 0.15s',
        }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{
            width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
            background: converged ? 'rgba(61,255,160,0.15)' : 'var(--ink-3)',
            border: `2px solid ${converged ? 'var(--jade)' : 'var(--wire)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--f-display)', fontWeight: 800, fontSize: '0.82rem',
            color: converged ? 'var(--jade)' : 'var(--prose)',
          }}>
            {snap.iteration_number}
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontFamily: 'var(--f-display)', fontWeight: 700, fontSize: '0.88rem' }}>
              Iteration {snap.iteration_number}
              {converged && <span style={{ marginLeft: '0.5rem', fontSize: '0.65rem', color: 'var(--jade)', fontFamily: 'var(--f-mono)' }}>✓ CONVERGED</span>}
            </div>
            {snap.claim_delta !== null && (
              <div style={{ fontSize: '0.65rem', color: 'var(--prose-3)', fontFamily: 'var(--f-mono)' }}>
                Δ = {(snap.claim_delta * 100).toFixed(1)}% — {converged ? 'below threshold' : 'above 10% threshold'}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.4rem', marginLeft: '0.25rem' }}>
            <span className="badge badge-verified">{v}</span>
            <span className="badge badge-weak">{w}</span>
            {co > 0 && <span className="badge badge-contradicted">{co}</span>}
          </div>
        </div>
        {open ? <ChevronUp size={14} color="var(--prose-4)" /> : <ChevronDown size={14} color="var(--prose-4)" />}
      </button>

      {open && (
        <div className="anim-fadeIn" style={{ padding: '1.25rem', borderTop: '1px solid var(--wire)', background: 'var(--ink-1)' }}>
          {snap.synthesis_text && (
            <div style={{ marginBottom: '1.25rem' }}>
              <div className="section-label" style={{ marginBottom: '0.4rem' }}>Synthesis Excerpt</div>
              <p style={{ fontSize: '0.85rem', color: 'var(--prose-2)', lineHeight: 1.75, background: 'var(--ink-2)', padding: '0.85rem 1rem', borderRadius: 'var(--r)', border: '1px solid var(--wire)', fontFamily: 'var(--f-prose)' }}>
                {snap.synthesis_text.slice(0, 500)}{snap.synthesis_text.length > 500 ? '…' : ''}
              </p>
            </div>
          )}

          {log && (
            <div>
              <div className="section-label" style={{ marginBottom: '0.75rem' }}>Reflection Policy Engine Output</div>
              <div style={{ padding: '1rem', background: 'var(--ink-2)', borderRadius: 'var(--r)', border: '1px solid var(--wire)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                  <span className="badge badge-method">{STRATEGY_LABELS[log.strategy] ?? log.strategy}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--prose-2)' }}>{log.reason}</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', margin: '0.75rem 0', paddingTop: '0.75rem', borderTop: '1px solid var(--wire)' }}>
                  {[{ label: 'Before', s: log.metrics_before }, { label: 'After', s: log.metrics_after }].map(({ label, s }) => (
                    <div key={label}>
                      <div className="section-label" style={{ marginBottom: '0.35rem', fontSize: '0.58rem' }}>{label}</div>
                      <div style={{ fontSize: '0.72rem', fontFamily: 'var(--f-mono)', color: 'var(--prose-3)', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <span>Verified <span style={{ color: 'var(--jade)' }}>{s.verified_pct.toFixed(1)}%</span></span>
                        <span>Weak <span style={{ color: 'var(--gold)' }}>{s.weak_pct.toFixed(1)}%</span></span>
                        <span>Avg Strength <span style={{ color: 'var(--aqua)' }}>{s.avg_support_strength.toFixed(3)}</span></span>
                        <span>RAG Enriched <span style={{ color: 'var(--lavender)' }}>{s.rag_enriched_claims_pct.toFixed(1)}%</span></span>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ paddingTop: '0.75rem', borderTop: '1px solid var(--wire)', display: 'flex', gap: '1.5rem', fontSize: '0.7rem', fontFamily: 'var(--f-mono)', color: 'var(--prose-3)', flexWrap: 'wrap' }}>
                  <span>Changed claims: <span style={{ color: 'var(--prose)' }}>{log.changed_claim_ids.length}</span></span>
                  <span>New papers: <span style={{ color: 'var(--aqua)' }}>{log.new_paper_ids.length}</span></span>
                  <span>New chunks: <span style={{ color: 'var(--lavender)' }}>{log.new_chunk_ids.length}</span></span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function IterationsPage() {
  const { iterations } = useResearch();
  const iters = iterations?.iterations ?? [];

  if (!iters.length) {
    return (
      <div className="page anim-fadeIn">
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <Activity size={48} strokeWidth={1} color="var(--prose-4)" style={{ marginBottom: '1rem' }} />
          <h2 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>No Iterations Yet</h2>
          <p style={{ color: 'var(--prose-3)', fontSize: '0.85rem' }}>Iterations will appear as the pipeline runs.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page anim-fadeUp">
      <div style={{ marginBottom: '1.75rem' }}>
        <div className="section-label" style={{ marginBottom: '0.3rem' }}>Iteration History</div>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Reflection Loop Trace</h1>
        <p style={{ color: 'var(--prose-3)', fontSize: '0.82rem', marginTop: '0.25rem' }}>
          Every iteration logged with strategy selection, metrics before/after, and claim delta.
        </p>
      </div>
      {iters.map(snap => <IterCard key={snap.iteration_number} snap={snap} />)}
    </div>
  );
}
