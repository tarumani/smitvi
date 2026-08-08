# SMITVI Human Intelligence Graph — Architecture

**Status:** Proposed — **awaiting approval before implementation**  
**Companion:** [SMITVI_HUMAN_INTELLIGENCE_GRAPH_AUDIT.md](./SMITVI_HUMAN_INTELLIGENCE_GRAPH_AUDIT.md)  
**Product:** Smitvi — Human Intelligence Operating System  

---

## 1. Vision alignment

The Human Intelligence Graph (HIG) is the **structured intelligence layer** beneath:

- AI Twin (RAG + structured facts)
- Intelligence Hub (public Intelligence Map)
- Expert discovery & semantic search
- Recommendations & future Growth Agent APIs
- Marketplace / hiring / mentoring (ranking signals)

**Principle:** Visualization is interface only. The product is **entities + relationships + evidence + confidence + search + reasoning**.

---

## 2. Current architecture (as-is)

```
┌─────────────────────────────────────────────────────────────┐
│ Next.js App Router + API routes (/api/v1/*)                 │
├─────────────────────────────────────────────────────────────┤
│ Application layer (container.ts use cases)                  │
├─────────────────────────────────────────────────────────────┤
│ Prisma repositories → PostgreSQL                            │
├─────────────────────────────────────────────────────────────┤
│ OpenAI: embeddings, chat, metadata JSON (tags/topics)       │
├─────────────────────────────────────────────────────────────┤
│ Supabase Auth │ Object storage (uploads) │ Email │ Billing  │
└─────────────────────────────────────────────────────────────┘

Knowledge path today:
  Upload/Import → Extract text → Chunk → Embed → Metadata (tags/topics)
                → KnowledgeChunk[]  →  AskTwin (cosine retrieve)
                                    →  Search (keyword + chunk cosine)
```

**Not present:** entity table, relationship table, evidence table, graph jobs, graph APIs.

---

## 3. Target architecture (to-be)

```
                    ┌──────────────────┐
                    │  Graph Events    │
                    │  (domain bus)    │
                    └────────┬─────────┘
                             │
Ingestion ───────────────────┼──────────────────────────► Graph Update Engine
  Upload/Import/Profile      │                              │
       │                     ▼                              ▼
       ▼              ┌─────────────┐              ┌─────────────────┐
  Extract/Chunk       │ graph_jobs  │              │ graph_entities  │
       │              │  (async)    │              │ graph_relations │
       ▼              └─────────────┘              │ graph_evidence  │
  AI Extract ─────────────────────────────────────►│ graph_aliases   │
  (entities/RE)                                    └────────┬────────┘
       │                                                     │
       ├──────────────────────────────► Embeddings (chunk + optional entity)
       │
       ▼
  AskTwin ◄── GraphContextProvider + ChunkRetriever
  Search  ◄── GraphQueryService + VectorSearch + Keyword
  Hub UI  ◄── GET /api/v1/graph/me (public subset)
  Admin   ◄── /admin/intelligence-graph
```

**Dual layer:**

| Layer | Role |
|-------|------|
| **Semantic (existing)** | Chunks + embeddings for nuance and quotes |
| **Structured (new)** | Entities, typed edges, evidence, confidence |

Twin answers combine both; **never** state unsupported relationships as facts.

---

## 4. Entity model

### 4.1 Entity types (extensible enum)

Phase 1 core subset:

`USER`, `PERSON`, `SKILL`, `TOPIC`, `INDUSTRY`, `TECHNOLOGY`, `TOOL`, `COMPANY`, `ORGANIZATION`, `PROJECT`, `DOCUMENT` (links to `KnowledgeSource`)

Phase 2+:

`PROFESSION`, `EXPERTISE`, `EXPERIENCE`, `EDUCATION`, `CERTIFICATION`, `ARTICLE`, `COURSE`, `PRODUCT`, `SERVICE`, `COMMUNITY`, `QUESTION`, `ANSWER`, `EVENT`, `JOB`, `GOAL`, `INTEREST`, `LANGUAGE`, `LOCATION`

