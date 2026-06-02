import type { RunQueryResponse, GetResultResponse, GetMetricsResponse, GetIterationsResponse, AblationMode } from '../types';

const BASE = 'http://localhost:8000/api/v1';

async function req<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, { headers: { 'Content-Type': 'application/json' }, ...opts });
  if (!res.ok) {
    const e = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(e.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  runQuery: (queryText: string, ablationMode: AblationMode = 'both', maxIterations = 4): Promise<RunQueryResponse> =>
    req('/run_query', { method: 'POST', body: JSON.stringify({ query_text: queryText, ablation_mode: ablationMode, max_iterations: maxIterations }) }),
  getResult: (id: string): Promise<GetResultResponse> => req(`/get_result/${id}`),
  getMetrics: (id: string): Promise<GetMetricsResponse> => req(`/get_metrics/${id}`),
  getIterations: (id: string): Promise<GetIterationsResponse> => req(`/get_iterations/${id}`),
  bibtexUrl: (id: string) => `${BASE}/export_bibtex/${id}`,
  health: () => req<{ status: string; version: string }>('/health'),
};
