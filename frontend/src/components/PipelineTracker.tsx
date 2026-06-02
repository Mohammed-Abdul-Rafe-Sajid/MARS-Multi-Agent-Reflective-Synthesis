import React from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import type { SessionStatus } from '../types';

const STEPS = ['Planner','arXiv','RAG Index','Claims','Synthesizer','Verifier','Reflection','Report'];

function stepIndex(status: SessionStatus | null): number {
  if (!status || status === 'pending') return 0;
  if (status === 'running') return 3;
  if (status === 'reflecting') return 5;
  if (status === 'done') return STEPS.length;
  return 0;
}

export function PipelineTracker({ status, isLoading }: { status: SessionStatus | null; isLoading: boolean }) {
  const active = stepIndex(status);

  return (
    <div className="pipeline-track">
      {STEPS.map((step, i) => {
        const done = i < active;
        const isActive = i === active && isLoading;
        return (
          <React.Fragment key={step}>
            <div className="pipeline-step">
              <div className={`pipeline-node ${done ? 'done' : isActive ? 'active' : ''}`}
                style={{ animation: isActive ? 'pulse 1.5s ease infinite' : 'none' }}>
                {done
                  ? <CheckCircle2 size={11} color="var(--jade)" />
                  : isActive
                    ? <Loader2 size={10} color="var(--aqua)" style={{ animation: 'spin 1s linear infinite' }} />
                    : <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--prose-4)', display: 'block' }} />
                }
              </div>
              <span className={`pipeline-label ${done ? 'done' : isActive ? 'active' : ''}`}>{step}</span>
            </div>
            {i < STEPS.length - 1 && <div className={`pipeline-line ${i < active - 1 ? 'done' : ''}`} />}
          </React.Fragment>
        );
      })}
    </div>
  );
}
