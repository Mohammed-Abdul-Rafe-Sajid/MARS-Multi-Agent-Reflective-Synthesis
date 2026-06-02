import React, { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp, ExternalLink, Download, FileText } from 'lucide-react';
import { useResearch } from '../hooks/useResearch';
import { api } from '../api/client';
import { PipelineTracker } from '../components/PipelineTracker';
import type { PaperObject } from '../types';

function Collapsible({ title, accent = 'var(--aqua)', children, defaultOpen = true }: {
  title: string; accent?: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <button onClick={() => setOpen(!open)} style={{
        width: '100%', background: 'none', border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.6rem 0', borderBottom: `1px solid var(--wire)`, marginBottom: open ? '0.85rem' : 0,
      }}>
        <span style={{ fontFamily: 'var(--f-display)', fontWeight: 700, fontSize: '0.9rem', color: accent }}>{title}</span>
        {open ? <ChevronUp size={14} color="var(--prose-4)" /> : <ChevronDown size={14} color="var(--prose-4)" />}
      </button>
      {open && <div className="anim-fadeIn">{children}</div>}
    </div>
  );
}

function PaperRow({ paper }: { paper: PaperObject }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem',
      padding: '0.75rem 0.9rem',
      background: 'var(--ink-2)', border: '1px solid var(--wire)', borderRadius: 'var(--r)',
      marginBottom: '0.4rem',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.83rem', fontWeight: 600, color: 'var(--prose)', lineHeight: 1.35, marginBottom: '0.2rem' }}>{paper.title}</div>
        <div style={{ fontSize: '0.7rem', color: 'var(--prose-3)', fontFamily: 'var(--f-mono)' }}>
          {paper.authors.slice(0,3).join(', ')}{paper.authors.length > 3 ? ' et al.' : ''} · {paper.year}
          {paper.rag_available && <span className="badge badge-rag" style={{ marginLeft: '0.5rem' }}>RAG</span>}
          {paper.doi && <span style={{ marginLeft: '0.5rem' }}>DOI: {paper.doi}</span>}
        </div>
      </div>
      {(paper.arxiv_link || paper.url) && (
        <a href={paper.arxiv_link || paper.url} target="_blank" rel="noreferrer"
          style={{ color: 'var(--prose-3)', flexShrink: 0, paddingTop: '0.1rem' }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--aqua)'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--prose-3)'}>
          <ExternalLink size={13} />
        </a>
      )}
    </div>
  );
}

export default function ReportPage() {
  const { current, result, isLoading } = useResearch();
  const report = result?.report;

  if (!current) {
    return (
      <div className="page anim-fadeIn">
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <FileText size={48} strokeWidth={1} color="var(--prose-4)" style={{ marginBottom: '1rem' }} />
          <h2 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>No Active Session</h2>
          <p style={{ color: 'var(--prose-3)', fontSize: '0.85rem' }}>Start a research query to generate a report.</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="page anim-fadeIn">
        <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem 1.5rem' }}>
          <div className="section-label" style={{ marginBottom: '0.75rem' }}>Generating Report…</div>
          <PipelineTracker status={current.status} isLoading={isLoading} />
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--prose-3)', fontSize: '0.85rem' }}>Report will appear here when the pipeline completes.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page anim-fadeUp">
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <div className="section-label" style={{ marginBottom: '0.3rem' }}>Research Report</div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.15 }}>
            {current.query.length > 90 ? current.query.slice(0, 90) + '…' : current.query}
          </h1>
        </div>
        <a href={api.bibtexUrl(current.sessionId)} download={`session_${current.sessionId.slice(0,8)}.bib`}
          className="btn btn-ghost" style={{ fontSize: '0.78rem' }}>
          <Download size={13} /> Export BibTeX
        </a>
      </div>

      {/* Confidence banner */}
      <div className="notice notice-info" style={{ marginBottom: '1.5rem', fontFamily: 'var(--f-mono)', fontSize: '0.72rem', overflowX: 'auto', whiteSpace: 'nowrap' }}>
        {report.confidence_metrics}
      </div>

      {/* Executive Summary */}
      <div className="card-glow" style={{ marginBottom: '1.5rem' }}>
        <div className="section-label" style={{ marginBottom: '0.6rem' }}>Executive Summary</div>
        <p className="prose" style={{ fontFamily: 'var(--f-prose)', fontSize: '0.95rem', lineHeight: 1.85, color: 'var(--prose-2)', margin: 0 }}>
          {report.executive_summary}
        </p>
      </div>

      {/* Thematic sections */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        {Object.entries(report.thematic_sections).map(([theme, content], i) => (
          <Collapsible key={theme} title={theme} defaultOpen={i === 0}>
            <p className="prose" style={{ whiteSpace: 'pre-wrap', color: 'var(--prose-2)', fontSize: '0.88rem', lineHeight: 1.85, fontFamily: 'var(--f-prose)' }}>
              {content}
            </p>
          </Collapsible>
        ))}
      </div>

      {/* Comparative table */}
      {report.comparative_table && (
        <div className="card" style={{ marginBottom: '1.5rem', overflowX: 'auto' }}>
          <Collapsible title="Comparative Analysis" accent="var(--gold)">
            <div className="prose" dangerouslySetInnerHTML={{ __html: mdTable(report.comparative_table) }} />
          </Collapsible>
        </div>
      )}

      {/* Limitations */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <Collapsible title="Limitations & Open Problems" accent="var(--gold)">
          <p className="prose" style={{ whiteSpace: 'pre-wrap', color: 'var(--prose-2)', fontSize: '0.88rem', lineHeight: 1.85, fontFamily: 'var(--f-prose)' }}>
            {report.limitations_and_gaps}
          </p>
        </Collapsible>
      </div>

      {/* References */}
      <div className="card">
        <Collapsible title={`References (${report.references.length})`} accent="var(--lavender)" defaultOpen={false}>
          {report.references.map(p => <PaperRow key={p.id} paper={p} />)}
        </Collapsible>
      </div>
    </div>
  );
}

function mdTable(md: string): string {
  const lines = md.trim().split('\n');
  if (lines.length < 2) return `<pre>${md}</pre>`;
  const header = lines[0].split('|').filter(Boolean).map(c => `<th>${c.trim()}</th>`).join('');
  const rows = lines.slice(2).map(l =>
    `<tr>${l.split('|').filter(Boolean).map(c => `<td>${c.trim()}</td>`).join('')}</tr>`
  ).join('');
  return `<table><thead><tr>${header}</tr></thead><tbody>${rows}</tbody></table>`;
}
