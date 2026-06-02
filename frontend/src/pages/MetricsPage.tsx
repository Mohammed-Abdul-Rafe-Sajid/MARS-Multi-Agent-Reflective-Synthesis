import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadialBarChart, RadialBar, LineChart, Line, Legend,
} from 'recharts';
import { BarChart3, TrendingDown, RefreshCw, Layers, Award, Target } from 'lucide-react';
import { useResearch } from '../hooks/useResearch';

function KPI({ label, value, unit = '', color, icon }: { label: string; value: string | number; unit?: string; color: string; icon?: React.ReactNode }) {
  return (
    <div className="card" style={{ padding: '1.1rem 1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--prose-3)', marginBottom: '0.4rem' }}>
        {icon}
        <span className="section-label">{label}</span>
      </div>
      <div className="stat-num" style={{ color, fontSize: '1.8rem' }}>
        {value}<span style={{ fontSize: '0.85rem', fontWeight: 400, color: 'var(--prose-3)', marginLeft: 2 }}>{unit}</span>
      </div>
    </div>
  );
}

const CHART_STYLE = {
  contentStyle: { background: 'var(--ink-2)', border: '1px solid var(--wire)', borderRadius: 8, fontSize: 11, fontFamily: "'JetBrains Mono', monospace" },
  axisStyle: { fill: 'var(--prose-3)', fontSize: 10, fontFamily: "'JetBrains Mono', monospace" },
};

const STRATEGY_COLORS: Record<string, string> = {
  rewrite_synthesis: '#4dd9f7',
  retrieve_evidence: '#3dffa0',
  narrow_scope: '#ffd166',
  flag_uncertainty: '#ff6b8a',
};

