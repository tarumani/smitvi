# SMITVI Human Intelligence Graph — Phase 0 Audit

**Date:** 2026-08-08  
**Scope:** Full repository inspection (`smitvi/` monolith)  
**Conclusion:** Smitvi has a **strong RAG + profile + search foundation** but **no Human Intelligence Graph** as structured entities, relationships, or evidence. Marketing and landing copy use “intelligence graph” metaphorically.

---

## 1. Executive summary

| Area | Status |
|------|--------|
| Human Intelligence Graph (entities + edges + evidence) | **Missing** |
| Vector RAG (chunks + embeddings) | **Implemented** |
| Profile skills (flat list) | **Partial** |
| AI tags/topics on sources | **Partial** (metadata only) |
| Semantic + keyword search | **Partial** (no graph traversal) |
| AI Twin answers | **Implemented** (chunk RAG only) |
| Graph visualization / Intelligence Map | **Missing** (marketing UI only) |
| Admin graph explorer | **Missing** |

**Do not assume a graph exists.** Extend the current stack (PostgreSQL + Prisma + OpenAI) rather than introducing Neo4j unless scale proves insufficient.

---

## 2. Authentication & users

### A. What exists

- **Supabase Auth** — identity in `auth.users`; app `User` row synced (`src/infrastructure/auth/supabase/`, `SyncAuthenticatedUser`).
- **Roles & plans:** `Role`, `Plan` on `User`.
- **Session:** `getCurrentSession` / `requireSession` on API routes.

### B–D. Gaps

- No graph-specific user node beyond `User` + `Profile`.
- Authorization is **application-layer** (session + repository `userId` filters), not Postgres RLS policies in repo migrations.

### E–F. Reuse

- `User.id` as owner of all graph nodes scoped to a person.
- Existing audit + session patterns for graph APIs.

---

## 3. Profiles & identity pillar

### A. What exists (`Profile`, related)

| Model | Purpose |
|-------|---------|
| `Profile` | username, bio, headline, visibility, onboarding, `profession`, `interests` (JSON), `intelligencePoints`, `reputationScore`, archetype |
| `Skill` + `ProfileSkill` | Canonical skill names + slugs; M:N to profile with `level` |
| `Experience` | title, company, dates (unlinked to graph entities) |
| `PortfolioItem` | title, description, URL (unlinked to projects/skills) |
| `SocialLink` | platform URLs |
| `Follow` | follower/following (social graph, not HI graph) |
| `Review` | ratings → feeds `reputationScore` |

- Profile CRUD: `CreateProfile`, `UpdateProfile`, `syncSkills()` in `profile-repository.ts` (upsert `Skill` by slug — **basic dedup**).
- Public hub: `src/app/(marketing)/u/[username]/page.tsx`, `IntelligenceHubTabs` (Overview, Knowledge, Ask, Offers, etc.) — **no Intelligence Map tab**.

### B. Partial

- **Skills:** Real DB rows, not AI-extracted with evidence/confidence.
- **Intelligence Score (UI):** `intelligencePoints` + `calculateIntelligenceScore()` — onboarding checklist points, **not** explainable graph depth/breadth.
- **Reputation:** `computeReputationScore()` — reviews + followers + ready source count (`update-reputation.ts`).

### C. Mock / demo only

- `DEMO_*` in `config/demo-content.ts`, `network-home-demo.ts` for empty network UX.

### D. Missing

- Expertise, Industry, Technology, Tool, Project nodes as first-class entities.
- Relationships between experience ↔ company ↔ skills.
- User approval workflow for inferred facts.
- “What Smitvi knows about me” graph inspector.

### E–F. Reuse / change

- **Reuse:** `Skill` slug upsert pattern → prototype for `graph_entity_aliases`.
- **Extend:** Link `Experience.company` → `Company` entity; `PortfolioItem` → `Project`.
- **Replace:** Do not treat `tags[]` / `topics[]` on sources as the graph — migrate into typed entities over time.

---

## 4. Knowledge uploads & AI processing

### A. What exists

**Schema:** `KnowledgeSource`, `KnowledgeChunk`, `ImportJob`.

**Pipeline** (`ProcessKnowledgeSource`):

1. EXTRACTING — file or stored text (`extract-text.ts`: PDF, DOCX, PPTX partial; TXT/MD).
2. CHUNKING — `chunkText()` domain helper.
3. EMBEDDING — OpenAI `text-embedding-3-small` → stored on chunk.
4. SUMMARIZING — `generateKnowledgeMetadata()` → summary, FAQs, **tags**, **topics** (JSON arrays on source).
5. READY — chunks persisted.

**Ingestion entry points:**

- Upload API → `UploadKnowledge` → sync process.
- URL imports → `ImportJob` → `ProcessImportJob` → `createFromExtractedUrl` → same processor.
- Types: WEBSITE, LINKEDIN, GITHUB, YOUTUBE, NOTION, PDF, etc.

