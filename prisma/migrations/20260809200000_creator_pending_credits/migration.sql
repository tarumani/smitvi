-- CreateEnum
CREATE TYPE "CreatorPendingCreditStatus" AS ENUM ('PENDING', 'SETTLED', 'REVERSED');

-- CreateTable
CREATE TABLE "creator_pending_credits" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "order_id" UUID,
    "amount_cents" INTEGER NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "status" "CreatorPendingCreditStatus" NOT NULL DEFAULT 'PENDING',
    "credited_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "settled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "creator_pending_credits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "creator_pending_credits_order_id_key" ON "creator_pending_credits"("order_id");

-- CreateIndex
CREATE INDEX "creator_pending_credits_status_credited_at_idx" ON "creator_pending_credits"("status", "credited_at");

-- CreateIndex
CREATE INDEX "creator_pending_credits_user_id_status_credited_at_idx" ON "creator_pending_credits"("user_id", "status", "credited_at");

-- AddForeignKey
ALTER TABLE "creator_pending_credits" ADD CONSTRAINT "creator_pending_credits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: one synthetic credit per wallet with pending balance (age = wallet.updated_at)
INSERT INTO "creator_pending_credits" (
  "id",
  "user_id",
  "order_id",
  "amount_cents",
  "currency",
  "status",
  "credited_at",
  "settled_at",
  "created_at",
  "updated_at"
)
SELECT
  gen_random_uuid(),
  "user_id",
  NULL,
  "pending_balance_cents",
  "currency",
  'PENDING'::"CreatorPendingCreditStatus",
  "updated_at",
  NULL,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "creator_wallets"
WHERE "pending_balance_cents" > 0;
