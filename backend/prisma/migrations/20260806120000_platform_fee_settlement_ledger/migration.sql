CREATE TYPE "rental_fee_settlement_status" AS ENUM ('held', 'settled', 'refunded');
CREATE TYPE "platform_ledger_type" AS ENUM ('rental_hold', 'rental_refund', 'platform_revenue', 'lender_payable', 'lender_withdrawal');

ALTER TABLE "rental_orders" ADD COLUMN "platform_fee_rate_bps" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "platform_fee_config" (
  "id" INTEGER NOT NULL DEFAULT 1,
  "platform_fee_rate_bps" INTEGER NOT NULL DEFAULT 3000,
  "updated_by" UUID,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "platform_fee_config_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "platform_fee_config_singleton" CHECK ("id" = 1),
  CONSTRAINT "platform_fee_config_rate_range" CHECK ("platform_fee_rate_bps" BETWEEN 0 AND 10000)
);
INSERT INTO "platform_fee_config" ("id", "platform_fee_rate_bps") VALUES (1, 3000) ON CONFLICT ("id") DO NOTHING;

CREATE TABLE "platform_fee_config_audits" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "previous_rate_bps" INTEGER NOT NULL,
  "next_rate_bps" INTEGER NOT NULL, "changed_by" UUID NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "platform_fee_config_audits_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "platform_fee_config_audits_created_at_idx" ON "platform_fee_config_audits"("created_at");

CREATE TABLE "platform_wallets" (
  "id" INTEGER NOT NULL DEFAULT 1, "rental_hold_balance" DECIMAL(15,2) NOT NULL DEFAULT 0,
  "revenue_available_balance" DECIMAL(15,2) NOT NULL DEFAULT 0,
  "lender_payable_balance" DECIMAL(15,2) NOT NULL DEFAULT 0,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "platform_wallets_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "platform_wallets_singleton" CHECK ("id" = 1)
);
INSERT INTO "platform_wallets" ("id") VALUES (1) ON CONFLICT ("id") DO NOTHING;

CREATE TABLE "rental_fee_settlements" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "rental_order_id" UUID NOT NULL,
  "gross_rental_fee" DECIMAL(15,2) NOT NULL, "rental_refund_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
  "distributable_amount" DECIMAL(15,2) NOT NULL DEFAULT 0, "platform_fee_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
  "lender_income_amount" DECIMAL(15,2) NOT NULL DEFAULT 0, "platform_fee_rate_bps" INTEGER NOT NULL,
  "status" "rental_fee_settlement_status" NOT NULL DEFAULT 'held', "held_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "settled_at" TIMESTAMP(3), CONSTRAINT "rental_fee_settlements_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "rental_fee_settlements_rental_order_id_key" UNIQUE ("rental_order_id"),
  CONSTRAINT "rental_fee_settlements_order_fk" FOREIGN KEY ("rental_order_id") REFERENCES "rental_orders"("id") ON DELETE RESTRICT
);

CREATE TABLE "platform_ledger_transactions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "platform_wallet_id" INTEGER NOT NULL,
  "rental_order_id" UUID, "type" "platform_ledger_type" NOT NULL, "amount" DECIMAL(15,2) NOT NULL,
  "reference" VARCHAR(255) NOT NULL, "note" TEXT, "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "platform_ledger_transactions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "platform_ledger_transactions_reference_key" UNIQUE ("reference"),
  CONSTRAINT "platform_ledger_wallet_fk" FOREIGN KEY ("platform_wallet_id") REFERENCES "platform_wallets"("id") ON DELETE RESTRICT,
  CONSTRAINT "platform_ledger_order_fk" FOREIGN KEY ("rental_order_id") REFERENCES "rental_orders"("id") ON DELETE SET NULL
);
CREATE INDEX "platform_ledger_transactions_rental_order_id_type_idx" ON "platform_ledger_transactions"("rental_order_id", "type");
CREATE INDEX "platform_ledger_transactions_created_at_idx" ON "platform_ledger_transactions"("created_at");

-- Preserve the original 15/85 snapshot for in-flight legacy orders. Historical
-- completed orders are deliberately not fabricated into revenue ledger entries.
INSERT INTO "rental_fee_settlements" (
  "rental_order_id", "gross_rental_fee", "platform_fee_rate_bps", "status"
)
SELECT "id", "rental_fee", 1500, 'held'
FROM "rental_orders"
WHERE "status" IN ('confirmed', 'delivering', 'active', 'returning', 'disputed')
ON CONFLICT ("rental_order_id") DO NOTHING;

UPDATE "rental_orders"
SET "platform_fee_rate_bps" = 1500
WHERE "status" IN ('confirmed', 'delivering', 'active', 'returning', 'disputed')
  AND "platform_fee_rate_bps" = 0;

UPDATE "platform_wallets"
SET "rental_hold_balance" = (
  SELECT COALESCE(SUM("gross_rental_fee"), 0)
  FROM "rental_fee_settlements"
  WHERE "status" = 'held'
)
WHERE "id" = 1;

UPDATE "platform_wallets"
SET "lender_payable_balance" = (
  SELECT COALESCE(SUM("balance"), 0) FROM "lender_wallets"
)
WHERE "id" = 1;
