-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('renter', 'lender', 'admin');

-- CreateEnum
CREATE TYPE "kyc_status_type" AS ENUM ('pending', 'verified', 'rejected');

-- CreateEnum
CREATE TYPE "gear_status_type" AS ENUM ('available', 'rented', 'maintenance', 'delisted');

-- CreateEnum
CREATE TYPE "approval_status_type" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "wallet_status_type" AS ENUM ('active', 'suspended', 'expired', 'closed');

-- CreateEnum
CREATE TYPE "credit_tx_type" AS ENUM ('limit_granted', 'deposit_lock', 'deposit_release', 'rental_fee_charge', 'compensation', 'debt_repay', 'limit_adjustment');

-- CreateEnum
CREATE TYPE "credit_direction" AS ENUM ('in', 'out');

-- CreateEnum
CREATE TYPE "credit_ref_type" AS ENUM ('rental_order', 'credit_usage', 'dispute');

-- CreateEnum
CREATE TYPE "credit_tx_status" AS ENUM ('pending', 'success', 'failed', 'reversed');

-- CreateEnum
CREATE TYPE "order_status_type" AS ENUM ('pending_confirm', 'confirmed', 'delivering', 'active', 'returning', 'completed', 'cancelled', 'disputed');

-- CreateEnum
CREATE TYPE "deposit_type_enum" AS ENUM ('traditional', 'credit_line');

-- CreateEnum
CREATE TYPE "escrow_source_type" AS ENUM ('renter_cash', 'credit_line');

-- CreateEnum
CREATE TYPE "escrow_status_type" AS ENUM ('locked', 'pending_return', 'released', 'compensated');

-- CreateEnum
CREATE TYPE "payment_type_enum" AS ENUM ('rental_fee', 'deposit', 'credit_fee', 'refund', 'compensation', 'withdrawal');

-- CreateEnum
CREATE TYPE "payment_method_enum" AS ENUM ('momo', 'vnpay', 'bank_transfer', 'credit_line');

-- CreateEnum
CREATE TYPE "payment_status_enum" AS ENUM ('pending', 'success', 'failed', 'refunded');

-- CreateEnum
CREATE TYPE "message_type_enum" AS ENUM ('text', 'image', 'video');

-- CreateEnum
CREATE TYPE "proof_stage_enum" AS ENUM ('pre_shipment', 'post_received', 'pre_return', 'post_returned');

-- CreateEnum
CREATE TYPE "proof_type_enum" AS ENUM ('image', 'video');

-- CreateEnum
CREATE TYPE "dispute_status_type" AS ENUM ('open', 'under_review', 'resolved', 'closed');

-- CreateEnum
CREATE TYPE "reporter_role_enum" AS ENUM ('renter', 'lender');

-- CreateEnum
CREATE TYPE "dispute_reason_enum" AS ENUM ('device_not_as_described', 'device_faulty', 'missing_accessory', 'device_damaged', 'component_replaced', 'other');

-- CreateEnum
CREATE TYPE "resolution_type_enum" AS ENUM ('refund', 'deposit_deduct', 'compensation', 'account_ban', 'no_action');

-- CreateEnum
CREATE TYPE "review_target_type" AS ENUM ('gear', 'lender', 'renter');

-- CreateEnum
CREATE TYPE "membership_status_type" AS ENUM ('active', 'expired', 'cancelled');

-- CreateEnum
CREATE TYPE "lender_wallet_status" AS ENUM ('active', 'suspended', 'closed');

-- CreateEnum
CREATE TYPE "lender_tx_type" AS ENUM ('income', 'withdrawal', 'compensation', 'fee_deduction');

-- CreateEnum
CREATE TYPE "TopupStatusType" AS ENUM ('pending', 'success', 'failed');

