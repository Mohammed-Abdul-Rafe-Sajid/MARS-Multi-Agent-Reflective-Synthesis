import React, { useState, useMemo } from 'react';
import { GitBranch, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { useResearch } from '../hooks/useResearch';
import type { ClaimObject, VerificationStatus, ClaimType } from '../types';

const STATUSES: (VerificationStatus | 'all')[] = ['all', 'verified', 'weak', 'contradicted'];
const TYPES: (ClaimType | 'all')[] = ['all', 'method', 'result', 'limitation', 'comparison'];

function StrengthBar({ value }: { value: number }) {
  const color = value >= 0.75 ? 'var(--jade)' : value >= 0.5 ? 'var(--gold)' : 'var(--coral)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
      <div className="bar-track" style={{ flex: 1 }}>
        <div className="bar-fill" style={{ width: `${value * 100}%`, background: color }} />
      </div>
      <span style={{ fontSize: '0.68rem', fontFamily: 'var(--f-mono)', color: 'var(--prose-3)', minWidth: 28 }}>
        {value.toFixed(2)}
      </span>
    </div>
  );
}

function ClaimCard({ claim }: { claim: ClaimObject }) {
  const [open, setOpen] = useState(false);
  return (
    <div onClick={() => setOpen(!open)}
      style={{
        padding: '0.9rem 1rem', background: 'var(--ink-2)',
        border: '1px solid var(--wire)', borderRadius: 'var(--r)',
        marginBottom: '0.4rem', cursor: 'pointer', transition: 'border-color 0.15s',
      }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--wire-hi)'}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--wire)'}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
        <span className={`badge badge-${claim.verification_status}`}>{claim.verification_status}</span>
        <span className={`badge badge-${claim.claim_type}`}>{claim.claim_type}</span>
        {claim.evidence_depth === 'rag_enriched' && <span className="badge badge-rag">RAG</span>}
        <span style={{ marginLeft: 'auto', fontSize: '0.63rem', color: 'var(--prose-4)', fontFamily: 'var(--f-mono)' }}>
          v{claim.iteration_version} · conf {claim.confidence_score.toFixed(2)}
        </span>
      </div>
      <p style={{ fontSize: '0.85rem', color: 'var(--prose)', lineHeight: 1.55, marginBottom: '0.6rem' }}>
        {claim.claim_text}
      </p>
      <StrengthBar value={claim.support_strength} />
      {open && (
        <div className="anim-fadeIn" style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--wire)' }}>
          <div style={{ fontSize: '0.72rem', fontFamily: 'var(--f-mono)', color: 'var(--prose-3)', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <div>supporting papers: <span style={{ color: 'var(--aqua)' }}>{claim.supporting_paper_ids.join(', ') || '—'}</span></div>
            <div>chunks: <span style={{ color: 'var(--prose-2)' }}>{claim.supporting_chunks.length}</span></div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ClaimsPage() {
  const { iterations } = useResearch();
  const [status, setStatus] = useState<VerificationStatus | 'all'>('all');
  const [type, setType] = useState<ClaimType | 'all'>('all');
  const [search, setSearch] = useState('');
  const [iterNum, setIterNum] = useState<number | 'latest'>('latest');

  const allIters = iterations?.iterations ?? [];
  const selectedIter = iterNum === 'latest' ? allIters.at(-1) : allIters.find(i => i.iteration_number === iterNum);
  const allClaims = selectedIter?.claims ?? [];

  const filtered = useMemo(() =>
    allClaims.filter(c =>
      (status === 'all' || c.verification_status === status) &&
      (type === 'all' || c.claim_type === type) &&
      (search === '' || c.claim_text.toLowerCase().includes(search.toLowerCase()))
    ), [allClaims, status, type, search]);

  const verified = allClaims.filter(c => c.verification_status === 'verified').length;
  const weak     = allClaims.filter(c => c.verification_status === 'weak').length;
  const contra   = allClaims.filter(c => c.verification_status === 'contradicted').length;

  if (!allClaims.length) {
    return (
      <div className="page anim-fadeIn">
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <GitBranch size={48} strokeWidth={1} color="var(--prose-4)" style={{ marginBottom: '1rem' }} />
          <h2 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>No Claims Yet</h2>
          <p style={{ color: 'var(--prose-3)', fontSize: '0.85rem' }}>Claims will appear as the Claim Graph Builder runs.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page anim-fadeUp">
      <div style={{ marginBottom: '1.5rem' }}>
        <div className="section-label" style={{ marginBottom: '0.3rem' }}>Claim Graph</div>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Evidence-Bound Claims</h1>
        <p style={{ color: 'var(--prose-3)', fontSize: '0.82rem', marginTop: '0.25rem' }}>
          Every claim is typed, cited, and scored using the §0.3 support strength formula.
        </p>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.6rem', marginBottom: '1.25rem' }}>
        {[
          { l: 'Total',  v: allClaims.length, c: 'var(--aqua)' },
          { l: 'Verified', v: verified, c: 'var(--jade)' },
          { l: 'Weak',  v: weak,     c: 'var(--gold)' },
          { l: 'Contradicted', v: contra, c: 'var(--coral)' },
        ].map(s => (
          <div key={s.l} className="card" style={{ padding: '0.75rem', textAlign: 'center' }}>
            <div className="stat-num" style={{ color: s.c, fontSize: '1.4rem' }}>{s.v}</div>
            <div className="section-label" style={{ marginTop: '0.15rem', fontSize: '0.58rem' }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <Filter size={13} color="var(--prose-3)" />

        {allIters.length > 1 && (
          <select className="input" value={iterNum} onChange={e => setIterNum(e.target.value === 'latest' ? 'latest' : Number(e.target.value))}
            style={{ width: 'auto', padding: '0.35rem 0.7rem', fontSize: '0.75rem' }}>
            <option value="latest">Latest iteration</option>
            {allIters.map(i => <option key={i.iteration_number} value={i.iteration_number}>Iteration {i.iteration_number}</option>)}
          </select>
        )}

        <select className="input" value={status} onChange={e => setStatus(e.target.value as any)}
          style={{ width: 'auto', padding: '0.35rem 0.7rem', fontSize: '0.75rem' }}>
          {STATUSES.map(s => <option key={s} value={s}>{s === 'all' ? 'All statuses' : s}</option>)}
        </select>

        <select className="input" value={type} onChange={e => setType(e.target.value as any)}
          style={{ width: 'auto', padding: '0.35rem 0.7rem', fontSize: '0.75rem' }}>
          {TYPES.map(t => <option key={t} value={t}>{t === 'all' ? 'All types' : t}</option>)}
        </select>

        <input className="input" placeholder="Search claims…" value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 180, padding: '0.35rem 0.7rem', fontSize: '0.78rem' }} />

        <span style={{ fontSize: '0.7rem', color: 'var(--prose-3)', fontFamily: 'var(--f-mono)', flexShrink: 0 }}>
          {filtered.length}/{allClaims.length}
        </span>
      </div>

      {/* Claims */}
      {filtered.length === 0
        ? <div className="card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--prose-3)', fontSize: '0.85rem' }}>No claims match current filters.</div>
        : filtered.map(c => <ClaimCard key={c.claim_id} claim={c} />)
      }
    </div>
  );
}
