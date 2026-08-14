-- CreateTable
CREATE TABLE "social_activity_reads" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "activity_key" VARCHAR(80) NOT NULL,
    "read_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "social_activity_reads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "social_activity_reads_user_id_idx" ON "social_activity_reads"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "social_activity_reads_user_id_activity_key_key" ON "social_activity_reads"("user_id", "activity_key");

-- AddForeignKey
ALTER TABLE "social_activity_reads" ADD CONSTRAINT "social_activity_reads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
