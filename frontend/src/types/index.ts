export type ClaimType = 'method' | 'result' | 'limitation' | 'comparison';
export type VerificationStatus = 'verified' | 'weak' | 'contradicted';
export type EvidenceDepth = 'abstract_only' | 'rag_enriched';
export type SourceType = 'abstract' | 'rag_chunk';
export type QueryType = 'survey' | 'comparison' | 'gap_analysis';
export type AblationMode = 'api_only' | 'rag_only' | 'both';
export type ReflectionStrategy = 'rewrite_synthesis' | 'retrieve_evidence' | 'narrow_scope' | 'flag_uncertainty';
export type SessionStatus = 'pending' | 'running' | 'reflecting' | 'done' | 'failed';

export interface EvidenceObject {
  text: string; paper_id: string; chunk_id: string | null; source_type: SourceType;
}
export interface PaperObject {
  id: string; title: string; authors: string[]; year: number; abstract: string;
  url: string; doi: string | null; arxiv_link: string | null;
  extracted_claims: string[]; evidence_snippets: EvidenceObject[];
  chunk_ids: string[]; rag_available: boolean;
}
export interface ClaimObject {
  claim_id: string; claim_text: string; claim_type: ClaimType;
  supporting_paper_ids: string[]; supporting_chunks: string[];
  support_strength: number; confidence_score: number;
  verification_status: VerificationStatus; iteration_version: number;
  evidence_depth: EvidenceDepth;
}
export interface MetricsSnapshot {
  total_claims: number; verified_pct: number; weak_pct: number;
  contradicted_pct: number; avg_support_strength: number; rag_enriched_claims_pct: number;
}
export interface ReflectionLogObject {
  iteration: number; strategy: ReflectionStrategy; reason: string;
  changed_claim_ids: string[]; new_paper_ids: string[]; new_chunk_ids: string[];
  metrics_before: MetricsSnapshot; metrics_after: MetricsSnapshot; claim_delta: number;
}
export interface SessionMetrics {
  session_id: string; total_papers: number; total_claims: number;
  rag_enriched_claims_pct: number; strongly_supported_pct: number;
  weakly_supported_pct: number; insufficient_evidence_pct: number;
  iterations_to_convergence: number; hallucination_reduction_pct: number;
  avg_papers_per_claim: number; retrieval_mode: AblationMode;
}
export interface StructuredReport {
  executive_summary: string; thematic_sections: Record<string, string>;
  comparative_table: string | null; limitations_and_gaps: string;
  confidence_metrics: string; references: PaperObject[];
}
export interface IterationSnapshot {
  iteration_number: number; synthesis_text: string; claims: ClaimObject[];
  reflection_log: ReflectionLogObject | null; claim_delta: number | null;
}
export interface RunQueryResponse {
  session_id: string; status: SessionStatus; estimated_iterations: number; ablation_mode: AblationMode;
}
export interface GetResultResponse {
  session_id: string; status: SessionStatus; report: StructuredReport | null;
}
export interface GetMetricsResponse {
  session_id: string; metrics: SessionMetrics | null; reflection_logs: ReflectionLogObject[];
}
export interface GetIterationsResponse {
  session_id: string; iterations: IterationSnapshot[];
}