Stored in `graph_entity_type` lookup table (not hard-coded only in app) for forward compatibility.

### 4.2 Canonical entity

Each real-world concept maps to one `graph_entities` row per scope:

- **Global canonical:** e.g. Skill “Figma”, Company “Acme Corp” (shared).
- **User-scoped:** e.g. Project “Healthcare mobile app” owned by user (visibility on entity).

Fields:

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| entity_type | enum/FK | |
| canonical_name | text | Display |
| slug | text | Unique per (type, scope) |
| description | text | Optional |
| metadata | jsonb | Flexible attrs |
| owner_user_id | UUID nullable | NULL = global canonical |
| visibility | enum | PUBLIC, FOLLOWERS, CONNECTIONS, PRIVATE |
| status | enum | ACTIVE, DEPRECATED, REMOVED |
| embedding | vector(1536) nullable | Optional entity vector |
| created_at, updated_at | timestamptz | |

### 4.3 Aliases (`graph_entity_aliases`)

| Column | Notes |
|--------|-------|
| entity_id | FK |
| alias | text |
| normalized_alias | text (indexed) |
| source | USER \| AI \| IMPORT \| ADMIN |

Resolution pipeline: normalize string → match alias → match slug → create candidate entity (low confidence) or link.

**Migration from `Skill`:** Option A — `graph_entities.type=SKILL` becomes source of truth; `skills` table becomes view/sync. Option B — dual-write during transition. **Recommend Option A with backfill migration.**

### 4.4 User anchor

Every Smitvi user has:

- `graph_entities` row `entity_type=USER` linked to `users.id` (or use `Profile` as projection).
- All `USER_*` edges originate from this node.

---

## 5. Relationship model

### 5.1 Relationship types

Lookup table `graph_relationship_types` with code e.g. `USER_HAS_SKILL`, `USER_USES`, `USER_WORKS_IN_INDUSTRY`, `USER_CREATED`, `PROJECT_USES_TECHNOLOGY`, `SKILL_RELATED_TO_SKILL`, etc.

### 5.2 `graph_relationships`

| Column | Type |
|--------|------|
| id | UUID |
| source_entity_id | UUID FK |
| relationship_type | FK/code |
| target_entity_id | UUID FK |
| confidence_score | float 0–1 |
| weight | float optional |
| verified | boolean |
| verification_source | enum nullable |
| source | USER \| AI \| PROFILE \| IMPORT \| ADMIN |
| evidence_id | UUID nullable FK |
| metadata | jsonb |
| status | ACTIVE \| DEPRECATED \| REMOVED |
| created_at, updated_at | |

**Uniqueness:** `(source_entity_id, relationship_type, target_entity_id, status=ACTIVE)` with soft-delete via status.

### 5.3 Relationship metadata (JSON examples)

```json
{
  "confidence": 0.94,
  "source": "portfolio.pdf",
  "verified": true,
  "verificationSource": "USER_APPROVED"
}
```

---

## 6. Evidence model

### 6.1 `graph_evidence`

| Column | Notes |
|--------|-------|
| id | UUID |
| entity_id | nullable |
| relationship_id | nullable |
| source_type | KNOWLEDGE_SOURCE \| PROFILE_FIELD \| USER_ASSERTION \| MARKETPLACE \| ADMIN |
| source_id | UUID/string |
| content_reference | e.g. chunk id, field name |
| content_excerpt | text (max length cap) |
| page_number | int nullable |
| confidence | float |
| created_at | |

**Rule:** AI-created relationships with `confidence < τ` (e.g. 0.65) are **candidate** only — not public, not used in Twin as “known” until user approves or second source corroborates.

### 6.2 Provenance chain

```
Fact (edge) → evidence row → KnowledgeSource + chunk index/page
```

Never store full private PDF in evidence excerpt — truncate + reference.

---

## 7. Versioning & lifecycle

