-- Phase 3: recommendation events and feedback

CREATE TYPE "RecommendationFeedbackType" AS ENUM ('USEFUL', 'NOT_USEFUL', 'NOT_INTERESTED', 'ALREADY_KNOW', 'DISMISS');
CREATE TYPE "RecommendationActionType" AS ENUM ('SHOWN', 'CLICK', 'PROFILE_OPEN', 'FOLLOW', 'CONNECT', 'MESSAGE', 'SAVE', 'DISMISS', 'HIRE', 'KNOWLEDGE_OPEN', 'OPPORTUNITY_OPEN', 'CONVERTED');

CREATE TABLE "recommendation_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "recommendation_type" VARCHAR(64) NOT NULL,
    "target_type" VARCHAR(32) NOT NULL,
    "target_id" VARCHAR(64) NOT NULL,
    "action" "RecommendationActionType" NOT NULL,
    "score" DOUBLE PRECISION,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "recommendation_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "recommendation_events_user_id_created_at_idx" ON "recommendation_events"("user_id", "created_at");
CREATE INDEX "recommendation_events_recommendation_type_created_at_idx" ON "recommendation_events"("recommendation_type", "created_at");
CREATE INDEX "recommendation_events_action_created_at_idx" ON "recommendation_events"("action", "created_at");

ALTER TABLE "recommendation_events" ADD CONSTRAINT "recommendation_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "recommendation_feedback" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "recommendation_key" VARCHAR(128) NOT NULL,
    "feedback" "RecommendationFeedbackType" NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "recommendation_feedback_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "recommendation_feedback_user_id_recommendation_key_key" ON "recommendation_feedback"("user_id", "recommendation_key");
CREATE INDEX "recommendation_feedback_feedback_created_at_idx" ON "recommendation_feedback"("feedback", "created_at");

ALTER TABLE "recommendation_feedback" ADD CONSTRAINT "recommendation_feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
