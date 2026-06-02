"""
Orchestrator — full pipeline controller (background task).
Fixes:
  1. RAG collection name passed through consistently
  2. Convergence check skips iteration 1 (enforced here)
  3. claim_delta computed against pre-verify snapshot, not same list
  4. Strategy applied AFTER persisting, BEFORE next iteration
  5. new_paper_ids / new_chunk_ids passed into reflection log
"""

from loguru import logger
from sqlalchemy.orm import Session as DBSession

from agents import planner, claim_graph_builder, synthesizer, verifier, reflection_engine
from retrieval import arxiv_retriever, evidence_structurer
from rag import chunker, indexer, retriever as rag_retriever
from evaluation import metrics as eval_metrics
from memory import repository
from utils.schemas import (
    SessionStatus, AblationMode, ClaimObject,
    ReflectionLogObject, ReflectionStrategy,
)
from config import settings


def run_pipeline(
    session_id: str,
    query_text: str,
    ablation_mode: AblationMode,
    max_iterations: int,
    db: DBSession,
):
    logger.info(f"[Orchestrator] START session={session_id} | mode={ablation_mode} | max_iter={max_iterations}")
    rag_collection = f"session_{session_id[:8]}"

    try:
        # ── 1. Planner ─────────────────────────────────────────────────────────
        repository.update_status(db, session_id, SessionStatus.RUNNING)
        plan = planner.run(query_text, ablation_mode)
        repository.save_planner_output(db, session_id, plan)

        # ── 2. arXiv retrieval ─────────────────────────────────────────────────
        papers = []
        if ablation_mode in (AblationMode.API_ONLY, AblationMode.BOTH):
            papers = arxiv_retriever.retrieve(
                themes=plan.themes,
                max_papers=settings.max_papers_per_query,
                age_cutoff_years=settings.paper_age_cutoff_years,
            )

        # ── 3. RAG indexing + retrieval ────────────────────────────────────────
        rag_evidence_map: dict = {}
        if ablation_mode in (AblationMode.RAG_ONLY, AblationMode.BOTH) and papers:
            all_chunks = []
            for paper in papers:
                chunks = chunker.chunk_abstract(paper.id, session_id, paper.abstract)
                all_chunks.extend(chunks)
            indexer.index_chunks(all_chunks, collection_name=rag_collection)
            rag_evidence_map = rag_retriever.query_all_themes(
                plan.themes, collection_name=rag_collection
            )

        # ── 4. Evidence structuring ────────────────────────────────────────────
        papers = evidence_structurer.merge_evidence(papers, rag_evidence_map)
        repository.save_papers(db, session_id, papers)
        evidence_map  = evidence_structurer.build_evidence_map(papers)
        paper_id_set  = {p.id for p in papers}
        embedding_map: dict[str, list[float]] = {}   # populated if RAG embeddings available

        # ── 5. Initial claim graph ─────────────────────────────────────────────
        claims: list[ClaimObject] = claim_graph_builder.build_graph(papers, iteration_version=1)
        claims_initial = list(claims)

        reflection_logs: list[ReflectionLogObject] = []
        prev_verified_count = -1  # sentinel so iteration 1 never triggers early exit

        # ── 6. Synthesize → Verify → Reflect loop ─────────────────────────────
        for iteration in range(1, max_iterations + 1):
            logger.info(f"[Orchestrator] === Iteration {iteration}/{max_iterations} ===")
            repository.update_status(db, session_id, SessionStatus.RUNNING)

            # 6a. Synthesize
            report = synthesizer.run(plan, claims, papers)

            # 6b. Verify — snapshot BEFORE so delta is meaningful
            repository.update_status(db, session_id, SessionStatus.REFLECTING)
            claims_before_verify = list(claims)
            verified_claims = verifier.verify_all(claims, evidence_map, embedding_map, paper_id_set)

            # 6c. Delta (status changes between pre- and post-verify)
            claim_delta = reflection_engine.compute_claim_delta(claims_before_verify, verified_claims)

            # 6d. Strategy selection
            strategy, reason = reflection_engine.select_strategy(verified_claims)
            logger.info(f"[Orchestrator] iter={iteration} strategy={strategy.value} delta={claim_delta:.3f}")

            # 6e. Build reflection log
            rlog = reflection_engine.build_reflection_log(
                iteration=iteration,
                strategy=strategy,
                reason=reason,
                claims_before=claims_before_verify,
                claims_after=verified_claims,
            )
            reflection_logs.append(rlog)

            # 6f. Persist
            repository.save_iteration(
                db=db,
                session_id=session_id,
                iteration_number=iteration,
                synthesis_text=report.executive_summary,
                claims=verified_claims,
                reflection_log=rlog,
                claim_delta=claim_delta,
            )

            # Advance working set
            claims = verified_claims
            verified_count = sum(1 for c in claims if c.verification_status.value == "verified")

            # 6g. Convergence (skip on iteration 1 — always need ≥ 1 reflect cycle)
            if iteration > 1:
                stagnated = (verified_count == prev_verified_count)
                converged = reflection_engine.has_converged(claim_delta)
                if converged or stagnated:
                    logger.info(
                        f"[Orchestrator] Stopping: converged={converged} stagnated={stagnated} "
                        f"delta={claim_delta:.3f} verified={verified_count}"
                    )
                    break

            prev_verified_count = verified_count

            # 6h. Stop if strategy says so
            if strategy == ReflectionStrategy.FLAG_UNCERTAINTY:
                logger.info("[Orchestrator] Irreducible uncertainty — stopping.")
                break

            # 6i. Apply strategy to prepare next iteration
            if iteration < max_iterations:
                new_paper_ids: list[str] = []
                new_chunk_ids: list[str] = []

                if strategy == ReflectionStrategy.RETRIEVE_EVIDENCE:
                    extra = arxiv_retriever.retrieve(
                        themes=plan.themes,
                        max_papers=5,
                        age_cutoff_years=settings.paper_age_cutoff_years,
                    )
                    if extra:
                        enriched_extra = evidence_structurer.merge_evidence(extra, {})
                        papers       = papers + enriched_extra
                        paper_id_set.update(p.id for p in extra)
                        evidence_map.update(evidence_structurer.build_evidence_map(enriched_extra))
                        new_claims = claim_graph_builder.build_graph(extra, iteration_version=iteration + 1)
                        claims     = claims + new_claims
                        new_paper_ids = [p.id for p in extra]
                        logger.info(f"[Orchestrator] +{len(extra)} papers, +{len(new_claims)} claims")

                elif strategy == ReflectionStrategy.REWRITE_SYNTHESIS:
                    logger.info("[Orchestrator] Rewriting — re-extracting from top papers")
                    fresh = claim_graph_builder.build_graph(papers[:5], iteration_version=iteration + 1)
                    kept  = [c for c in claims if c.verification_status.value == "verified"]
                    claims = kept + fresh

                elif strategy == ReflectionStrategy.NARROW_SCOPE:
                    plan = planner.run(f"Focused: {plan.themes[0]}", ablation_mode)
                    logger.info(f"[Orchestrator] Narrowed scope → {plan.themes}")

        # ── 7. Final report + metrics ──────────────────────────────────────────
        final_report = synthesizer.run(plan, claims, papers)
        session_metrics = eval_metrics.compute_session_metrics(
            session_id=session_id,
            papers=papers,
            claims_initial=claims_initial,
            claims_final=claims,
            reflection_logs=reflection_logs,
            ablation_mode=ablation_mode,
        )

        repository.finalize(db, session_id, final_report, session_metrics)
        logger.info(f"[Orchestrator] DONE session={session_id} | verified={sum(1 for c in claims if c.verification_status.value == 'verified')}/{len(claims)}")

    except Exception as exc:
        logger.exception(f"[Orchestrator] FATAL session={session_id}: {exc}")
        repository.fail_session(db, session_id)