### 7.1 `graph_entity_versions` (optional Phase 4)

Snapshot on material change: previous canonical_name, metadata, status.

### 7.2 Relationship lifecycle

States: `ACTIVE`, `DEPRECATED`, `REMOVED`. Updates create audit entry; deprecate old edge when user changes job/skills.

### 7.3 User control

States per candidate fact: `PENDING`, `APPROVED`, `REJECTED`, `HIDDEN`.

APIs:

- List pending AI suggestions
- Approve / reject / edit / delete
- “Mark incorrect” feeds moderation + model feedback loop (later)

---

## 8. Visibility & security

### 8.1 Visibility levels

Align with product spec:

| Level | Rule |
|-------|------|
| PUBLIC | Eligible for public hub map & SEO pages |
| FOLLOWERS | Follow graph check |
| CONNECTIONS | Reserved (mutual follow or future) |
| PRIVATE | Owner + Twin private chat only |

**Implementation:** Filter every graph read by:

1. `owner_user_id = session.userId` OR
2. `visibility = PUBLIC` AND entity/edge marked `verified` or `confidence >= public_threshold` AND no PRIVATE source leakage

### 8.2 Authorization

Mirror existing patterns:

- `requireSession()` on all `/api/v1/graph/*` mutations.
- Repository methods: `assertEntityOwnedByUser(entityId, userId)`.
- Public routes: only `visibility=PUBLIC` + qualified hub rules (`qualifiedPublicHubProfileWhere`).

**Do not** expose `extractedText` via graph API — only excerpts + source titles.

### 8.3 Supabase RLS

Today: app-enforced. **Phase 1:** continue app layer. **Phase 2 optional:** RLS policies on graph tables keyed by `owner_user_id` if using Supabase client directly.

---

## 9. Knowledge ingestion pipeline (extended)

```
Upload / Import / Profile save
        │
        ▼
┌───────────────────┐
│ Existing pipeline │  extract → chunk → embed → metadata
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ graph_jobs        │  type: EXTRACT_GRAPH
│ status: PENDING   │
└─────────┬─────────┘
          │ worker
          ▼
┌───────────────────┐
│ GraphExtractor    │  LLM structured output (JSON schema)
│ - entities        │
│ - relationships   │
│ - confidence      │
└─────────┬─────────┘
          ▼
┌───────────────────┐
│ EntityResolver    │  aliases + merge
└─────────┬─────────┘
          ▼
┌───────────────────┐
│ GraphWriter       │  upsert entities/edges + evidence
└─────────┬─────────┘
          ▼
┌───────────────────┐
│ Indexer           │  optional entity embeddings
└───────────────────┘
```

**Sync vs async:** Enqueue `graph_jobs` after `saveProcessed`; worker runs in API route background (Next.js) initially, then Fly machine / cron poller at scale.

### 9.1 Extraction schema (LLM)

Strict JSON schema:

- `entities: [{ type, name, confidence }]`
- `relationships: [{ type, sourceName, targetName, confidence }]`
- `evidence: [{ relationshipIndex, excerpt, page? }]`

Post-validate against allowed types; reject hallucinated types.

### 9.2 Profile hooks

On `PROFILE_UPDATED` with skills/experience/portfolio:

- Emit `SKILL_ADDED`, `EXPERIENCE_ADDED` events
- Create **USER-asserted** edges with `verified=true`, `source=USER`

---

## 10. Entity resolution

1. Normalize: lowercase, trim, slugify (`slugifySkill` pattern generalized).
2. Query `graph_entity_aliases` + slug match on global entities.
3. If match score > threshold → link.
4. Else create new entity (AI) as `PENDING` or global candidate for admin merge.

**SKILL_RELATED_TO_SKILL / TOPIC_RELATED_TO_TOPIC:** Curated seed + optional AI suggestions (admin approved).

---

## 11. Database schema (PostgreSQL)

New tables (names as specified):

