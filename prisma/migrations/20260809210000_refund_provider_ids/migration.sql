-- AlterTable
ALTER TABLE "marketplace_refunds" ADD COLUMN IF NOT EXISTS "external_refund_id" VARCHAR(120);
ALTER TABLE "marketplace_refunds" ADD COLUMN IF NOT EXISTS "provider_refunded_at" TIMESTAMP(3);