**Visibility:** `KnowledgeSource.isPublic` + API `PATCH .../visibility`.

### B. Partial

- **Tags/topics:** AI-generated strings, displayed in UI and search — **not** normalized graph nodes or edges.
- **FAQs:** Stored on source; search can match question text — not Q/A graph nodes.

### C. Not a graph

- No entity extraction, relationship extraction, confidence, or evidence rows.
- `extractedText` can be large — good **provenance raw material** for future evidence excerpts.

### D. Missing

- Entity/relationship extraction step.
- Graph update after processing.
- Async job queue (processing is **inline** on upload/import in request/worker path — verify deploy: no dedicated queue table except `ImportJob` status).

### E–F. Reuse

- Hook **after** `saveProcessed` to enqueue `graph_jobs` (new).
- `KnowledgeSource.id` as `graph_evidence.source_id`.
- Keep RAG path unchanged initially; add graph as parallel structured layer.

---

## 5. Embeddings & vector search

### A. What exists

- `KnowledgeChunk.embedding` — `Float[]` in Prisma; comment mentions pgvector.
- **Twin chat:** `PrismaKnowledgeRepository.searchSimilar()` — load chunks (up to 2000 per user scope), **cosine in application code** (`domain/knowledge/similarity.ts`).
- **Public search:** `searchSemanticPublic()` loads up to **1500** public chunks, cosine in JS, threshold 0.72 (`search-repository.ts`).

### B. Partial / gap

- **No pgvector index** found in `prisma/migrations` (no `CREATE EXTENSION vector`, no IVFFlat/HNSW).
- Embeddings stored but **not** queried at SQL layer — scalability risk.

### C–D. Missing for graph

- `graph_entity_embeddings` (optional entity-level vectors).
- Hybrid retrieval: graph traversal + vector.

### E–F. Reuse

- Same embedding model/dimensions (`config/ai.ts`).
- Phase 6+: add pgvector column + SQL `<=>` for chunks; entity embeddings optional.

---

## 6. AI Twin & chat

### A. What exists

- `AskTwin.prepare()` — embed question, retrieve chunks, confidence gate (`ANSWER_MIN_TOP_SCORE`, `ANSWER_MIN_CONFIDENCE`).
- `streamAnswer()` / `answerOnce()` — OpenAI chat with chunk context only; citations to chunks.
- `Conversation` / `ConversationMessage` with `citations` JSON.
- Public twin: `publicOnly` filters `isPublic` sources.

### B–D. Missing

- Graph traversal (“what projects did I work on?” → PROJECT edges).
- Known / Likely / Unknown classification from evidence coverage.
- Hallucination control tied to **relationship** verification, not just chunk similarity.

### E–F. Reuse

- Add **structured context block** from graph query in `prepare()` alongside chunk context.
- Keep confidence gate; strengthen with evidence counts.

---

## 7. Search & discovery

### A. What exists

- `GET /api/v1/search` → `PrismaSearchRepository.search()`:
  - People: ILIKE on profile + skill names.
  - Skills: `Skill` table counts.
  - Topics: `unnest(knowledge_sources.topics)` aggregate.
  - Knowledge: public sources metadata.
  - Questions: FAQ match on sources.
  - Semantic: chunk cosine (public).
- Discover / network home: trending experts, topics, following feed — **heuristic SQL**, not graph ranking.
- Expert discovery for “healthcare UX designer” = **text match**, not `USER_HAS_SKILL` ∧ `WORKS_IN_INDUSTRY`.

### D. Missing

- Intent-aware graph queries.
- Evidence-weighted ranking.
- Similar experts via graph + behavior.

---

## 8. Marketplace, consultations, orgs

### A. What exists

- `MarketplaceListing`, orders, Razorpay/Stripe.
- `ConsultationOffer`, `ConsultationRequest`.
- `Organization`, members, org-scoped knowledge.

### For graph (future)

- Listings → `Product` / `Service` nodes.
- Orgs → `Organization` / `Company` entities.
- **Not wired today.**

---

## 9. Communities, courses, jobs

### D. Missing

- No `Community`, `Course`, `Job`, `Event` models in `schema.prisma`.
- Blueprint mentions pillars; **not implemented** as graph entity types.

---

## 10. Admin & analytics

### A. What exists

- Routes: `/admin`, `/admin/users`, `/admin/knowledge`, `/admin/twins`, `/admin/moderation`, `/admin/growth`.
- Growth metrics: marketplace counts, revenue aggregates.

### D. Missing

- `/admin/intelligence-graph` — entities, relationships, health, low-confidence edges, extraction errors.

---

## 11. Background jobs & events

### A. What exists

