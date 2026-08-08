-- Phase 5: Intelligence marketplace monetization extensions

CREATE TYPE "ListingVisibility" AS ENUM ('PUBLIC', 'UNLISTED', 'PRIVATE');
CREATE TYPE "CreatorWalletStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'ON_HOLD');
CREATE TYPE "CreatorPayoutStatus" AS ENUM ('PENDING', 'PROCESSING', 'PAID', 'FAILED', 'ON_HOLD');
CREATE TYPE "TwinAccessMode" AS ENUM ('FREE', 'PAID', 'SUBSCRIPTION', 'PRIVATE');
CREATE TYPE "MarketplaceEventType" AS ENUM (
  'PRODUCT_VIEWED', 'PRODUCT_PURCHASED', 'AI_ACCESS_PURCHASED',
  'SUBSCRIPTION_STARTED', 'SUBSCRIPTION_RENEWED', 'SUBSCRIPTION_CANCELLED',
  'CONSULTATION_BOOKED', 'PAYMENT_FAILED', 'REFUND_CREATED', 'PAYOUT_COMPLETED'
);
CREATE TYPE "MarketplaceRefundStatus" AS ENUM ('REQUESTED', 'APPROVED', 'REJECTED', 'PROCESSING', 'COMPLETED', 'FAILED');

ALTER TYPE "MarketplaceListingType" ADD VALUE IF NOT EXISTS 'GUIDE';
ALTER TYPE "MarketplaceListingType" ADD VALUE IF NOT EXISTS 'CHECKLIST';
ALTER TYPE "MarketplaceListingType" ADD VALUE IF NOT EXISTS 'CASE_STUDY';
ALTER TYPE "MarketplaceListingType" ADD VALUE IF NOT EXISTS 'COURSE';
ALTER TYPE "MarketplaceListingType" ADD VALUE IF NOT EXISTS 'VIDEO';
ALTER TYPE "MarketplaceListingType" ADD VALUE IF NOT EXISTS 'AUDIO';
ALTER TYPE "MarketplaceListingType" ADD VALUE IF NOT EXISTS 'BUNDLE';
ALTER TYPE "MarketplaceListingType" ADD VALUE IF NOT EXISTS 'PDF';

ALTER TABLE "marketplace_listings" ADD COLUMN IF NOT EXISTS "slug" VARCHAR(120);
ALTER TABLE "marketplace_listings" ADD COLUMN IF NOT EXISTS "content_reference" VARCHAR(500);
ALTER TABLE "marketplace_listings" ADD COLUMN IF NOT EXISTS "thumbnail_url" TEXT;
ALTER TABLE "marketplace_listings" ADD COLUMN IF NOT EXISTS "visibility" "ListingVisibility" NOT NULL DEFAULT 'PUBLIC';
ALTER TABLE "marketplace_listings" ADD COLUMN IF NOT EXISTS "sales_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "marketplace_listings" ADD COLUMN IF NOT EXISTS "rating_average" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "marketplace_listings" ADD COLUMN IF NOT EXISTS "rating_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "marketplace_listings" ADD COLUMN IF NOT EXISTS "published_at" TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS "marketplace_listings_seller_id_slug_key" ON "marketplace_listings"("seller_id", "slug");

CREATE TABLE "platform_fee_configs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "category" VARCHAR(32) NOT NULL,
    "commission_rate" DOUBLE PRECISION NOT NULL,
    "label" VARCHAR(120),
    "updated_at" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "platform_fee_configs_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "platform_fee_configs_category_key" ON "platform_fee_configs"("category");

INSERT INTO "platform_fee_configs" ("id", "category", "commission_rate", "label", "updated_at")
VALUES
  (gen_random_uuid(), 'PRODUCT', 0.10, 'Digital products', NOW()),
  (gen_random_uuid(), 'CONSULTATION', 0.10, 'Consultations', NOW()),
  (gen_random_uuid(), 'AI_ACCESS', 0.10, 'Paid AI Twin', NOW()),
  (gen_random_uuid(), 'SUBSCRIPTION', 0.10, 'Creator subscriptions', NOW())
