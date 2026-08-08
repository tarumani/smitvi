-- Phase 6: AI Growth Agent

CREATE TYPE "GrowthProspectStatus" AS ENUM (
  'DISCOVERED', 'RESEARCHED', 'QUALIFIED', 'APPROVED', 'MESSAGE_DRAFTED',
  'READY_FOR_OUTREACH', 'CONTACTED', 'RESPONDED', 'INTERESTED', 'REGISTERED',
  'ACTIVATED', 'CREATOR', 'MONETIZED', 'NOT_INTERESTED', 'DO_NOT_CONTACT', 'INVALID'
);
CREATE TYPE "GrowthProspectSource" AS ENUM (
  'MANUAL', 'CSV_IMPORT', 'REFERRAL', 'PUBLIC_WEB', 'PUBLIC_PORTFOLIO', 'PARTNER', 'API', 'OTHER'
);
CREATE TYPE "GrowthMessageChannel" AS ENUM (
  'EMAIL', 'LINKEDIN_NOTE', 'LINKEDIN_MESSAGE', 'TWITTER', 'COMMUNITY', 'WEBSITE_CONTACT', 'PERSONAL_INVITE'
);
CREATE TYPE "GrowthMessageApprovalStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'EDITED');
CREATE TYPE "GrowthCampaignStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED');
CREATE TYPE "GrowthJobStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');
CREATE TYPE "GrowthJobType" AS ENUM ('RESEARCH', 'SCORE', 'OPPORTUNITY_ANALYSIS', 'REPORT_DAILY', 'REPORT_WEEKLY');

CREATE TABLE "growth_campaigns" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(160) NOT NULL,
    "description" TEXT,
    "target_profession" VARCHAR(120),
    "target_skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "target_industries" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "target_locations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "goal" VARCHAR(240),
    "status" "GrowthCampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "start_date" TIMESTAMPTZ,
    "end_date" TIMESTAMPTZ,
    "created_by_user_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "growth_campaigns_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "growth_prospects" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(160) NOT NULL,
    "professional_title" VARCHAR(160),
    "profession" VARCHAR(120),
    "company" VARCHAR(160),
    "website" VARCHAR(500),
    "portfolio_url" VARCHAR(500),
    "public_profile_url" VARCHAR(500),
    "email" VARCHAR(320),
    "source" "GrowthProspectSource" NOT NULL DEFAULT 'MANUAL',
    "source_url" VARCHAR(500),
    "location" VARCHAR(120),
    "country" VARCHAR(2),
    "industry" VARCHAR(120),
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "topics" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "experience_years" INTEGER,
    "public_signals" JSONB NOT NULL DEFAULT '{}',
    "expertise_summary" TEXT,
    "creator_potential_score" INTEGER,
    "smitvi_fit_score" INTEGER,
    "monetization_potential_score" INTEGER,
    "network_value_score" INTEGER,
    "overall_growth_score" INTEGER,
    "score_breakdown" JSONB NOT NULL DEFAULT '{}',
    "value_proposition" TEXT,
    "status" "GrowthProspectStatus" NOT NULL DEFAULT 'DISCOVERED',
    "campaign_id" UUID,
    "linked_user_id" UUID,
    "acquisition_source" VARCHAR(32),
    "do_not_contact" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "growth_prospects_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "growth_prospects" ADD CONSTRAINT "growth_prospects_campaign_id_fkey"
  FOREIGN KEY ("campaign_id") REFERENCES "growth_campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "growth_prospects_status_overall_growth_score_idx" ON "growth_prospects"("status", "overall_growth_score");
CREATE INDEX "growth_prospects_email_idx" ON "growth_prospects"("email");

