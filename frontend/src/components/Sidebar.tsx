import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FlaskConical, Home, Search, BarChart3, GitBranch, BookOpen, Clock, Plus, Activity } from 'lucide-react';
import { useResearch } from '../hooks/useResearch';

const NAV = [
  { to: '/',            icon: <Home size={15} />,      label: 'Home' },
  { to: '/research',    icon: <Search size={15} />,    label: 'New Research' },
  { to: '/report',      icon: <BookOpen size={15} />,  label: 'Report' },
  { to: '/claims',      icon: <GitBranch size={15} />, label: 'Claims' },
  { to: '/metrics',     icon: <BarChart3 size={15} />, label: 'Metrics' },
  { to: '/iterations',  icon: <Activity size={15} />,  label: 'Iterations' },
  { to: '/history',     icon: <Clock size={15} />,     label: 'History' },
];

export function Sidebar() {
  const { current, history } = useResearch();
  const navigate = useNavigate();

  const statusColor: Record<string, string> = {
    done: 'var(--jade)', running: 'var(--aqua)', reflecting: 'var(--lavender)',
    failed: 'var(--coral)', pending: 'var(--gold)',
  };

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div style={{
        padding: '1.25rem 1rem 1rem',
        borderBottom: '1px solid var(--wire)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'var(--aqua-dim)', border: '1px solid var(--wire-hi)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <FlaskConical size={15} color="var(--aqua)" />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--f-display)', fontWeight: 800, fontSize: '0.88rem', letterSpacing: '-0.01em' }}>
              MARS
            </div>
            <div style={{ fontSize: '0.55rem', color: 'var(--prose-4)', fontFamily: 'var(--f-display)', fontWeight: 600, lineHeight: 1.2 }}>
              Multi Agent Reflective Synthesis
            </div>
            <div style={{ fontSize: '0.58rem', color: 'var(--prose-3)', fontFamily: 'var(--f-mono)', letterSpacing: '0.05em' }}>
              v3.0
            </div>
          </div>
        </div>
        <button className="btn btn-primary" style={{ width: '100%', marginTop: '0.75rem', fontSize: '0.78rem', padding: '0.5rem' }}
          onClick={() => navigate('/research')}>
          <Plus size={13} /> New Query
        </button>
      </div>

      {/* Active session */}
      {current && (
        <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--wire)' }}>
          <div className="section-label" style={{ marginBottom: '0.4rem' }}>Active Session</div>
          <div style={{
            background: 'var(--ink-3)', borderRadius: 'var(--r)', padding: '0.55rem 0.7rem',
            border: '1px solid var(--wire)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem' }}>
              <div style={{
                width: 7, height: 7, borderRadius: '50%',
                background: statusColor[current.status] || 'var(--prose-3)',
                flexShrink: 0,
                animation: ['running','reflecting'].includes(current.status) ? 'blink 1.2s ease infinite' : 'none',
              }} />
              <span className="badge" style={{ fontSize: '0.58rem' }}>
                <span className={`badge badge-${current.status}`}>{current.status}</span>
              </span>
            </div>
            <div style={{
              fontSize: '0.72rem', color: 'var(--prose-2)', lineHeight: 1.3,
              overflow: 'hidden', display: '-webkit-box',
              WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            }}>
              {current.query}
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav style={{ padding: '0.5rem 0.5rem', flex: 1 }}>
        <div className="section-label" style={{ padding: '0.5rem 0.5rem', marginBottom: '0.25rem' }}>Navigation</div>
        {NAV.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: '0.6rem',
              padding: '0.5rem 0.65rem', borderRadius: 'var(--r)',
              marginBottom: '0.15rem',
              color: isActive ? 'var(--aqua)' : 'var(--prose-2)',
              background: isActive ? 'var(--aqua-dim)' : 'transparent',
              fontSize: '0.82rem', fontFamily: 'var(--f-display)', fontWeight: 600,
              textDecoration: 'none',
              transition: 'all 0.15s',
              border: isActive ? '1px solid rgba(77,217,247,0.15)' : '1px solid transparent',
            })}
          >
            {item.icon}
            {item.label}
            {item.to === '/history' && history.length > 0 && (
              <span style={{
                marginLeft: 'auto', background: 'var(--ink-4)', color: 'var(--prose-3)',
                borderRadius: 99, padding: '0 0.35rem', fontSize: '0.62rem', fontFamily: 'var(--f-mono)',
              }}>
                {history.length}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--wire)' }}>
        <div style={{ fontSize: '0.65rem', color: 'var(--prose-3)', fontFamily: 'var(--f-mono)', lineHeight: 1.5 }}>
          GPT-4o · ChromaDB<br />arXiv · FastAPI
        </div>
      </div>
    </aside>
  );
}
