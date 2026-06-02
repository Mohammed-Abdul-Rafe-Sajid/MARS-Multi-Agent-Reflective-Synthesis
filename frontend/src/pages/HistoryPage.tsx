import React from 'react';
import { Clock, ArrowRight, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useResearch, Session } from '../hooks/useResearch';

function timeAgo(ms: number): string {
  const s = Math.floor((Date.now() - ms) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function HistoryPage() {
  const { history, loadSession } = useResearch();
  const navigate = useNavigate();

  if (!history.length) {
    return (
      <div className="page anim-fadeIn">
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <Clock size={48} strokeWidth={1} color="var(--prose-4)" style={{ marginBottom: '1rem' }} />
          <h2 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>No History Yet</h2>
          <p style={{ color: 'var(--prose-3)', fontSize: '0.85rem' }}>Past sessions will appear here automatically.</p>
        </div>
      </div>
    );
  }

  const handleLoad = (s: Session) => {
    loadSession(s);
    navigate('/report');
  };

  return (
    <div className="page anim-fadeUp">
      <div style={{ marginBottom: '1.75rem' }}>
        <div className="section-label" style={{ marginBottom: '0.3rem' }}>Session History</div>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Past Research Sessions</h1>
        <p style={{ color: 'var(--prose-3)', fontSize: '0.82rem', marginTop: '0.25rem' }}>
          Stored locally in your browser. Click to reload any session.
        </p>
      </div>

      {history.map((s, i) => (
        <div key={s.sessionId} className="card anim-slideIn" style={{ marginBottom: '0.6rem', animationDelay: `${i * 0.04}s` }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                <span className={`badge badge-${s.status}`}>{s.status}</span>
                <span className={`badge badge-${s.ablationMode}`}>{s.ablationMode}</span>
                <span style={{ fontSize: '0.65rem', color: 'var(--prose-4)', fontFamily: 'var(--f-mono)' }}>
                  {timeAgo(s.startedAt)}
                </span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--prose)', lineHeight: 1.45, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                {s.query}
              </p>
              <div style={{ marginTop: '0.35rem', fontSize: '0.65rem', color: 'var(--prose-4)', fontFamily: 'var(--f-mono)' }}>
                {s.sessionId}
              </div>
            </div>
            <button className="btn btn-ghost" style={{ fontSize: '0.75rem', padding: '0.4rem 0.75rem', flexShrink: 0 }}
              onClick={() => handleLoad(s)}>
              Load <ArrowRight size={12} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