export default function MetricsPage() {
  const { metrics } = useResearch();
  const m = metrics?.metrics;
  const logs = metrics?.reflection_logs ?? [];

  if (!m) {
    return (
      <div className="page anim-fadeIn">
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <BarChart3 size={48} strokeWidth={1} color="var(--prose-4)" style={{ marginBottom: '1rem' }} />
          <h2 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>No Metrics Yet</h2>
          <p style={{ color: 'var(--prose-3)', fontSize: '0.85rem' }}>Metrics appear after the first reflection cycle completes.</p>
        </div>
      </div>
    );
  }

  const pieData = [
    { name: 'Strongly Supported', value: m.strongly_supported_pct,      fill: '#3dffa0' },
    { name: 'Weakly Supported',   value: m.weakly_supported_pct,        fill: '#ffd166' },
    { name: 'Insufficient',        value: m.insufficient_evidence_pct,   fill: '#ff6b8a' },
  ];

  const iterData = logs.map(l => ({
    name: `Iter ${l.iteration}`,
    verified_before: +l.metrics_before.verified_pct.toFixed(1),
    verified_after:  +l.metrics_after.verified_pct.toFixed(1),
    weak_before:     +l.metrics_before.weak_pct.toFixed(1),
    weak_after:      +l.metrics_after.weak_pct.toFixed(1),
    delta:           +(l.claim_delta * 100).toFixed(1),
    strategy:        l.strategy,
  }));

  const strengthData = logs.map(l => ({
    name: `Iter ${l.iteration}`,
    before: +l.metrics_before.avg_support_strength.toFixed(3),
    after:  +l.metrics_after.avg_support_strength.toFixed(3),
  }));

  return (
    <div className="page anim-fadeUp">
      <div style={{ marginBottom: '1.75rem' }}>
        <div className="section-label" style={{ marginBottom: '0.3rem' }}>Reliability Metrics</div>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Session Analytics</h1>
        <p style={{ color: 'var(--prose-3)', fontSize: '0.82rem', marginTop: '0.25rem' }}>
          Quantitative evidence of self-reflection improving research reliability (§5).
        </p>
      </div>

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.7rem', marginBottom: '1.5rem' }}>
        <KPI label="Papers Analysed"         value={m.total_papers}                              color="var(--aqua)"     icon={<Layers size={11} />} />
        <KPI label="Total Claims"            value={m.total_claims}                              color="var(--lavender)" icon={<Target size={11} />} />
        <KPI label="Halluci. Reduction"      value={m.hallucination_reduction_pct.toFixed(1)}  unit="%" color="var(--jade)"     icon={<TrendingDown size={11} />} />
        <KPI label="Convergence Iteration"   value={m.iterations_to_convergence}                color="var(--gold)"     icon={<RefreshCw size={11} />} />
        <KPI label="RAG-Enriched"            value={m.rag_enriched_claims_pct.toFixed(1)}      unit="%" color="var(--lavender)" />
        <KPI label="Avg Papers / Claim"      value={m.avg_papers_per_claim.toFixed(1)}          color="var(--aqua)"     icon={<Award size={11} />} />
      </div>

      {/* Charts row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>

        {/* Radial claim support */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div className="section-label" style={{ marginBottom: '0.75rem' }}>Claim Support Distribution</div>
          <ResponsiveContainer width="100%" height={200}>
            <RadialBarChart cx="50%" cy="50%" innerRadius="30%" outerRadius="90%" data={pieData} startAngle={90} endAngle={-270}>
              <RadialBar dataKey="value" cornerRadius={5} />
              <Tooltip contentStyle={CHART_STYLE.contentStyle} formatter={(v: number) => [`${v.toFixed(1)}%`]} />
            </RadialBarChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '0.35rem' }}>
            {pieData.map(d => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.68rem', color: 'var(--prose-3)' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.fill }} />
                {d.name}: <strong style={{ color: 'var(--prose)' }}>{d.value.toFixed(1)}%</strong>
              </div>
            ))}
          </div>
        </div>

        {/* Verified % per iteration */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div className="section-label" style={{ marginBottom: '0.75rem' }}>Verified Claims % Per Iteration</div>
          {iterData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={iterData} barSize={18} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--wire)" />
                <XAxis dataKey="name" tick={CHART_STYLE.axisStyle} />
                <YAxis tick={CHART_STYLE.axisStyle} unit="%" domain={[0, 100]} />
                <Tooltip contentStyle={CHART_STYLE.contentStyle} />
                <Bar dataKey="verified_before" name="Before" fill="rgba(61,255,160,0.3)" radius={[3,3,0,0]} />
                <Bar dataKey="verified_after"  name="After"  fill="#3dffa0"              radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p style={{ color: 'var(--prose-4)', fontSize: '0.82rem', textAlign: 'center', paddingTop: '3rem' }}>No iteration data yet</p>}
        </div>
      </div>

      {/* Charts row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>

        {/* Avg support strength trend */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div className="section-label" style={{ marginBottom: '0.75rem' }}>Avg Support Strength Trend</div>
          {strengthData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={strengthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--wire)" />
                <XAxis dataKey="name" tick={CHART_STYLE.axisStyle} />
                <YAxis tick={CHART_STYLE.axisStyle} domain={[0, 1]} />
                <Tooltip contentStyle={CHART_STYLE.contentStyle} />
                <Line type="monotone" dataKey="before" name="Before" stroke="rgba(77,217,247,0.4)" strokeWidth={2} dot={{ fill: 'var(--aqua)', r: 3 }} />
                <Line type="monotone" dataKey="after"  name="After"  stroke="var(--aqua)"           strokeWidth={2} dot={{ fill: 'var(--aqua)', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <p style={{ color: 'var(--prose-4)', fontSize: '0.82rem', textAlign: 'center', paddingTop: '3rem' }}>No iteration data yet</p>}
        </div>

        {/* Claim delta per iteration */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div className="section-label" style={{ marginBottom: '0.75rem' }}>Claim Delta Per Iteration (§0.8)</div>
          {iterData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={iterData} barSize={22}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--wire)" />
                <XAxis dataKey="name" tick={CHART_STYLE.axisStyle} />
                <YAxis tick={CHART_STYLE.axisStyle} unit="%" />
                <Tooltip contentStyle={CHART_STYLE.contentStyle} formatter={(v: number) => [`${v}%`, 'Claim Δ']} />
                <Bar dataKey="delta" name="Claim Δ" fill="var(--gold)" radius={[3,3,0,0]}
                  label={{ position: 'top', fill: 'var(--prose-3)', fontSize: 9, fontFamily: 'JetBrains Mono' }} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p style={{ color: 'var(--prose-4)', fontSize: '0.82rem', textAlign: 'center', paddingTop: '3rem' }}>No iteration data yet</p>}
        </div>
      </div>

      {/* Reflection log table */}
      {logs.length > 0 && (
        <div className="card">
          <div className="section-label" style={{ marginBottom: '1rem' }}>Reflection Policy Engine — Log</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
              <thead>
                <tr>
                  {['Iter','Strategy','Reason','Claim Δ','Verified ↑','Weak ↓','Changed'].map(h => (
                    <th key={h} style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontFamily: 'var(--f-mono)', fontSize: '0.65rem', color: 'var(--aqua)', borderBottom: '1px solid var(--wire)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map(l => (
                  <tr key={l.iteration}>
                    <td style={{ padding: '0.5rem 0.75rem', fontFamily: 'var(--f-mono)', color: 'var(--prose)', borderBottom: '1px solid var(--wire)' }}>{l.iteration}</td>
                    <td style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--wire)' }}>
                      <span className="badge badge-method" style={{ background: (STRATEGY_COLORS[l.strategy] || '#4dd9f7') + '18', color: STRATEGY_COLORS[l.strategy] || '#4dd9f7', borderColor: (STRATEGY_COLORS[l.strategy] || '#4dd9f7') + '33' }}>
                        {l.strategy.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--wire)', color: 'var(--prose-3)', fontSize: '0.73rem', maxWidth: 240 }}>{l.reason}</td>
                    <td style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--wire)', fontFamily: 'var(--f-mono)', color: l.claim_delta < 0.1 ? 'var(--jade)' : 'var(--gold)' }}>
                      {(l.claim_delta * 100).toFixed(1)}%
                    </td>
                    <td style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--wire)', fontFamily: 'var(--f-mono)', color: 'var(--jade)' }}>
                      {l.metrics_before.verified_pct.toFixed(1)}% → {l.metrics_after.verified_pct.toFixed(1)}%
                    </td>
                    <td style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--wire)', fontFamily: 'var(--f-mono)', color: 'var(--gold)' }}>
                      {l.metrics_before.weak_pct.toFixed(1)}% → {l.metrics_after.weak_pct.toFixed(1)}%
                    </td>
                    <td style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--wire)', fontFamily: 'var(--f-mono)', color: 'var(--prose-2)' }}>
                      {l.changed_claim_ids.length}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
