ALTER TABLE "users"
  ADD COLUMN "dob" DATE,
  ADD COLUMN "kyc_front_card_url" TEXT,
  ADD COLUMN "kyc_back_card_url" TEXT,
  ADD COLUMN "kyc_portrait_url" TEXT;

CREATE TABLE "user_addresses" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "receiver_name" VARCHAR(255) NOT NULL,
  "phone" VARCHAR(20) NOT NULL,
  "detail_address" TEXT NOT NULL,
  "ward" VARCHAR(255) NOT NULL,
  "district" VARCHAR(255) NOT NULL,
  "province" VARCHAR(255) NOT NULL,
  "is_default" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "user_addresses_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "user_addresses_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "idx_user_addresses_user_id" ON "user_addresses"("user_id");
CREATE UNIQUE INDEX "uq_user_addresses_one_default_per_user"
  ON "user_addresses"("user_id")
  WHERE "is_default" = true;
