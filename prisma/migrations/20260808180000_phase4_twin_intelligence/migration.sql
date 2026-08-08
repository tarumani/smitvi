-- Phase 4: AI Twin query analytics and feedback

CREATE TYPE "TwinConfidenceLevel" AS ENUM ('HIGH', 'MEDIUM', 'LOW', 'UNKNOWN');
CREATE TYPE "TwinFeedbackType" AS ENUM ('HELPFUL', 'NOT_HELPFUL', 'CORRECT', 'INCORRECT', 'MISSING', 'HALLUCINATION');

CREATE TABLE "twin_query_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "owner_user_id" UUID NOT NULL,
    "question" TEXT NOT NULL,
    "intent" VARCHAR(64) NOT NULL,
    "sources" JSONB NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "confidence_level" "TwinConfidenceLevel" NOT NULL,
    "latency_ms" INTEGER NOT NULL,
    "graph_used" BOOLEAN NOT NULL DEFAULT false,
    "rag_used" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "twin_query_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "twin_query_events_user_id_created_at_idx" ON "twin_query_events"("user_id", "created_at");
CREATE INDEX "twin_query_events_owner_user_id_created_at_idx" ON "twin_query_events"("owner_user_id", "created_at");
CREATE INDEX "twin_query_events_intent_created_at_idx" ON "twin_query_events"("intent", "created_at");

ALTER TABLE "twin_query_events" ADD CONSTRAINT "twin_query_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "twin_feedback" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "conversation_id" UUID,
    "message_id" UUID,
    "feedback" "TwinFeedbackType" NOT NULL,
    "note" VARCHAR(500),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "twin_feedback_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "twin_feedback_feedback_created_at_idx" ON "twin_feedback"("feedback", "created_at");
CREATE INDEX "twin_feedback_user_id_created_at_idx" ON "twin_feedback"("user_id", "created_at");

ALTER TABLE "twin_feedback" ADD CONSTRAINT "twin_feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
