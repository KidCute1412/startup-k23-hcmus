UPDATE "mutux_wallets"
SET "expired_at" = NULL;

WITH eligible AS (
  SELECT u."id"
  FROM "users" u
  LEFT JOIN "mutux_wallets" mw ON mw."user_id" = u."id"
  WHERE u."role" = 'renter'
    AND u."kyc_status" = 'verified'
    AND mw."id" IS NULL
),
created AS (
  INSERT INTO "mutux_wallets" (
    "user_id", "total_limit", "display_balance", "locked_balance",
    "outstanding_debt", "status", "approved_at", "expired_at"
  )
  SELECT "id", 3000000, 3000000, 0, 0, 'active', CURRENT_TIMESTAMP, NULL
  FROM eligible
  RETURNING "id", "user_id", "display_balance"
)
INSERT INTO "credit_transactions" (
  "mutux_wallet_id", "type", "amount", "display_balance_before",
  "display_balance_after", "direction", "ref_type", "ref_id", "note", "status"
)
SELECT "id", 'limit_granted', 3000000, 0, "display_balance", 'in',
       'kyc_verification', "user_id", 'MVP verified KYC backfill', 'success'
FROM created
ON CONFLICT DO NOTHING;

WITH upgraded AS (
  UPDATE "mutux_wallets" mw
  SET "total_limit" = 3000000,
      "display_balance" = 3000000,
      "approved_at" = COALESCE(mw."approved_at", CURRENT_TIMESTAMP),
      "expired_at" = NULL
  FROM "users" u
  WHERE mw."user_id" = u."id"
    AND u."role" = 'renter'
    AND u."kyc_status" = 'verified'
    AND mw."total_limit" = 0
    AND mw."locked_balance" = 0
    AND mw."outstanding_debt" = 0
  RETURNING mw."id", mw."user_id"
)
INSERT INTO "credit_transactions" (
  "mutux_wallet_id", "type", "amount", "display_balance_before",
  "display_balance_after", "direction", "ref_type", "ref_id", "note", "status"
)
SELECT "id", 'limit_granted', 3000000, 0, 3000000, 'in',
       'kyc_verification', "user_id", 'MVP verified KYC zero-limit backfill', 'success'
FROM upgraded
ON CONFLICT DO NOTHING;
