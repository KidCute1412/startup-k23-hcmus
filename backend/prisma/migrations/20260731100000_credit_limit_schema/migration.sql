CREATE TYPE "credit_limit_request_status" AS ENUM (
  'pending', 'under_review', 'approved', 'rejected', 'cancelled'
);

ALTER TYPE "credit_ref_type" ADD VALUE IF NOT EXISTS 'kyc_verification';
ALTER TYPE "credit_ref_type" ADD VALUE IF NOT EXISTS 'credit_limit_request';

ALTER TABLE "users"
  ADD COLUMN "credit_consent_accepted_at" TIMESTAMP(3);

CREATE TABLE "credit_limit_requests" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "requested_limit" DECIMAL(15,2) NOT NULL,
  "current_limit" DECIMAL(15,2) NOT NULL,
  "approved_limit" DECIMAL(15,2),
  "consent_accepted_at" TIMESTAMP(3) NOT NULL,
  "credit_consent_snapshot_at" TIMESTAMP(3) NOT NULL,
  "status" "credit_limit_request_status" NOT NULL DEFAULT 'pending',
  "review_note" TEXT,
  "reviewed_by" UUID,
  "reviewed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "credit_limit_requests_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "credit_limit_requests_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "credit_limit_requests_reviewed_by_fkey"
    FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL
);

CREATE INDEX "idx_credit_limit_requests_user"
  ON "credit_limit_requests" ("user_id", "created_at");
CREATE INDEX "idx_credit_limit_requests_status"
  ON "credit_limit_requests" ("status", "created_at");

CREATE UNIQUE INDEX "uq_credit_limit_requests_active_user"
  ON "credit_limit_requests" ("user_id")
  WHERE "status" IN ('pending', 'under_review');

CREATE UNIQUE INDEX "uq_credit_tx_kyc_grant"
  ON "credit_transactions" ("mutux_wallet_id", "ref_type", "ref_id")
  WHERE "type" = 'limit_granted' AND "ref_type" = 'kyc_verification';

CREATE UNIQUE INDEX "uq_credit_tx_limit_adjustment"
  ON "credit_transactions" ("ref_type", "ref_id")
  WHERE "type" = 'limit_adjustment' AND "ref_type" = 'credit_limit_request';