CREATE TABLE "growth_prospect_research" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "prospect_id" UUID NOT NULL,
    "summary" TEXT NOT NULL,
    "evidence" JSONB NOT NULL DEFAULT '[]',
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "model_version" VARCHAR(32) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "growth_prospect_research_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "growth_prospect_research" ADD CONSTRAINT "growth_prospect_research_prospect_id_fkey"
  FOREIGN KEY ("prospect_id") REFERENCES "growth_prospects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "growth_messages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "prospect_id" UUID NOT NULL,
    "channel" "GrowthMessageChannel" NOT NULL,
    "subject" VARCHAR(240),
    "body" TEXT NOT NULL,
    "approval_status" "GrowthMessageApprovalStatus" NOT NULL DEFAULT 'DRAFT',
    "approved_by_user_id" UUID,
    "approved_at" TIMESTAMPTZ,
    "sent_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "growth_messages_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "growth_messages" ADD CONSTRAINT "growth_messages_prospect_id_fkey"
  FOREIGN KEY ("prospect_id") REFERENCES "growth_prospects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "growth_outreach_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "message_id" UUID NOT NULL,
    "event_type" VARCHAR(32) NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "growth_outreach_events_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "growth_outreach_events" ADD CONSTRAINT "growth_outreach_events_message_id_fkey"
  FOREIGN KEY ("message_id") REFERENCES "growth_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "growth_conversions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "prospect_id" UUID NOT NULL,
    "user_id" UUID,
    "registered_at" TIMESTAMPTZ,
    "activated_at" TIMESTAMPTZ,
    "first_knowledge_at" TIMESTAMPTZ,
    "twin_ready_at" TIMESTAMPTZ,
    "first_sale_at" TIMESTAMPTZ,
    "revenue_cents" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "updated_at" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "growth_conversions_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "growth_conversions" ADD CONSTRAINT "growth_conversions_prospect_id_fkey"
  FOREIGN KEY ("prospect_id") REFERENCES "growth_prospects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "growth_opportunities" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" VARCHAR(160) NOT NULL,
    "category" VARCHAR(64) NOT NULL,
    "opportunity_score" INTEGER NOT NULL,
    "demand_signal" TEXT,
    "supply_signal" TEXT,
    "rationale" TEXT,
    "computed_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "growth_opportunities_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "growth_suppression_entries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(320),
    "url" VARCHAR(500),
    "reason" VARCHAR(240),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "growth_suppression_entries_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "growth_model_versions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "version" VARCHAR(32) NOT NULL,
    "weights" JSONB NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "growth_model_versions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "growth_model_versions_version_key" ON "growth_model_versions"("version");

INSERT INTO "growth_model_versions" ("id", "version", "weights", "notes", "created_at")
VALUES (
  gen_random_uuid(),
  'v1',
  '{"demandMatch":0.25,"creatorSignals":0.2,"monetization":0.2,"networkGap":0.15,"lookalike":0.1,"referral":0.1}'::jsonb,
  'Initial growth scoring weights',
  NOW()
);

CREATE TABLE "growth_experiments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(160) NOT NULL,
    "hypothesis" TEXT,
    "status" VARCHAR(24) NOT NULL DEFAULT 'DRAFT',
    "variants" JSONB NOT NULL DEFAULT '[]',
    "results" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "growth_experiments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "growth_reports" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "kind" VARCHAR(16) NOT NULL,
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "growth_reports_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "growth_target_profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(160) NOT NULL,
    "profession" VARCHAR(120),
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "industries" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "min_experience_years" INTEGER,
    "priority" INTEGER NOT NULL DEFAULT 50,
    "monetization_potential" VARCHAR(32),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "growth_target_profiles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "founding_creator_programs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(160) NOT NULL,
    "slug" VARCHAR(80) NOT NULL,
    "benefits" JSONB NOT NULL DEFAULT '[]',
    "max_members" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "founding_creator_programs_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "founding_creator_programs_slug_key" ON "founding_creator_programs"("slug");

INSERT INTO "founding_creator_programs" ("id", "name", "slug", "benefits", "max_members", "active", "created_at")
VALUES (
  gen_random_uuid(),
  'Founding 100',
  'founding-100',
  '["Founder badge","Early access","Priority support"]'::jsonb,
  100,
  true,
  NOW()
);

CREATE TABLE "growth_jobs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "job_type" "GrowthJobType" NOT NULL,
    "status" "GrowthJobStatus" NOT NULL DEFAULT 'PENDING',
    "payload" JSONB NOT NULL DEFAULT '{}',
    "result" JSONB,
    "error" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "started_at" TIMESTAMPTZ,
    "completed_at" TIMESTAMPTZ,
    CONSTRAINT "growth_jobs_pkey" PRIMARY KEY ("id")
);
