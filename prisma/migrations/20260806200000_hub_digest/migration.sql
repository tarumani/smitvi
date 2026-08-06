-- Hub email digest preferences
ALTER TABLE "profiles"
ADD COLUMN "hub_digest_email_enabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "hub_digest_last_sent_at" TIMESTAMP(3);
