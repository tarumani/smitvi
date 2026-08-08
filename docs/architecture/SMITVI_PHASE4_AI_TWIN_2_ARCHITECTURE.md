# SMITVI Phase 4 — AI Twin 2.0 (Graph-Aware Personal Intelligence)

**Status:** Implemented (Phase 4)  
**Builds on:** Phase 1 Graph, Phase 2 Search, Phase 3 Recommendations, existing AskTwin RAG  

## 1. Objective

Upgrade the Knowledge Twin pipeline without replacing it:

```
Question → Intent → Query plan → [Graph | RAG | Profile | Memory | Recommendations]
         → Evidence fusion → Confidence → Response (cited) → Feedback/analytics
```

**RAG** answers what sources say. **Graph** answers how facts connect. **Profile** answers who the person is. **Memory** answers recent conversation context (not verified facts).

## 2. Reuse (no second AI stack)

| Existing | Phase 4 use |
|----------|-------------|
| `AskTwin` | Orchestration entry; streaming unchanged for clients |
| `PrismaKnowledgeRepository.searchSimilar` | RAG + graph-aware re-rank |
| `embedTexts` / `CHAT_MODEL` | Generation only when planned |
| `GraphService.getUserGraph` | Twin graph retriever |
| `RecommendationService` | Learning / expert discovery intents |
| `QueryUnderstandingService` patterns | Entity hints (industries, projects) |
| Graph relationship PATCH APIs | Corrections / verify |
| `ConversationRepository` | Memory + quality events |

## 3. New services (`src/application/twin/`)

| Service | Role |
|---------|------|
| `TwinQueryUnderstandingService` | Rule-based intent + entities |
| `TwinQueryPlanner` | Required sources per intent |
| `TwinGraphRetriever` | Scoped subgraph + evidence |
| `GraphAwareRetriever` | Semantic search + entity boost |
| `TwinEvidenceFusion` | Merge graph/RAG/profile evidence |
| `TwinConfidenceEngine` | HIGH/MEDIUM/LOW/UNKNOWN + claim level |
| `TwinContradictionEngine` | Detect conflicting numeric/experience claims |
| `TwinResponseGenerator` | Prompts, citations, policy, related Qs |
| `TwinMemoryService` | Recent conversation turns (non-fact) |
| `TwinContextService` | Structured context API |
| `TwinIntelligenceEngine` | Single `prepare()` used by AskTwin |
| `TwinAnalyticsService` | Query events + admin metrics |
| `TwinEvaluationService` | Golden + hallucination checks (deterministic) |

Org workspace chats skip graph/recommendations (RAG-only path preserved).

## 4. Confidence model

Weighted score 0–1 from:

- RAG top-3 average (0.35)
- Graph evidence strength (0.25)
- User-verified edges (0.20)
- Source count cap (0.10)
- Freshness penalty (0.10)

Mapped to **HIGH** (≥0.72), **MEDIUM** (≥0.45), **LOW** (≥0.25), **UNKNOWN** (<0.25).

Claim levels: **VERIFIED** (USER_VERIFIED graph or explicit profile), **SUPPORTED** (graph+RAG align), **INFERRED** (weak single signal), **UNKNOWN** (no evidence).

## 5. Response policy

- VERIFIED / HIGH: direct answer, third-person default (“Based on {name}'s…”)
- SUPPORTED / MEDIUM: qualified answer
- INFERRED / LOW: label inference
- UNKNOWN: *“I don't have enough verified information to answer that.”*
- Contradictions: surface both sources; do not pick silently

**First-person mode** (`representative`): only VERIFIED/SUPPORTED claims; system prompt enforces.

## 6. Graph-aware RAG

1. Resolve focus entities from question + graph buckets matching keywords  
2. `searchSimilar` (existing)  
3. Re-rank: +0.08 per focus entity mention in chunk (cap +0.24)  
4. Fuse with graph relationship evidence into unified citations  

## 7. APIs

| Method | Route |
|--------|--------|
| POST | `/api/twin/chat` → proxies `/api/v1/chat` |
| POST | `/api/twin/query` → non-stream prepare + policy answer |
| GET | `/api/twin/context` |
| GET | `/api/twin/sources` |
| POST | `/api/twin/feedback` |
| POST | `/api/twin/correct` → graph relationship update |
| POST | `/api/twin/verify` |
| POST | `/api/twin/generate` |
| GET | `/api/twin/evaluation` |

Legacy **`POST /api/v1/chat`** unchanged URL; behavior upgraded via engine.

## 8. Database

- `twin_query_events` — intent, sources, confidence, latency, flags  
- `twin_feedback` — helpful, hallucination, correction signals  

## 9. Security

- Retrieved documents are **data**, never system instructions (injection defense in prompts)  
- `getUserGraph(owner, viewer)` enforces visibility  
- Public twin: `publicOnly` RAG + public graph rules  
- Rate limits on twin APIs  

## 10. Performance / cost

- Deterministic intent/plan/graph for factual queries  
- Graph traversal capped (focus entities ≤ 12, paths depth ≤ 3)  
- RAG top-K unchanged (6)  
- No full graph sent to LLM — subgraph text only  
- Query event logging async (non-blocking)  

## 11. Future-ready (not implemented)

- Multi-twin private messaging interfaces in `TwinDiscoveryPort` (stub)  
- Twin-to-twin collaboration (interface only)  

## 12. Migration

Deploy with Prisma migration `20260808180000_phase4_twin_intelligence`. Existing conversations/messages compatible; extended citation JSON is backward compatible.
