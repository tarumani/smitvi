-- AI onboarding + profile activation (non-destructive)

CREATE TYPE "ProfileType" AS ENUM (
  'PROFESSIONAL',
  'CREATOR',
  'FREELANCER',
  'EDUCATOR',
  'FOUNDER',
  'STUDENT'
);

CREATE TYPE "ProfileActivationStatus" AS ENUM (
  'REGISTERED',
  'ONBOARDING_STARTED',
  'PROFILE_DRAFTED',
  'PROFILE_REVIEWED',
  'PROFILE_ACTIVATED',
  'INTELLIGENCE_READY',
  'DISCOVERABLE',
  'MONETIZABLE'
);

CREATE TYPE "IntelligenceReadinessLevel" AS ENUM (
  'STARTING',
  'BUILDING',
  'GROWING',
  'INTELLIGENT',
  'INTELLIGENCE_READY'
);

ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'PROFILE_ONBOARDING_STARTED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'PROFILE_TYPE_SELECTED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'PROFILE_AI_ANALYSIS_REQUESTED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'PROFILE_AI_ANALYSIS_COMPLETED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'PROFILE_AI_SUGGESTION_ACCEPTED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'PROFILE_AI_SUGGESTION_REJECTED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'PROFILE_PROJECT_GENERATED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'PROFILE_ACTIVATED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'PROFILE_INTELLIGENCE_READY';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'PROFILE_DISCOVERABILITY_ENABLED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'PROFILE_IMPROVE_WITH_AI_STARTED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'PROFILE_IMPROVE_WITH_AI_COMPLETED';

ALTER TABLE "profiles"
  ADD COLUMN IF NOT EXISTS "profile_type" "ProfileType",
  ADD COLUMN IF NOT EXISTS "activation_status" "ProfileActivationStatus" NOT NULL DEFAULT 'REGISTERED',
  ADD COLUMN IF NOT EXISTS "intelligence_readiness_score" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "intelligence_readiness_level" "IntelligenceReadinessLevel" NOT NULL DEFAULT 'STARTING',
  ADD COLUMN IF NOT EXISTS "onboarding_completed_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "profile_activated_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "intelligence_ready_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "discoverable_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "monetizable_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "profile_ai_analysis_version" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "onboarding_draft" JSONB,
  ADD COLUMN IF NOT EXISTS "expertise_areas" JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS "industries" JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS "appear_in_expert_discovery" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "allow_recommendations" BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS "profiles_activation_status_idx" ON "profiles"("activation_status");
CREATE INDEX IF NOT EXISTS "profiles_profile_type_idx" ON "profiles"("profile_type");
CREATE INDEX IF NOT EXISTS "profiles_intelligence_readiness_score_idx" ON "profiles"("intelligence_readiness_score");

-- Existing public onboarded hubs keep discovery eligibility; nobody is auto-activated.
UPDATE "profiles"
SET "appear_in_expert_discovery" = true
WHERE "is_onboarded" = true
  AND "visibility" = 'PUBLIC';
