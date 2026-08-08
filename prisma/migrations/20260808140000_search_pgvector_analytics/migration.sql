-- Phase 2: pgvector semantic search + search analytics
-- Supabase: enable "vector" under Database → Extensions if deploy fails here.

CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE "knowledge_chunks"
  ADD COLUMN IF NOT EXISTS "embedding_vector" vector(1536);

UPDATE "knowledge_chunks"
SET "embedding_vector" = ('[' || array_to_string("embedding", ',') || ']')::vector
WHERE "embedding" IS NOT NULL
  AND array_length("embedding", 1) > 0
  AND "embedding_vector" IS NULL;

CREATE INDEX IF NOT EXISTS "knowledge_chunks_embedding_vector_idx"
  ON "knowledge_chunks"
  USING hnsw ("embedding_vector" vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

CREATE TABLE IF NOT EXISTS "search_events" (    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "query_normalized" VARCHAR(240) NOT NULL,
    "intent" VARCHAR(64) NOT NULL,
    "filters" JSONB NOT NULL DEFAULT '{}',
    "result_count" INTEGER NOT NULL DEFAULT 0,
    "top_username" VARCHAR(30),
    "clicked_username" VARCHAR(30),
    "success_type" VARCHAR(32),
    "session_hash" VARCHAR(64),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "search_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "search_events_intent_created_at_idx" ON "search_events"("intent", "created_at");
CREATE INDEX "search_events_created_at_idx" ON "search_events"("created_at");
CREATE INDEX "search_events_query_normalized_idx" ON "search_events"("query_normalized");
