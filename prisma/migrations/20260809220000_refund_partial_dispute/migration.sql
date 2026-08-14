-- CreateEnum
CREATE TYPE "MarketplaceRefundKind" AS ENUM ('FULL', 'PARTIAL', 'DISPUTE');

-- AlterEnum (Postgres 15+ supports IF NOT EXISTS)
DO $$ BEGIN
  ALTER TYPE "MarketplaceRefundStatus" ADD VALUE IF NOT EXISTS 'DISPUTED';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AlterTable
ALTER TABLE "marketplace_refunds" ADD COLUMN IF NOT EXISTS "kind" "MarketplaceRefundKind" NOT NULL DEFAULT 'FULL';
ALTER TABLE "marketplace_refunds" ADD COLUMN IF NOT EXISTS "amount_cents" INTEGER;
ALTER TABLE "marketplace_refunds" ADD COLUMN IF NOT EXISTS "revoke_access" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "marketplace_refunds_kind_created_at_idx" ON "marketplace_refunds"("kind", "created_at");