```sql
-- Simplified; full migration in Phase 1 PR

CREATE TABLE graph_relationship_types (
  code TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  inverse_code TEXT,
  is_directed BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE graph_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  canonical_name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  owner_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  visibility TEXT NOT NULL DEFAULT 'PRIVATE',
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  embedding vector(1536),  -- requires pgvector extension
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX graph_entities_slug_scope
  ON graph_entities (entity_type, slug, COALESCE(owner_user_id, '00000000-0000-0000-0000-000000000000'));

CREATE TABLE graph_entity_aliases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES graph_entities(id) ON DELETE CASCADE,
  alias TEXT NOT NULL,
  normalized_alias TEXT NOT NULL,
  source TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX graph_entity_aliases_norm ON graph_entity_aliases (normalized_alias);

CREATE TABLE graph_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_entity_id UUID NOT NULL REFERENCES graph_entities(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL REFERENCES graph_relationship_types(code),
  target_entity_id UUID NOT NULL REFERENCES graph_entities(id) ON DELETE CASCADE,
  confidence_score DOUBLE PRECISION NOT NULL DEFAULT 0,
  weight DOUBLE PRECISION,
  verified BOOLEAN NOT NULL DEFAULT false,
  verification_source TEXT,
  source TEXT NOT NULL,
  evidence_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX graph_relationships_source ON graph_relationships (source_entity_id, relationship_type);
CREATE INDEX graph_relationships_target ON graph_relationships (target_entity_id, relationship_type);

CREATE TABLE graph_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID REFERENCES graph_entities(id) ON DELETE SET NULL,
  relationship_id UUID REFERENCES graph_relationships(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL,
  source_id TEXT NOT NULL,
  content_reference TEXT,
  content_excerpt TEXT,
  page_number INT,
  confidence DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE graph_entity_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES graph_entities(id) ON DELETE CASCADE,
  knowledge_source_id UUID REFERENCES knowledge_sources(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE graph_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'PENDING',
  error_message TEXT,
  attempts INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE INDEX graph_jobs_pending ON graph_jobs (status, created_at) WHERE status = 'PENDING';
```

**Prisma:** Add models in Phase 1; use `Unsupported("vector")` or raw SQL for embedding columns if needed.

**Link existing:**

- `knowledge_sources.id` → evidence + `graph_entity_sources`
- `profiles.user_id` → USER entity bootstrap on profile create

---

## 12. Search architecture

### 12.1 Query planner

```
User query → Intent classifier (LLM or rules)
          → Graph pattern (skills, industries, roles)
          → SQL traversal (bounded depth 2–3)
          → Vector search (chunks + entity embeddings)
          → Keyword fallback (existing search)
          → Merge ranker (evidence, reputation, recency)
```

Example intent “UX designer healthcare”:

```sql
-- Conceptual
SELECT u.username, ...
FROM graph_entities user_e
JOIN graph_relationships r1 ON r1.source_entity_id = user_e.id
JOIN graph_entities skill ON skill.id = r1.target_entity_id
JOIN graph_relationships r2 ON r2.source_entity_id = user_e.id
JOIN graph_entities industry ON industry.id = r2.target_entity_id
WHERE user_e.entity_type = 'USER'
  AND r1.relationship_type = 'USER_HAS_SKILL'
  AND skill.slug IN ('ux-design', 'ui-design')
  AND r2.relationship_type = 'USER_WORKS_IN_INDUSTRY'
  AND industry.slug = 'healthcare'
  AND r1.status = 'ACTIVE' AND r1.confidence_score >= 0.7
  AND user visibility = PUBLIC ...
```

### 12.2 pgvector

Phase 6 migration:

- Enable `vector` extension on Supabase.
- Backfill `knowledge_chunks.embedding` to `vector(1536)`.
- Replace in-memory 1500-chunk scan with indexed ANN query.

---

