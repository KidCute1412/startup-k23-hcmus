ALTER TABLE "users"
  ADD COLUMN "kyc_rejection_reason" TEXT,
  ADD COLUMN "kyc_reviewed_by" UUID,
  ADD COLUMN "kyc_reviewed_at" TIMESTAMP(3);

ALTER TABLE "users"
  ADD CONSTRAINT "users_kyc_reviewed_by_fkey"
  FOREIGN KEY ("kyc_reviewed_by") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "idx_users_kyc_reviewed_by" ON "users"("kyc_reviewed_by");
