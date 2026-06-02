import React from 'react';
import { useLocation } from 'react-router-dom';
import { Loader2, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { useResearch } from '../hooks/useResearch';

const PAGE_TITLES: Record<string, string> = {
  '/': 'Home', '/research': 'New Research', '/report': 'Research Report',
  '/claims': 'Claim Graph', '/metrics': 'Reliability Metrics',
  '/iterations': 'Iteration History', '/history': 'Session History',
};

export function Topbar() {
  const { pathname } = useLocation();
  const { current, isLoading } = useResearch();

  const StatusIcon = () => {
    if (!current) return null;
    if (isLoading) return <Loader2 size={13} color="var(--aqua)" style={{ animation: 'spin 1s linear infinite' }} />;
    if (current.status === 'done') return <CheckCircle2 size={13} color="var(--jade)" />;
    if (current.status === 'failed') return <AlertCircle size={13} color="var(--coral)" />;
    return <Clock size={13} color="var(--gold)" />;
  };

  return (
    <div className="topbar">
      <h1 style={{ fontFamily: 'var(--f-display)', fontWeight: 700, fontSize: '0.95rem', flex: 1 }}>
        {PAGE_TITLES[pathname] ?? 'Research Platform'}
      </h1>

      {current && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.73rem', fontFamily: 'var(--f-mono)', color: 'var(--prose-3)' }}>
          <StatusIcon />
          <span style={{ color: 'var(--prose-2)' }}>
            {current.sessionId.slice(0, 8)}…
          </span>
          <span className={`badge badge-${current.status}`}>{current.status}</span>
        </div>
      )}
    </div>
  );
}
