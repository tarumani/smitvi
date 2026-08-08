# SMITVI Graph Search — Phase 2

**Status:** Implemented (Phase 2)  
**Depends on:** Phase 1 Human Intelligence Graph foundation  

## 1. Search architecture

Hybrid retrieval pipeline:

```
Query → QueryUnderstanding (rules + graph validation [+ optional LLM cache])
      → Parallel: KeywordSearch | SemanticVectorSearch | GraphSearch
      → CandidateFusion (dedupe by userId / entityId)
      → ExpertRankingService (explainable signals)
      → Evidence enrichment
      → Response + analytics event
```

RAG chunk retrieval for Twin is unchanged. Search uses the same public corpus filters (`qualifiedPublicHubProfileWhere`).

## 2. Query understanding

- **Rule layer:** intent detection, stop-word stripping (“best”, “find”, “who”), phrase extraction.
- **Graph validation:** each extracted entity is resolved via `GraphService.resolveEntity`; unresolved entities remain as **text criteria** matched by keyword/graph slug.
- **Optional LLM:** disabled by default for latency; enable with `SEARCH_QUERY_LLM=1` for complex queries (cached 10m).

Structured output: `SearchIntent` + `InterpretedEntity[]` with `requirement: REQUIRED | OPTIONAL | OR`.

## 3. Hybrid search

| Source | Role |
|--------|------|
| Keyword | Profiles, skills, knowledge titles (existing `PrismaSearchRepository`) |
| Semantic | pgvector on `knowledge_chunks.embedding_vector` (cosine), fallback to bounded in-memory scan |
| Graph | USER → typed edges → global entities (AND / OR / optional) |

## 4. Graph traversal

Max depth **1** for expert discovery (USER → target entity). Project → technology/industry uses depth **2** only when project-type criteria present.

Relationship map:

| Entity type | Relationship |
|-------------|--------------|
| SKILL | USER_HAS_SKILL |
| PROFESSION | USER_HAS_EXPERTISE |
| INDUSTRY | USER_WORKS_IN_INDUSTRY |
| TECHNOLOGY | USER_USES_TECHNOLOGY |
| TOOL | USER_USES_TOOL |
| PROJECT | USER_CREATED_PROJECT |
| TOPIC | USER_INTERESTED_IN |
| COMPANY | USER_WORKED_AT |

Visibility: only public qualified hubs; edges exclude `USER_REJECTED` / `HIDDEN`; AI edges require `USER_VERIFIED` or confidence ≥ 0.65 for search.

## 5. Ranking formula

Weighted sum (0–1 each signal), then **overallMatch = round(100 × sum)**:

| Signal | Weight |
|--------|--------|
| skillMatch | 0.26 |
| industryMatch | 0.17 |
| projectMatch | 0.13 |
| technologyMatch | 0.09 |
| experienceMatch | 0.07 |
| knowledgeMatch | 0.09 |
| semanticSimilarity | 0.06 |
| evidenceStrength | 0.04 |
| verificationScore | 0.02 |
| profileCompleteness | 0.02 |
| freshnessScore | 0.02 |
| reputationBoost | 0.01 (capped inside signal) |
| graphConnectivity | 0.02 |

**Popularity cap:** `followersCount` does not enter the formula directly; reputation uses `reputationScore` with hard cap so relevance dominates.

Unverified criteria appear in breakdown as **“not verified”** — never labeled “Expert”.

## 6. Evidence model

Each match line links to `GraphEvidence` or profile field reference when `USER_VERIFIED` or PROFILE-sourced. Display: source type + excerpt (truncated).

## 7. API design

- `POST /api/search/query` — primary unified search
- `GET /api/search?q=` — legacy + lightweight
- `GET /api/search/experts|knowledge|projects|skills|topics|suggestions|filters`
- `GET /api/search/similar/:userId`
- Analytics: `SearchAnalyticsService.recordEvent` (anonymized)

## 8. UI

`/search` — unified experience, categories, expert cards with breakdown, empty-state partial matches, debounced suggestions.

## 9. Performance

- Debounce suggestions 300ms
- In-memory cache for interpreted queries (5m) and popular results (2m)
- pgvector HNSW index when extension available
- Pagination default limit 20
- Target p95 < 500ms excluding optional LLM

## 10. Security

Public-only discovery; private graph nodes never in candidate SQL; no private knowledge excerpts in results.

## 11. Testing

Unit: query understanding, ranking math, AND/OR fusion. Integration: graph SQL mocked or test DB optional.
