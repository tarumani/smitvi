-- Human Intelligence Graph — Phase 1 foundation

-- CreateEnum
CREATE TYPE "GraphEntityType" AS ENUM ('PERSON', 'SKILL', 'TOPIC', 'TECHNOLOGY', 'TOOL', 'INDUSTRY', 'COMPANY', 'PROJECT', 'PROFESSION', 'EDUCATION', 'CERTIFICATION', 'ARTICLE', 'DOCUMENT', 'COURSE', 'QUESTION', 'ANSWER', 'SERVICE', 'PRODUCT', 'COMMUNITY', 'USER');
CREATE TYPE "GraphEntityStatus" AS ENUM ('ACTIVE', 'DEPRECATED', 'REMOVED');
CREATE TYPE "GraphVisibility" AS ENUM ('PUBLIC', 'FOLLOWERS', 'CONNECTIONS', 'PRIVATE');
CREATE TYPE "GraphVerificationStatus" AS ENUM ('PENDING', 'AI_DETECTED', 'USER_VERIFIED', 'USER_REJECTED', 'HIDDEN');
CREATE TYPE "GraphRelationshipSource" AS ENUM ('USER', 'AI', 'PROFILE', 'IMPORT', 'ADMIN');
CREATE TYPE "GraphEvidenceSourceType" AS ENUM ('KNOWLEDGE_SOURCE', 'KNOWLEDGE_CHUNK', 'PROFILE_FIELD', 'USER_ASSERTION', 'ADMIN');
CREATE TYPE "GraphAliasSource" AS ENUM ('USER', 'AI', 'IMPORT', 'ADMIN');
CREATE TYPE "GraphProcessingJobType" AS ENUM ('EXTRACT_FROM_KNOWLEDGE', 'SYNC_PROFILE', 'BACKFILL_USER');
CREATE TYPE "GraphProcessingJobStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

CREATE TABLE "graph_relationship_types" (
    "code" VARCHAR(64) NOT NULL,
    "label" VARCHAR(120) NOT NULL,
    "inverse_code" VARCHAR(64),
    "is_directed" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "graph_relationship_types_pkey" PRIMARY KEY ("code")
);

INSERT INTO "graph_relationship_types" ("code", "label", "is_directed") VALUES
  ('USER_HAS_SKILL', 'User has skill', true),
  ('USER_HAS_EXPERTISE', 'User has expertise', true),
  ('USER_INTERESTED_IN', 'User interested in', true),
  ('USER_WORKED_AT', 'User worked at', true),
  ('USER_CREATED_PROJECT', 'User created project', true),
  ('USER_USES_TECHNOLOGY', 'User uses technology', true),
  ('USER_USES_TOOL', 'User uses tool', true),
  ('USER_WORKS_IN_INDUSTRY', 'User works in industry', true),
  ('USER_TEACHES', 'User teaches', true),
  ('USER_MENTORS', 'User mentors', true),
  ('USER_ANSWERED', 'User answered', true),
  ('USER_PUBLISHED', 'User published', true),
  ('PROJECT_USES_TECHNOLOGY', 'Project uses technology', true),
  ('PROJECT_HAS_SKILL', 'Project has skill', true),
  ('PROJECT_BELONGS_TO_INDUSTRY', 'Project belongs to industry', true),
  ('ARTICLE_ABOUT_TOPIC', 'Article about topic', true),
  ('COURSE_TEACHES_SKILL', 'Course teaches skill', true),
  ('QUESTION_ABOUT_TOPIC', 'Question about topic', true),
  ('QUESTION_ANSWERED_BY', 'Question answered by', true),
  ('SKILL_RELATED_TO_SKILL', 'Skill related to skill', true),
  ('TOPIC_RELATED_TO_TOPIC', 'Topic related to topic', true),
  ('TECHNOLOGY_RELATED_TO_TECHNOLOGY', 'Technology related to technology', true);

CREATE TABLE "graph_entities" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "entity_type" "GraphEntityType" NOT NULL,
    "canonical_name" VARCHAR(240) NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "description" VARCHAR(2000),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "owner_user_id" UUID,
    "linked_user_id" UUID,
    "skill_id" UUID,
    "visibility" "GraphVisibility" NOT NULL DEFAULT 'PRIVATE',
    "status" "GraphEntityStatus" NOT NULL DEFAULT 'ACTIVE',
    "deleted_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "graph_entities_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "graph_entities_linked_user_id_key" ON "graph_entities"("linked_user_id");
CREATE UNIQUE INDEX "graph_entities_skill_id_key" ON "graph_entities"("skill_id");
CREATE UNIQUE INDEX "graph_entities_slug_scope" ON "graph_entities" (
  "entity_type",
  "slug",
  COALESCE("owner_user_id", '00000000-0000-0000-0000-000000000000'::uuid)
);
CREATE INDEX "graph_entities_entity_type_slug_idx" ON "graph_entities"("entity_type", "slug");
CREATE INDEX "graph_entities_owner_user_id_idx" ON "graph_entities"("owner_user_id");
CREATE INDEX "graph_entities_entity_type_status_idx" ON "graph_entities"("entity_type", "status");
CREATE INDEX "graph_entities_deleted_at_idx" ON "graph_entities"("deleted_at");