-- CreateEnum
CREATE TYPE "withdrawal_status_type" AS ENUM ('pending', 'approved', 'rejected', 'completed');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(20),
    "password_hash" VARCHAR(255) NOT NULL,
    "hashed_refresh_token" TEXT,
    "full_name" VARCHAR(255),
    "cccd" VARCHAR(20),
    "avatar_url" TEXT,
    "bio" TEXT,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "address" TEXT,
    "total_reviews" INTEGER NOT NULL DEFAULT 0,
    "role" "user_role" NOT NULL DEFAULT 'renter',
    "kyc_status" "kyc_status_type" NOT NULL DEFAULT 'pending',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gear_categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "parent_id" UUID,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "description" TEXT,

    CONSTRAINT "gear_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gears" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "lender_id" UUID NOT NULL,
    "category_id" UUID,
    "name" VARCHAR(255) NOT NULL,
    "brand" VARCHAR(100),
    "model" VARCHAR(100),
    "serial_number" VARCHAR(100),
    "description" TEXT,
    "specifications" JSONB,
    "value" DECIMAL(15,2),
    "rent_price_per_day" DECIMAL(15,2) NOT NULL,
    "status" "gear_status_type" NOT NULL DEFAULT 'available',
    "approval_status" "approval_status_type" NOT NULL DEFAULT 'pending',
    "approved_by" UUID,
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gears_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gear_price_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "gear_id" UUID NOT NULL,
    "changed_by" UUID NOT NULL,
    "old_rent_price_per_day" DECIMAL(15,2) NOT NULL,
    "new_rent_price_per_day" DECIMAL(15,2) NOT NULL,
    "reason" TEXT,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gear_price_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gear_media" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "gear_id" UUID NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "url" TEXT NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "gear_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_partners" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "api_endpoint" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "credit_partners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mutux_wallets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "credit_partner_id" UUID,
    "total_limit" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "display_balance" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "locked_balance" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "outstanding_debt" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "status" "wallet_status_type" NOT NULL DEFAULT 'active',
    "partner_ref_id" VARCHAR(255),
    "approved_at" TIMESTAMP(3),
    "expired_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mutux_wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_transactions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "mutux_wallet_id" UUID NOT NULL,
    "type" "credit_tx_type" NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "display_balance_before" DECIMAL(15,2) NOT NULL,
    "display_balance_after" DECIMAL(15,2) NOT NULL,
    "direction" "credit_direction" NOT NULL,
    "ref_type" "credit_ref_type",
    "ref_id" UUID,
    "note" TEXT,
    "status" "credit_tx_status" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credit_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rental_orders" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_code" VARCHAR(50) NOT NULL,
    "renter_id" UUID NOT NULL,
    "gear_id" UUID NOT NULL,
    "lender_id" UUID NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "duration_days" INTEGER NOT NULL,
    "snapped_rent_price_per_day" DECIMAL(15,2) NOT NULL,
    "rental_fee" DECIMAL(15,2) NOT NULL,
    "base_rental_fee" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "discount_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "deposit_amount" DECIMAL(15,2) NOT NULL,
    "deposit_type" "deposit_type_enum" NOT NULL DEFAULT 'traditional',
    "status" "order_status_type" NOT NULL DEFAULT 'pending_confirm',
    "shipping_address" TEXT,
    "shipping_name" VARCHAR(255),
    "shipping_phone" VARCHAR(20),
    "lender_shipped_at" TIMESTAMP(3),
    "renter_received_at" TIMESTAMP(3),
    "renter_returned_at" TIMESTAMP(3),
    "lender_received_back_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rental_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "escrow_wallets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "rental_order_id" UUID NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "source" "escrow_source_type" NOT NULL,
    "status" "escrow_status_type" NOT NULL DEFAULT 'locked',
    "locked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "released_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "escrow_wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "rental_order_id" UUID,
    "user_id" UUID NOT NULL,
    "type" "payment_type_enum" NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "method" "payment_method_enum" NOT NULL,
    "status" "payment_status_enum" NOT NULL DEFAULT 'pending',
    "transaction_ref" VARCHAR(255),
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rental_proofs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "rental_order_id" UUID NOT NULL,
    "uploaded_by" UUID NOT NULL,
    "stage" "proof_stage_enum" NOT NULL,
    "proof_type" "proof_type_enum" NOT NULL,
    "file_url" TEXT NOT NULL,
    "note" TEXT,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rental_proofs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "rental_order_id" UUID,
    "renter_id" UUID NOT NULL,
    "lender_id" UUID NOT NULL,
    "last_message_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "conversation_id" UUID NOT NULL,
    "sender_id" UUID NOT NULL,
    "type" "message_type_enum" NOT NULL DEFAULT 'text',
    "content" TEXT,
    "media_url" TEXT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disputes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "rental_order_id" UUID NOT NULL,
    "reported_by" UUID NOT NULL,
    "reporter_role" "reporter_role_enum" NOT NULL,
    "reason" "dispute_reason_enum" NOT NULL,
    "description" TEXT,
    "status" "dispute_status_type" NOT NULL DEFAULT 'open',
    "resolved_by" UUID,
    "resolution_note" TEXT,
    "resolution_type" "resolution_type_enum",
    "deduct_amount" DECIMAL(15,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "disputes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dispute_evidences" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "dispute_id" UUID NOT NULL,
    "uploaded_by" UUID NOT NULL,
    "media_type" VARCHAR(20) NOT NULL,
    "url" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dispute_evidences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "rental_order_id" UUID NOT NULL,
    "reviewer_id" UUID NOT NULL,
    "target_id" UUID,
    "target_type" "review_target_type" NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "target_user_id" UUID,
    "target_gear_id" UUID,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "renter_wallets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "balance" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "locked_balance" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "status" "wallet_status_type" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "renter_wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "renter_wallet_transactions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "wallet_id" UUID NOT NULL,
    "type" VARCHAR(40) NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "balance_before" DECIMAL(15,2) NOT NULL,
    "balance_after" DECIMAL(15,2) NOT NULL,
    "reference" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "renter_wallet_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_topups" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "wallet_id" UUID NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "order_code" VARCHAR(80) NOT NULL,
    "provider_reference" VARCHAR(255),
    "status" "TopupStatusType" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "wallet_topups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "withdrawals" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "lender_wallet_id" UUID NOT NULL,
    "bank_account_id" UUID NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "status" "withdrawal_status_type" NOT NULL DEFAULT 'pending',
    "resolved_by" UUID,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "withdrawals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "body" TEXT,
    "type" VARCHAR(100),
    "ref_type" VARCHAR(100),
    "ref_id" UUID,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membership_plans" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "price" DECIMAL(15,2) NOT NULL,
    "duration_days" INTEGER NOT NULL,
    "rental_discount_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "credit_fee_discount_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "priority_access" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "membership_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_memberships" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "plan_id" UUID NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "status" "membership_status_type" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lender_wallets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "lender_id" UUID NOT NULL,
    "balance" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total_withdrawn" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "status" "lender_wallet_status" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lender_wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lender_wallet_transactions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "lender_wallet_id" UUID NOT NULL,
    "rental_order_id" UUID,
    "type" "lender_tx_type" NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "balance_before" DECIMAL(15,2) NOT NULL,
    "balance_after" DECIMAL(15,2) NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lender_wallet_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_accounts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "bank_name" VARCHAR(255) NOT NULL,
    "bank_code" VARCHAR(20),
    "account_number" VARCHAR(50) NOT NULL,
    "account_holder" VARCHAR(255) NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bank_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "gear_categories_slug_key" ON "gear_categories"("slug");

-- CreateIndex
CREATE INDEX "idx_gears_lender_id" ON "gears"("lender_id");

-- CreateIndex
CREATE INDEX "idx_gears_category_id" ON "gears"("category_id");

-- CreateIndex
CREATE INDEX "idx_gears_status" ON "gears"("status");

-- CreateIndex
CREATE UNIQUE INDEX "mutux_wallets_user_id_key" ON "mutux_wallets"("user_id");

-- CreateIndex
CREATE INDEX "idx_credit_tx_wallet" ON "credit_transactions"("mutux_wallet_id");

-- CreateIndex
CREATE UNIQUE INDEX "rental_orders_order_code_key" ON "rental_orders"("order_code");

-- CreateIndex
CREATE INDEX "idx_rental_orders_renter" ON "rental_orders"("renter_id");

-- CreateIndex
CREATE INDEX "idx_rental_orders_lender" ON "rental_orders"("lender_id");

-- CreateIndex
CREATE INDEX "idx_rental_orders_gear" ON "rental_orders"("gear_id");

-- CreateIndex
CREATE INDEX "idx_rental_orders_status" ON "rental_orders"("status");

-- CreateIndex
CREATE UNIQUE INDEX "escrow_wallets_rental_order_id_key" ON "escrow_wallets"("rental_order_id");

-- CreateIndex
CREATE INDEX "idx_payments_order" ON "payments"("rental_order_id");

-- CreateIndex
CREATE INDEX "idx_messages_conversation" ON "messages"("conversation_id");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_rental_order_id_reviewer_id_target_type_key" ON "reviews"("rental_order_id", "reviewer_id", "target_type");

-- CreateIndex
CREATE UNIQUE INDEX "renter_wallets_user_id_key" ON "renter_wallets"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "renter_wallet_transactions_reference_key" ON "renter_wallet_transactions"("reference");

-- CreateIndex
CREATE INDEX "renter_wallet_transactions_wallet_id_idx" ON "renter_wallet_transactions"("wallet_id");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_topups_order_code_key" ON "wallet_topups"("order_code");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_topups_provider_reference_key" ON "wallet_topups"("provider_reference");

-- CreateIndex
CREATE INDEX "wallet_topups_wallet_id_status_idx" ON "wallet_topups"("wallet_id", "status");

-- CreateIndex
CREATE INDEX "withdrawals_lender_wallet_id_status_idx" ON "withdrawals"("lender_wallet_id", "status");

-- CreateIndex
CREATE INDEX "withdrawals_bank_account_id_idx" ON "withdrawals"("bank_account_id");

-- CreateIndex
CREATE INDEX "idx_notifications_user" ON "notifications"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "lender_wallets_lender_id_key" ON "lender_wallets"("lender_id");

-- CreateIndex
CREATE INDEX "idx_lender_tx_wallet" ON "lender_wallet_transactions"("lender_wallet_id");

-- AddForeignKey
ALTER TABLE "gear_categories" ADD CONSTRAINT "gear_categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "gear_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gears" ADD CONSTRAINT "gears_lender_id_fkey" FOREIGN KEY ("lender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gears" ADD CONSTRAINT "gears_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "gear_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gears" ADD CONSTRAINT "gears_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gear_price_history" ADD CONSTRAINT "gear_price_history_gear_id_fkey" FOREIGN KEY ("gear_id") REFERENCES "gears"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gear_price_history" ADD CONSTRAINT "gear_price_history_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gear_media" ADD CONSTRAINT "gear_media_gear_id_fkey" FOREIGN KEY ("gear_id") REFERENCES "gears"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mutux_wallets" ADD CONSTRAINT "mutux_wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mutux_wallets" ADD CONSTRAINT "mutux_wallets_credit_partner_id_fkey" FOREIGN KEY ("credit_partner_id") REFERENCES "credit_partners"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_mutux_wallet_id_fkey" FOREIGN KEY ("mutux_wallet_id") REFERENCES "mutux_wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_orders" ADD CONSTRAINT "rental_orders_renter_id_fkey" FOREIGN KEY ("renter_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_orders" ADD CONSTRAINT "rental_orders_gear_id_fkey" FOREIGN KEY ("gear_id") REFERENCES "gears"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_orders" ADD CONSTRAINT "rental_orders_lender_id_fkey" FOREIGN KEY ("lender_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escrow_wallets" ADD CONSTRAINT "escrow_wallets_rental_order_id_fkey" FOREIGN KEY ("rental_order_id") REFERENCES "rental_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_rental_order_id_fkey" FOREIGN KEY ("rental_order_id") REFERENCES "rental_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_proofs" ADD CONSTRAINT "rental_proofs_rental_order_id_fkey" FOREIGN KEY ("rental_order_id") REFERENCES "rental_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_proofs" ADD CONSTRAINT "rental_proofs_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_rental_order_id_fkey" FOREIGN KEY ("rental_order_id") REFERENCES "rental_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_renter_id_fkey" FOREIGN KEY ("renter_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_lender_id_fkey" FOREIGN KEY ("lender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_rental_order_id_fkey" FOREIGN KEY ("rental_order_id") REFERENCES "rental_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_reported_by_fkey" FOREIGN KEY ("reported_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispute_evidences" ADD CONSTRAINT "dispute_evidences_dispute_id_fkey" FOREIGN KEY ("dispute_id") REFERENCES "disputes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispute_evidences" ADD CONSTRAINT "dispute_evidences_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_rental_order_id_fkey" FOREIGN KEY ("rental_order_id") REFERENCES "rental_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_target_user_id_fkey" FOREIGN KEY ("target_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_target_gear_id_fkey" FOREIGN KEY ("target_gear_id") REFERENCES "gears"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "renter_wallets" ADD CONSTRAINT "renter_wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "renter_wallet_transactions" ADD CONSTRAINT "renter_wallet_transactions_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "renter_wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_topups" ADD CONSTRAINT "wallet_topups_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "renter_wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "withdrawals" ADD CONSTRAINT "withdrawals_lender_wallet_id_fkey" FOREIGN KEY ("lender_wallet_id") REFERENCES "lender_wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "withdrawals" ADD CONSTRAINT "withdrawals_bank_account_id_fkey" FOREIGN KEY ("bank_account_id") REFERENCES "bank_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_memberships" ADD CONSTRAINT "user_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_memberships" ADD CONSTRAINT "user_memberships_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "membership_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lender_wallets" ADD CONSTRAINT "lender_wallets_lender_id_fkey" FOREIGN KEY ("lender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lender_wallet_transactions" ADD CONSTRAINT "lender_wallet_transactions_lender_wallet_id_fkey" FOREIGN KEY ("lender_wallet_id") REFERENCES "lender_wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lender_wallet_transactions" ADD CONSTRAINT "lender_wallet_transactions_rental_order_id_fkey" FOREIGN KEY ("rental_order_id") REFERENCES "rental_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