## 13. API design (future `/api/v1/graph`)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/graph/me` | Owner graph summary + quality metrics |
| GET | `/graph/me/entities` | Paginated nodes |
| GET | `/graph/me/relationships` | Paginated edges |
| GET | `/graph/me/pending` | AI candidates awaiting approval |
| POST | `/graph/me/relationships/:id/approve` | |
| POST | `/graph/me/relationships/:id/reject` | |
| PATCH | `/graph/entities/:id` | Edit/hide (owner) |
| GET | `/graph/public/:username` | Public Intelligence Map subset |
| GET | `/graph/search` | Graph-powered expert search |
| GET | `/graph/similar/:username` | Similar experts |
| GET | `/graph/admin/stats` | Admin only |

**Growth Agent (future):** read-only aggregates on `/graph/admin/*` and `/graph/analytics/*` — not implemented now.

---

## 14. Background jobs

### 14.1 `graph_jobs.job_type`

- `EXTRACT_FROM_SOURCE` — after knowledge processed
- `SYNC_PROFILE` — profile skills/experience
- `REEMBED_ENTITY`
- `MERGE_DUPLICATES` (admin)
- `RECOMPUTE_SCORES`

### 14.2 Worker

Phase 1: poll `graph_jobs` from cron every minute (GitHub Action or Fly cron).  
Phase 2: dedicated worker process.

---

## 15. Event system

In-process event bus initially (`GraphEventPublisher`):

| Event | Triggers |
|-------|----------|
| KNOWLEDGE_PROCESSED | Graph extract job |
| PROFILE_UPDATED | Profile sync job |
| PROJECT_CREATED | (when Project model exists) |
| VERIFICATION_COMPLETED | Bump verified flags |

Persist events to `audit_logs` for traceability.

---

## 16. AI Twin integration

### 16.1 `GraphContextProvider`

```typescript
interface GraphContextProvider {
  getContextForQuestion(input: {
    ownerUserId: string;
    question: string;
    publicOnly: boolean;
  }): Promise<{
    knownFacts: StructuredFact[];
    likelyFacts: StructuredFact[];
    chunkIds: string[];
  }>;
}
```

### 16.2 Answer policy

- **Known:** verified OR confidence ≥ 0.85 with evidence
- **Likely:** 0.65–0.85 — phrase as “based on your uploaded material…”
- **Unknown:** no edge/chunk — exact low-confidence reply

Combine graph facts + chunk excerpts in prompt (graph first for structure, chunks for quotes).

---

## 17. Intelligence Score (explainable)

Replace/overlap with `intelligencePoints` for **product score**:

| Component | Source |
|-----------|--------|
| Knowledge Depth | count + avg confidence of USER→SKILL/ TOPIC |
| Knowledge Breadth | distinct entity types linked |
| Verified Experience | verified EXPERIENCE/PROJECT edges |
| Contribution | public sources, marketplace, reviews |
| Community | followers, engagement (existing) |
| Freshness | weighted recency of edges/sources |
| Evidence coverage | % edges with evidence rows |

Store breakdown JSON on `Profile` or `graph_user_metrics` table. UI shows sub-scores — **not** a black box.

---

## 18. Graph quality metrics

Per user and global:

- Completeness (% expected facets filled)
- Confidence (mean edge confidence)
- Freshness (last update)
- Evidence coverage
- Relationship density
- Verification rate

Surface on `/graph/me` and admin dashboard.

---

## 19. Graph visualization (Phase 9)

- Client: force-directed or layered tree (Me → Skills → Tools → Projects → Industries)
- **Do not load full graph** — fetch ego-network depth 2 with pagination
- Click node → evidence drawer
- Public hub: optional `#hub-tab-map` in `IntelligenceHubTabs`

Tech: `@xyflow/react` or D3 — decision in Phase 9.

---

## 20. Admin Graph Explorer (Phase 11)

Route: `/admin/intelligence-graph`

- KPI cards: entities, relationships, jobs failed
- Top skills/topics/industries (aggregates)
- Low-confidence queue
- Orphan entity report
- Duplicate alias suggestions

---

## 21. SEO (Phase 12+)