ON CONFLICT DO NOTHING;

CREATE TABLE "creator_wallets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "available_balance_cents" INTEGER NOT NULL DEFAULT 0,
    "pending_balance_cents" INTEGER NOT NULL DEFAULT 0,
    "lifetime_earnings_cents" INTEGER NOT NULL DEFAULT 0,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "status" "CreatorWalletStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "creator_wallets_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "creator_wallets_user_id_key" ON "creator_wallets"("user_id");
ALTER TABLE "creator_wallets" ADD CONSTRAINT "creator_wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "creator_payouts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "status" "CreatorPayoutStatus" NOT NULL DEFAULT 'PENDING',
    "external_ref" VARCHAR(120),
    "failure_reason" VARCHAR(500),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paid_at" TIMESTAMPTZ,
    CONSTRAINT "creator_payouts_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "creator_payouts_user_id_created_at_idx" ON "creator_payouts"("user_id", "created_at");
ALTER TABLE "creator_payouts" ADD CONSTRAINT "creator_payouts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "marketplace_access" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "listing_id" UUID NOT NULL,
    "order_id" UUID,
    "granted_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "marketplace_access_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "marketplace_access_user_id_listing_id_key" ON "marketplace_access"("user_id", "listing_id");
ALTER TABLE "marketplace_access" ADD CONSTRAINT "marketplace_access_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "marketplace_access" ADD CONSTRAINT "marketplace_access_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "marketplace_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "marketplace_reviews" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "listing_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "order_id" UUID,
    "rating" INTEGER NOT NULL,
    "body" VARCHAR(2000),
    "verified_purchase" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "marketplace_reviews_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "marketplace_reviews_listing_id_user_id_key" ON "marketplace_reviews"("listing_id", "user_id");
ALTER TABLE "marketplace_reviews" ADD CONSTRAINT "marketplace_reviews_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "marketplace_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "marketplace_reviews" ADD CONSTRAINT "marketplace_reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "marketplace_refunds" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id" UUID NOT NULL,
    "status" "MarketplaceRefundStatus" NOT NULL DEFAULT 'REQUESTED',
    "reason" VARCHAR(500),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "marketplace_refunds_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "marketplace_refunds_order_id_key" ON "marketplace_refunds"("order_id");

CREATE TABLE "marketplace_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "creator_id" UUID,
    "listing_id" UUID,
    "order_id" UUID,
    "event_type" "MarketplaceEventType" NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "marketplace_events_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "marketplace_events_creator_id_created_at_idx" ON "marketplace_events"("creator_id", "created_at");
ALTER TABLE "marketplace_events" ADD CONSTRAINT "marketplace_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "twin_monetization_settings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "access_mode" "TwinAccessMode" NOT NULL DEFAULT 'FREE',
    "price_per_conversation_cents" INTEGER,
    "monthly_subscription_cents" INTEGER,
    "free_questions_per_day" INTEGER NOT NULL DEFAULT 3,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "twin_monetization_settings_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "twin_monetization_settings_user_id_key" ON "twin_monetization_settings"("user_id");
ALTER TABLE "twin_monetization_settings" ADD CONSTRAINT "twin_monetization_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "twin_creator_subscriptions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "creator_id" UUID NOT NULL,
    "subscriber_id" UUID NOT NULL,
    "price_cents" INTEGER NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "billing_period" VARCHAR(16) NOT NULL,
    "status" VARCHAR(24) NOT NULL DEFAULT 'ACTIVE',
    "started_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "renewed_at" TIMESTAMPTZ,
    "cancelled_at" TIMESTAMPTZ,
    CONSTRAINT "twin_creator_subscriptions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "twin_creator_subscriptions_creator_id_subscriber_id_key" ON "twin_creator_subscriptions"("creator_id", "subscriber_id");
ALTER TABLE "twin_creator_subscriptions" ADD CONSTRAINT "twin_creator_subscriptions_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "twin_creator_subscriptions" ADD CONSTRAINT "twin_creator_subscriptions_subscriber_id_fkey" FOREIGN KEY ("subscriber_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
