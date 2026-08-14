CREATE TYPE "IntelligenceActionType" AS ENUM (
  'COMPLETE_PROFILE',
  'ADD_SKILL',
  'CONFIRM_SKILL',
  'ADD_EXPERIENCE',
  'ADD_PROJECT',
  'ADD_KNOWLEDGE',
  'UPDATE_INTELLIGENCE',
  'IMPROVE_TWIN',
  'CONNECT_EXPERT',
  'REVIEW_RECOMMENDATION',
  'EXPLORE_TOPIC',
  'RESPOND_TO_OPPORTUNITY',
  'CREATE_GUIDE',
  'CREATE_PRODUCT',
  'CREATE_CONSULTATION',
  'ACTIVATE_DISCOVERY',
  'REVIEW_WEEKLY_REPORT'
);

CREATE TYPE "IntelligenceActionStatus" AS ENUM (
  'PENDING',
  'COMPLETED',
  'DISMISSED',
  'EXPIRED'
);

CREATE TYPE "MeaningfulActivityType" AS ENUM (
  'PROFILE_UPDATED',
  'SKILL_CONFIRMED',
  'PROJECT_ADDED',
  'EXPERIENCE_ADDED',
  'KNOWLEDGE_ADDED',
  'GRAPH_UPDATED',
  'TWIN_USED',
  'TWIN_TAUGHT',
  'CONNECTION_MADE',
  'RECOMMENDATION_REVIEWED',
  'ACTION_COMPLETED',
  'MARKETPLACE_ACTIVITY',
  'INTELLIGENCE_UPDATE',
  'DISCOVERY_ENABLED'
);

CREATE TYPE "IntelligenceUpdateVisibility" AS ENUM (
  'PRIVATE',
  'PROFILE',
  'PUBLIC'
);

ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'INTELLIGENCE_UPDATE_CONFIRMED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'INTELLIGENCE_ACTION_COMPLETED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'INTELLIGENCE_WEEKLY_REPORT';

ALTER TABLE "profiles"
  ADD COLUMN IF NOT EXISTS "last_meaningful_activity_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "last_reengagement_notified_at" TIMESTAMP(3);

CREATE TABLE "daily_intelligence_snapshots" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "date" DATE NOT NULL,
  "readiness_score" INTEGER NOT NULL,
  "readiness_delta" INTEGER NOT NULL DEFAULT 0,
  "primary_action_id" UUID,
  "recommendation_summary" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "daily_intelligence_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "daily_intelligence_snapshots_user_id_date_key"
  ON "daily_intelligence_snapshots"("user_id", "date");
CREATE INDEX "daily_intelligence_snapshots_date_idx"
  ON "daily_intelligence_snapshots"("date");

ALTER TABLE "daily_intelligence_snapshots"
  ADD CONSTRAINT "daily_intelligence_snapshots_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "next_best_actions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "type" "IntelligenceActionType" NOT NULL,
  "title" VARCHAR(200) NOT NULL,
  "description" VARCHAR(600) NOT NULL,
  "priority" INTEGER NOT NULL,
  "status" "IntelligenceActionStatus" NOT NULL DEFAULT 'PENDING',
  "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completed_at" TIMESTAMP(3),
  "dismissed_at" TIMESTAMP(3),
  "expires_at" TIMESTAMP(3),
  "metadata" JSONB NOT NULL DEFAULT '{}',
  CONSTRAINT "next_best_actions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "next_best_actions_user_id_status_generated_at_idx"
  ON "next_best_actions"("user_id", "status", "generated_at");
CREATE INDEX "next_best_actions_user_id_type_generated_at_idx"
  ON "next_best_actions"("user_id", "type", "generated_at");

ALTER TABLE "next_best_actions"
  ADD CONSTRAINT "next_best_actions_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "user_action_completions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "action_type" "IntelligenceActionType" NOT NULL,
  "source" VARCHAR(64) NOT NULL,
  "impact" JSONB NOT NULL DEFAULT '{}',
  "completed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "user_action_completions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "user_action_completions_user_id_completed_at_idx"
  ON "user_action_completions"("user_id", "completed_at");
CREATE INDEX "user_action_completions_action_type_completed_at_idx"
  ON "user_action_completions"("action_type", "completed_at");

ALTER TABLE "user_action_completions"
  ADD CONSTRAINT "user_action_completions_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "weekly_intelligence_reports" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "week_start" DATE NOT NULL,
  "week_end" DATE NOT NULL,
  "metrics_snapshot" JSONB NOT NULL,
  "summary" VARCHAR(800) NOT NULL,
  "recommendations" JSONB NOT NULL DEFAULT '[]',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "weekly_intelligence_reports_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "weekly_intelligence_reports_user_id_week_start_key"
  ON "weekly_intelligence_reports"("user_id", "week_start");
CREATE INDEX "weekly_intelligence_reports_week_start_idx"
  ON "weekly_intelligence_reports"("week_start");

ALTER TABLE "weekly_intelligence_reports"
  ADD CONSTRAINT "weekly_intelligence_reports_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "meaningful_activities" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "type" "MeaningfulActivityType" NOT NULL,
  "title" VARCHAR(240) NOT NULL,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "meaningful_activities_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "meaningful_activities_user_id_created_at_idx"
  ON "meaningful_activities"("user_id", "created_at");
CREATE INDEX "meaningful_activities_type_created_at_idx"
  ON "meaningful_activities"("type", "created_at");

ALTER TABLE "meaningful_activities"
  ADD CONSTRAINT "meaningful_activities_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
