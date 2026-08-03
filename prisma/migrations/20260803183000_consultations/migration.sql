-- Sprint 4: consultation offers + booking requests

CREATE TYPE "ConsultationRequestStatus" AS ENUM (
  'PENDING',
  'ACCEPTED',
  'DECLINED',
  'CANCELED',
  'COMPLETED'
);

ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'CONSULTATION_OFFER_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'CONSULTATION_REQUESTED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'CONSULTATION_REQUEST_UPDATED';

CREATE TABLE "consultation_offers" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  "headline" VARCHAR(160),
  "description" VARCHAR(1000),
  "duration_minutes" INTEGER NOT NULL DEFAULT 30,
  "price_cents" INTEGER NOT NULL DEFAULT 0,
  "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "consultation_offers_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "consultation_offers_user_id_key" ON "consultation_offers"("user_id");
CREATE INDEX "consultation_offers_enabled_idx" ON "consultation_offers"("enabled");

ALTER TABLE "consultation_offers"
  ADD CONSTRAINT "consultation_offers_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "consultation_requests" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "offer_id" UUID NOT NULL,
  "expert_user_id" UUID NOT NULL,
  "requester_user_id" UUID,
  "requester_name" VARCHAR(120) NOT NULL,
  "requester_email" VARCHAR(254) NOT NULL,
  "message" VARCHAR(2000),
  "preferred_at" TIMESTAMP(3),
  "status" "ConsultationRequestStatus" NOT NULL DEFAULT 'PENDING',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "consultation_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "consultation_requests_expert_user_id_status_created_at_idx"
  ON "consultation_requests"("expert_user_id", "status", "created_at");
CREATE INDEX "consultation_requests_requester_user_id_created_at_idx"
  ON "consultation_requests"("requester_user_id", "created_at");
CREATE INDEX "consultation_requests_offer_id_created_at_idx"
  ON "consultation_requests"("offer_id", "created_at");

ALTER TABLE "consultation_requests"
  ADD CONSTRAINT "consultation_requests_offer_id_fkey"
  FOREIGN KEY ("offer_id") REFERENCES "consultation_offers"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "consultation_requests"
  ADD CONSTRAINT "consultation_requests_expert_user_id_fkey"
  FOREIGN KEY ("expert_user_id") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "consultation_requests"
  ADD CONSTRAINT "consultation_requests_requester_user_id_fkey"
  FOREIGN KEY ("requester_user_id") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