ALTER TABLE "graph_entities" ADD CONSTRAINT "graph_entities_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "graph_entities" ADD CONSTRAINT "graph_entities_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "graph_entity_aliases" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "entity_id" UUID NOT NULL,
    "alias" VARCHAR(240) NOT NULL,
    "normalized_alias" VARCHAR(240) NOT NULL,
    "source" "GraphAliasSource" NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "graph_entity_aliases_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "graph_entity_aliases_entity_id_normalized_alias_key" ON "graph_entity_aliases"("entity_id", "normalized_alias");
CREATE INDEX "graph_entity_aliases_normalized_alias_idx" ON "graph_entity_aliases"("normalized_alias");

ALTER TABLE "graph_entity_aliases" ADD CONSTRAINT "graph_entity_aliases_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "graph_entities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "graph_evidence" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "entity_id" UUID,
    "relationship_id" UUID,
    "source_type" "GraphEvidenceSourceType" NOT NULL,
    "source_id" VARCHAR(64) NOT NULL,
    "content_reference" VARCHAR(512),
    "content_excerpt" VARCHAR(2000),
    "page_number" INTEGER,
    "confidence" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "graph_evidence_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "graph_evidence_relationship_id_idx" ON "graph_evidence"("relationship_id");
CREATE INDEX "graph_evidence_entity_id_idx" ON "graph_evidence"("entity_id");
CREATE INDEX "graph_evidence_source_type_source_id_idx" ON "graph_evidence"("source_type", "source_id");

CREATE TABLE "graph_relationships" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "source_entity_id" UUID NOT NULL,
    "relationship_type" VARCHAR(64) NOT NULL,
    "target_entity_id" UUID NOT NULL,
    "confidence_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "weight" DOUBLE PRECISION,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verification_status" "GraphVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "verification_source" VARCHAR(64),
    "source" "GraphRelationshipSource" NOT NULL,
    "evidence_id" UUID,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "status" "GraphEntityStatus" NOT NULL DEFAULT 'ACTIVE',
    "deleted_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "graph_relationships_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "graph_relationships_evidence_id_key" ON "graph_relationships"("evidence_id");
CREATE INDEX "graph_relationships_source_entity_id_relationship_type_idx" ON "graph_relationships"("source_entity_id", "relationship_type");
CREATE INDEX "graph_relationships_target_entity_id_relationship_type_idx" ON "graph_relationships"("target_entity_id", "relationship_type");
CREATE INDEX "graph_relationships_verification_status_idx" ON "graph_relationships"("verification_status");
CREATE INDEX "graph_relationships_status_idx" ON "graph_relationships"("status");

CREATE UNIQUE INDEX "graph_relationships_active_unique" ON "graph_relationships" (
  "source_entity_id",
  "relationship_type",
  "target_entity_id"
) WHERE "status" = 'ACTIVE' AND "deleted_at" IS NULL;

ALTER TABLE "graph_relationships" ADD CONSTRAINT "graph_relationships_source_entity_id_fkey" FOREIGN KEY ("source_entity_id") REFERENCES "graph_entities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "graph_relationships" ADD CONSTRAINT "graph_relationships_target_entity_id_fkey" FOREIGN KEY ("target_entity_id") REFERENCES "graph_entities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "graph_relationships" ADD CONSTRAINT "graph_relationships_relationship_type_fkey" FOREIGN KEY ("relationship_type") REFERENCES "graph_relationship_types"("code") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "graph_relationships" ADD CONSTRAINT "graph_relationships_evidence_id_fkey" FOREIGN KEY ("evidence_id") REFERENCES "graph_evidence"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "graph_evidence" ADD CONSTRAINT "graph_evidence_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "graph_entities"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "graph_evidence" ADD CONSTRAINT "graph_evidence_relationship_id_fkey" FOREIGN KEY ("relationship_id") REFERENCES "graph_relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "graph_entity_sources" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "entity_id" UUID NOT NULL,
    "knowledge_source_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "graph_entity_sources_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "graph_entity_sources_entity_id_knowledge_source_id_key" ON "graph_entity_sources"("entity_id", "knowledge_source_id");
CREATE INDEX "graph_entity_sources_knowledge_source_id_idx" ON "graph_entity_sources"("knowledge_source_id");

ALTER TABLE "graph_entity_sources" ADD CONSTRAINT "graph_entity_sources_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "graph_entities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "graph_entity_sources" ADD CONSTRAINT "graph_entity_sources_knowledge_source_id_fkey" FOREIGN KEY ("knowledge_source_id") REFERENCES "knowledge_sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "graph_entity_versions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "entity_id" UUID NOT NULL,
    "snapshot" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "graph_entity_versions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "graph_entity_versions_entity_id_created_at_idx" ON "graph_entity_versions"("entity_id", "created_at");

ALTER TABLE "graph_entity_versions" ADD CONSTRAINT "graph_entity_versions_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "graph_entities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "graph_processing_jobs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "job_type" "GraphProcessingJobType" NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "status" "GraphProcessingJobStatus" NOT NULL DEFAULT 'PENDING',
    "error_message" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "started_at" TIMESTAMPTZ,
    "completed_at" TIMESTAMPTZ,
    CONSTRAINT "graph_processing_jobs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "graph_processing_jobs_user_id_created_at_idx" ON "graph_processing_jobs"("user_id", "created_at");
CREATE INDEX "graph_processing_jobs_status_created_at_idx" ON "graph_processing_jobs"("status", "created_at");

ALTER TABLE "graph_processing_jobs" ADD CONSTRAINT "graph_processing_jobs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