- GitHub Actions crons: hub digest, activation nudge, listing nudge.
- `ImportJob` status machine.
- Knowledge processing triggered from upload/import handlers (synchronous/async depends on route — typically `await processKnowledgeSource.execute`).

### D. Missing

- `graph_jobs` queue.
- Domain events: `KNOWLEDGE_UPLOADED`, `SKILL_ADDED`, etc.
- Event consumers for graph rebuild.

---

## 12. Database & Supabase

| Component | Finding |
|-----------|---------|
| PostgreSQL | Primary store via Prisma |
| Supabase | Auth; DB likely Supabase Postgres in prod |
| pgvector | Documented in blueprint; **not migrated** in repo |
| Graph tables | **None** |

**Models count:** ~25 application models (User, Profile, Knowledge*, Marketplace*, Org*, etc.) — see `prisma/schema.prisma`.

---

## 13. APIs inventory (graph-relevant)

| API | Graph relevance |
|-----|-----------------|
| `/api/v1/knowledge/*` | Sources — future evidence anchor |
| `/api/v1/profiles/me` | Skills — user-asserted facts |
| `/api/v1/search` | Replace/augment with graph search |
| `/api/v1/chat` | Twin — add graph context |
| `/api/v1/import-jobs` | Ingestion trigger |
| `/api/v1/discover` | Discovery — graph rank later |
| No `/api/v1/graph/*` | **Missing** |

---

## 14. Testing

### A. What exists

- Vitest: similarity, billing, profile value-objects, org slug, api keys — **7 test files**.
- No tests for knowledge pipeline, search, or graph (N/A).

### D. Missing

- Full graph test suite per spec (entity resolution, evidence, permissions, traversal).

---

## 15. Demo / mock data policy

- **Production:** Real user data only; empty states use **client-side DEMO_*** configs (not DB seed).
- **No Prisma seed script** in repo.
- **Requirement:** Future `prisma/seed-graph-dev.ts` — dev-only, never production.

---

## 16. Audit matrix (A–F summary)

| Capability | A Exists | B Partial | C Mock/UI | D Missing |
|------------|----------|-----------|-----------|-----------|
| Graph entities/edges | | | Landing copy | **All core graph** |
| Evidence/provenance | AuditLog ( coarse ) | | | **graph_evidence** |
| Entity extraction | | tags/topics | | **NER/RE pipeline** |
| Entity resolution | | Skill slug | | Aliases, merge |
| User graph UI | | | | Map, edit, approve |
| Graph search | | Keyword search | | Traversal + intent |
| Twin + graph | Twin + RAG | | | Structured retrieval |
| Intelligence Score | Points + reputation | | | Explainable graph score |
| Admin graph | | | | Explorer |
| pgvector SQL | | Float[] storage | | Index + query |

---

## 17. What to reuse (do not duplicate)

1. **`ProcessKnowledgeSource`** — add post-process graph job enqueue.
2. **`Skill` + `syncSkills`** — migrate into or link to `graph_entities` type `SKILL`.
3. **`KnowledgeSource` / chunks** — keep RAG; evidence points to source + chunk/page.
4. **`PrismaSearchRepository`** — extend, don’t rewrite; add graph branch.
5. **`AskTwin`** — inject graph context provider interface.
6. **`qualifiedPublicHubProfileWhere`** — reuse for public graph visibility.
7. **`AuditLog`** — graph mutation audit trail.
8. **`ImportJob` pipeline** — same ingestion front door.
9. **`computeReputationScore` / reviews / follows** — signals for future Intelligence Score components.

---

## 18. What must be redesigned

1. **Tags/topics as strings** → typed entities + `SOURCE_MENTIONS_TOPIC` edges with confidence.
2. **Skills without evidence** → `USER_HAS_SKILL` + evidence from profile edit vs extraction.
3. **Search over 1500 chunks in memory** → pgvector + graph-augmented ranking.
4. **Intelligence points** → separate **explainable Intelligence Score** derived from graph metrics (keep points for gamification if needed).
5. **Marketing “graph”** → real Intelligence Map backed by API or remove until ready.

---

## 19. Risks if we skip audit and code blindly

- Duplicating `Skill` and new `graph_entities` without migration plan.
- Breaking Twin RAG by replacing chunks with graph-only answers.
- Leaking private source text via public graph queries.
- Unbounded AI facts without evidence (trust/legal risk).
- Performance collapse loading full chunk corpus per search.

---

## 20. Recommended next step

Review **`SMITVI_HUMAN_INTELLIGENCE_GRAPH_ARCHITECTURE.md`** (companion doc). **No production code** until architecture approval.

---

## Definition of done (audit phase)

- [x] Repository inspected
- [x] Existing vs missing documented
- [x] Reuse vs redesign identified
- [ ] Architecture approved by product/engineering
- [ ] Phase 1 implementation started
