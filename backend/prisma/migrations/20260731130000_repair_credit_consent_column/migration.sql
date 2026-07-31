-- Repair databases where the credit-limit migration was recorded before this
-- user consent field was added to that migration file.
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "credit_consent_accepted_at" TIMESTAMP(3);
