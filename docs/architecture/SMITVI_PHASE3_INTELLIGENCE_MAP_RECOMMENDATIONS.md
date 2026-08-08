# SMITVI Phase 3 — Intelligence Map & Recommendation Engine

**Status:** Implemented (Phase 3)  
**Builds on:** Phase 1 Graph Foundation, Phase 2 Graph Search  

## 1. Purpose

Move from **search relevance** to **personalized discovery**:

- Who should I know / follow / mentor with / collaborate with?
- What should I learn (knowledge gaps)?
- What opportunities match my graph?

## 2. Reuse (no duplication)

| Existing | Phase 3 use |
|----------|-------------|
| `GraphService.getUserGraph` | Intelligence map nodes/edges, user context |
| `GraphSearchService.findSimilarExperts` | Similar expert recommendations |
| `UnifiedSearchService.similarExperts` | Ranked similar people |
| `ExpertRankingService` | Expert/mentor/collaborator scoring |
| `ExpertMatchBreakdown` | Explainable `%` breakdown |
| `SearchCache` pattern | `RecommendationCache` per user |

## 3. Intelligence Map

`GET /api/intelligence-map` returns `{ nodes, edges, filters }`:

- **Center:** USER entity  
- **Level 1:** skills, projects, experience (companies), topics, industries, expertise  
- **Level 2:** technologies, tools, knowledge sources (public only), related people (public qualified hubs, capped)

Client: SVG pan/zoom, node click → detail panel (confidence, evidence, related).

## 4. Recommendation architecture

```
User context (graph + profile + interests)
        │
        ├─► Similar experts (graph overlap + ExpertRankingService)
        ├─► Complementary experts (inverse skill/profession gaps + industry match)
        ├─► Mentors (similar + reputation + experience depth)
        ├─► Collaborators (CollaborationService complementarity score)
        ├─► Knowledge (public sources/topics vs user graph)
        ├─► Learning gaps (LearningGapService)
        └─► Opportunities (OpportunityService vs listings/consultations)
```

## 5. Ranking (recommendations)

Base: Phase 2 `computeOverallMatch` on interpreted entities derived from **viewer graph**.

Additional signals:

| Signal | Weight (similar) | Weight (complementary) |
|--------|------------------|-------------------------|
| Skill overlap | 0.30 | 0.10 (prefer low overlap) |
| Industry/topic | 0.20 | 0.25 |
| Project/tech | 0.15 | 0.20 |
| Graph proximity | 0.15 | 0.15 |
| Evidence | 0.10 | 0.10 |
| Complementarity | — | 0.20 |
| Reputation (capped) | 0.10 | 0.10 |

**Complementarity:** candidate strong in entity types viewer lacks (TECHNOLOGY, PROFESSION) while sharing INDUSTRY/TOPIC.

## 6. Collaboration score

`0.35 * complementarity + 0.25 * industryMatch + 0.20 * projectSimilarity + 0.10 * experienceCompat + 0.10 * freshness` (all 0–1).

## 7. Opportunity score

Match required skills/topics from listing description + seller graph edges vs viewer graph; same formula as Phase 2 multi-criteria AND with explanation of met/missing reqs.

## 8. Events & feedback

Tables: `recommendation_events`, `recommendation_feedback`.  
APIs: `POST /api/recommendations/:id/feedback`, `POST /api/recommendations/:id/action`.

## 9. Performance

- Cache full recommendation bundle per user 5 minutes  
- Candidate pools capped (50 public profiles max per type)  
- Invalidate cache on `POST` feedback/action (optional prefix bust)

## 10. Privacy

Public qualified hubs only for people recommendations; owner-only map includes private edges; no private knowledge excerpts.

## 11. Admin

`/admin/recommendations` — aggregates from events + graph health metrics.

## 12. Out of scope (Phase 3)

Growth agent, outreach automation, payments, company/university intelligence.
