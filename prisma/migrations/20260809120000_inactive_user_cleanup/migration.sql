-- AlterTable
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "inactive_blocked_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "users_last_login_at_idx" ON "users"("last_login_at");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "users_inactive_blocked_at_idx" ON "users"("inactive_blocked_at");
