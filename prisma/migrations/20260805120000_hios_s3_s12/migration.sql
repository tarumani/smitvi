-- HI-OS S3–S12: profile onboarding fields, ImportJob, marketplace types

ALTER TABLE "profiles"
  ADD COLUMN "hub_archetype_id" VARCHAR(40),
  ADD COLUMN "reputation_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN "onboarding_step" VARCHAR(32);

CREATE TYPE "ImportJobType" AS ENUM ('WEBSITE', 'PDF');
CREATE TYPE "ImportJobStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

CREATE TABLE "import_jobs" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "type" "ImportJobType" NOT NULL,
  "status" "ImportJobStatus" NOT NULL DEFAULT 'PENDING',
  "source_url" TEXT,
  "storage_path" TEXT,
  "knowledge_source_id" UUID,
  "error_message" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "import_jobs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "import_jobs_user_id_created_at_idx" ON "import_jobs"("user_id", "created_at");
CREATE INDEX "import_jobs_status_idx" ON "import_jobs"("status");

ALTER TABLE "import_jobs"
  ADD CONSTRAINT "import_jobs_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TYPE "MarketplaceListingType" ADD VALUE 'TEMPLATE';
ALTER TYPE "MarketplaceListingType" ADD VALUE 'PROMPT_PACK';
