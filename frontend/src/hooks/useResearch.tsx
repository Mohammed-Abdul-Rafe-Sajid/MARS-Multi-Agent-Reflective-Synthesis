import React, { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import { api } from '../api/client';
import type { SessionStatus, GetResultResponse, GetMetricsResponse, GetIterationsResponse, AblationMode } from '../types';

export interface Session {
  sessionId: string;
  query: string;
  status: SessionStatus;
  ablationMode: AblationMode;
  startedAt: number;
}

export interface ResearchState {
  current: Session | null;
  result: GetResultResponse | null;
  metrics: GetMetricsResponse | null;
  iterations: GetIterationsResponse | null;
  error: string | null;
  isLoading: boolean;
  history: Session[];
}

interface ResearchCtx extends ResearchState {
  submit: (q: string, mode: AblationMode, maxIter: number) => void;
  reset: () => void;
  loadSession: (s: Session) => void;
}

const Ctx = createContext<ResearchCtx | null>(null);
export const useResearch = () => useContext(Ctx)!;

const TERMINAL = new Set<SessionStatus>(['done', 'failed']);
const POLL_MS = 3000;
const HISTORY_KEY = 'mars_history';
const CURRENT_QUERY_KEY = 'mars_current_query';

export function ResearchProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ResearchState>({
    current: null, result: null, metrics: null, iterations: null,
    error: null, isLoading: false, history: [],
  });
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load history from localStorage
  useEffect(() => {
    try {
      const h = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]') as Session[];
      setState(p => ({ ...p, history: h }));
    } catch {}
  }, []);

  const saveHistory = useCallback((h: Session[]) => {
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(0, 20))); } catch {}
  }, []);

  const stop = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }, []);

  const poll = useCallback(async (id: string) => {
    try {
      const [result, metrics, iterations] = await Promise.all([
        api.getResult(id), api.getMetrics(id), api.getIterations(id),
      ]);
      setState(p => {
        const updated = p.current ? { ...p.current, status: result.status } : p.current;
        // Update history status
        const hist = p.history.map(h => h.sessionId === id ? { ...h, status: result.status } : h);
        saveHistory(hist);
        return { ...p, current: updated, result, metrics, iterations, isLoading: !TERMINAL.has(result.status), history: hist };
      });
      if (TERMINAL.has(result.status)) stop();
    } catch (err) {
      setState(p => ({ ...p, error: err instanceof Error ? err.message : 'Polling error', isLoading: false }));
      stop();
    }
  }, [stop, saveHistory]);

  const submit = useCallback(async (query: string, ablationMode: AblationMode, maxIterations: number) => {
    stop();
    setState(p => ({ ...p, current: null, result: null, metrics: null, iterations: null, error: null, isLoading: true }));
    try {
      const res = await api.runQuery(query, ablationMode, maxIterations);
      const session: Session = { sessionId: res.session_id, query, status: res.status, ablationMode, startedAt: Date.now() };
      // Clear current query from localStorage after submission
      try { localStorage.removeItem(CURRENT_QUERY_KEY); } catch {}
      setState(p => {
        const hist = [session, ...p.history];
        saveHistory(hist);
        return { ...p, current: session, history: hist };
      });
      await poll(res.session_id);
      pollRef.current = setInterval(() => poll(res.session_id), POLL_MS);
    } catch (err) {
      setState(p => ({ ...p, error: err instanceof Error ? err.message : 'Failed to start', isLoading: false }));
    }
  }, [poll, stop, saveHistory]);

  const reset = useCallback(() => {
    stop();
    setState(p => ({ ...p, current: null, result: null, metrics: null, iterations: null, error: null, isLoading: false }));
  }, [stop]);

  const loadSession = useCallback(async (session: Session) => {
    stop();
    setState(p => ({ ...p, current: session, result: null, metrics: null, iterations: null, error: null, isLoading: false }));
    try {
      const [result, metrics, iterations] = await Promise.all([
        api.getResult(session.sessionId), api.getMetrics(session.sessionId), api.getIterations(session.sessionId),
      ]);
      setState(p => ({ ...p, result, metrics, iterations }));
    } catch (err) {
      setState(p => ({ ...p, error: err instanceof Error ? err.message : 'Failed to load session' }));
    }
  }, [stop]);

  useEffect(() => () => stop(), [stop]);

  return <Ctx.Provider value={{ ...state, submit, reset, loadSession }}>{children}</Ctx.Provider>;
}