Public pages only when **≥ N verified experts** linked:

- `/experts/[skill-slug]`
- `/topics/[topic-slug]`

SSR from graph aggregates; **no thin AI pages**.

---

## 22. Testing strategy

| Layer | Tests |
|-------|-------|
| Domain | Entity normalization, confidence gates, visibility rules |
| Integration | GraphWriter + evidence + dedup |
| API | Authz: user A cannot read B private edges |
| E2E | Upload PDF → pending edges → approve → public map |
| Search | Graph query fixtures |
| Regression | Twin still answers from chunks when graph empty |

Vitest + test DB (Docker Postgres) for repositories.

---

## 23. Migration strategy

### Phase 0 (now)

- Audit + architecture docs ✅

### Phase 1 — Schema

- Migrations for graph tables + relationship type seed
- Bootstrap USER entity on profile create (backfill script)
- Migrate `Skill` → `graph_entities` (SKILL) + `USER_HAS_SKILL` from `profile_skills`

### Phase 2 — APIs

- Read APIs for owner graph
- Approve/reject pending

### Phase 3–5 — Extraction & evidence

- Graph jobs + extractor + resolver + writer

### Phase 6 — Search

- Graph traversal in search + pgvector

### Rollback

- Feature flag `GRAPH_ENABLED=false` — Twin/search use legacy paths only
- Graph tables remain but unused
- No destructive drop of `skills` until dual-write stable

---

## 24. Implementation phases (post-approval)

| Phase | Deliverable |
|-------|-------------|
| 1 | Graph DB schema + USER bootstrap + skill backfill |
| 2 | Entity/relationship CRUD APIs + user pending queue |
| 3 | LLM extraction from knowledge text |
| 4 | Evidence + confidence + approval workflow |
| 5 | Event-driven graph updates (profile + knowledge) |
| 6 | Graph-powered search + pgvector |
| 7 | Expert discovery ranker |
| 8 | Recommendations v1 |
| 9 | User Intelligence Map UI |
| 10 | AI Twin graph context |
| 11 | Admin Graph Explorer |
| 12 | Analytics + SEO pages |

**STOP:** No Phase 1 code until explicit approval.

---

## 25. Risks

| Risk | Mitigation |
|------|------------|
| AI hallucinated facts | Evidence required; pending state; user approval |
| Private data leak | Visibility on every query; no raw doc in API |
| Duplicate entities | Aliases + merge tooling + admin review |
| Performance | Jobs async; indexed traversals; pagination |
| Scope creep | Phased delivery; feature flags |
| Breaking Twin | Dual-layer retrieval; graph optional at first |
| Skill table migration | Backfill + dual-read period |

---

## 26. Estimated complexity

| Phase | Effort (eng-weeks) | Notes |
|-------|-------------------|-------|
| 1 Schema + backfill | 1–2 | Prisma + migration + scripts |
| 2 APIs + auth | 1–2 | |
| 3–5 Extraction pipeline | 3–5 | Highest AI/quality risk |
| 6 Search + pgvector | 2–3 | Infra coordination on Supabase |
| 7–8 Discovery + recs | 2–4 | |
| 9–10 UI + Twin | 2–3 | |
| 11–12 Admin + SEO | 2–3 | |
| Testing & hardening | 2–3 ongoing | |
| **Total to MVP graph** | **~12–18 eng-weeks** | Phases 1–7 + 10 partial |

---

## 27. Definition of done (full HIG)

See audit doc checklist — graph incomplete until all items satisfied, including:

- Real entities/relationships/evidence
- Automatic updates from ingestion
- User inspect/correct
- Graph search & discovery
- Twin structured context
- Admin health
- Tests + safe production migration
- **No mock production graph data**

---

## 28. Approval gate

**Required sign-off:** Product + Engineering + Security (visibility model).

After approval, begin **Phase 1 only** (schema + bootstrap + skill backfill) in a dedicated branch.

---

*Document version: 1.0 — architecture proposal only, no implementation in this change set.*
