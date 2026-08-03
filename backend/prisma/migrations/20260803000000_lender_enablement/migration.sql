CREATE TYPE "lender_upgrade_status" AS ENUM ('pending', 'approved', 'rejected');

ALTER TABLE "users"
  ADD COLUMN "lender_enabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "lender_enabled_at" TIMESTAMP(3);

CREATE TABLE "lender_upgrade_requests" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "status" "lender_upgrade_status" NOT NULL DEFAULT 'pending',
  "reason" TEXT,
  "review_note" TEXT,
  "reviewed_by" UUID,
  "reviewed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "lender_upgrade_requests_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "lender_upgrade_requests"
  ADD CONSTRAINT "lender_upgrade_requests_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "lender_upgrade_requests"
  ADD CONSTRAINT "lender_upgrade_requests_reviewed_by_fkey"
  FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "idx_lender_upgrade_requests_user" ON "lender_upgrade_requests"("user_id", "created_at");
CREATE INDEX "idx_lender_upgrade_requests_status" ON "lender_upgrade_requests"("status", "created_at");

UPDATE "users"
SET
  "lender_enabled" = true,
  "lender_enabled_at" = COALESCE("kyc_reviewed_at", "updated_at", CURRENT_TIMESTAMP),
  "role" = 'renter'
WHERE "role" = 'lender';

INSERT INTO "lender_wallets" ("lender_id")
SELECT "id"
FROM "users"
WHERE "lender_enabled" = true
ON CONFLICT ("lender_id") DO NOTHING;

ALTER TYPE "user_role" RENAME TO "user_role_old";
CREATE TYPE "user_role" AS ENUM ('renter', 'admin');
ALTER TABLE "users"
  ALTER COLUMN "role" DROP DEFAULT,
  ALTER COLUMN "role" TYPE "user_role" USING ("role"::text::"user_role"),
  ALTER COLUMN "role" SET DEFAULT 'renter';
DROP TYPE "user_role_old";
