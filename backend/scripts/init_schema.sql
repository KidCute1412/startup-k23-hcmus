-- =============================================================
-- -- KHÔNG XÀI CÁI NÀY
-- =============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================
-- ENUMS
-- =============================================================

CREATE TYPE user_role           AS ENUM ('renter', 'lender', 'admin');
CREATE TYPE kyc_status_type     AS ENUM ('pending', 'verified', 'rejected');

CREATE TYPE gear_status_type    AS ENUM ('available', 'rented', 'maintenance', 'delisted');
CREATE TYPE approval_status_type AS ENUM ('pending', 'approved', 'rejected');

CREATE TYPE wallet_status_type  AS ENUM ('active', 'suspended', 'expired', 'closed');

CREATE TYPE credit_tx_type      AS ENUM (
    'limit_granted', 'deposit_lock', 'deposit_release',
    'rental_fee_charge', 'compensation', 'debt_repay', 'limit_adjustment'
);
CREATE TYPE credit_direction    AS ENUM ('in', 'out');
CREATE TYPE credit_ref_type     AS ENUM ('rental_order', 'credit_usage', 'dispute');
CREATE TYPE credit_tx_status    AS ENUM ('pending', 'success', 'failed', 'reversed');

CREATE TYPE order_status_type   AS ENUM (
    'pending_confirm', 'confirmed', 'delivering', 'active',
    'returning', 'completed', 'cancelled', 'disputed'
);
CREATE TYPE deposit_type_enum   AS ENUM ('traditional', 'credit_line');

CREATE TYPE escrow_source_type  AS ENUM ('renter_cash', 'credit_line');
CREATE TYPE escrow_status_type  AS ENUM ('locked', 'pending_return', 'released', 'compensated');

CREATE TYPE payment_type_enum   AS ENUM (
    'rental_fee', 'deposit', 'credit_fee', 'refund', 'compensation', 'withdrawal'
);
CREATE TYPE payment_method_enum AS ENUM ('momo', 'vnpay', 'bank_transfer', 'credit_line');
CREATE TYPE payment_status_enum AS ENUM ('pending', 'success', 'failed', 'refunded');

CREATE TYPE message_type_enum   AS ENUM ('text', 'image', 'video');

CREATE TYPE proof_stage_enum    AS ENUM ('pre_shipment', 'post_received', 'pre_return', 'post_returned');
CREATE TYPE proof_type_enum     AS ENUM ('image', 'video');

CREATE TYPE dispute_status_type AS ENUM ('open', 'under_review', 'resolved', 'closed');
CREATE TYPE reporter_role_enum  AS ENUM ('renter', 'lender');
CREATE TYPE dispute_reason_enum AS ENUM (
    'device_not_as_described', 'device_faulty', 'missing_accessory',
    'device_damaged', 'component_replaced', 'other'
);
CREATE TYPE resolution_type_enum AS ENUM ('refund', 'deposit_deduct', 'compensation', 'account_ban', 'no_action');

CREATE TYPE review_target_type  AS ENUM ('gear', 'lender', 'renter');

CREATE TYPE membership_status_type AS ENUM ('active', 'expired', 'cancelled');

CREATE TYPE lender_wallet_status AS ENUM ('active', 'suspended', 'closed');
CREATE TYPE lender_tx_type      AS ENUM ('income', 'withdrawal', 'compensation', 'fee_deduction');

-- =============================================================
-- USERS
-- =============================================================

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) UNIQUE NOT NULL,
    phone           VARCHAR(20),
    password_hash   VARCHAR(255) NOT NULL,
    full_name       VARCHAR(255),
    cccd            VARCHAR(20),
    avatar_url      TEXT,
    bio             TEXT,
    rating          FLOAT DEFAULT 0,
    address         TEXT,
    total_reviews   INT DEFAULT 0,
    role            user_role NOT NULL DEFAULT 'renter',
    kyc_status      kyc_status_type NOT NULL DEFAULT 'pending',
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =============================================================
-- GEAR CATEGORIES
-- =============================================================

CREATE TABLE gear_categories (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id   UUID REFERENCES gear_categories(id) ON DELETE SET NULL,
    name        VARCHAR(255) NOT NULL,
    slug        VARCHAR(255) UNIQUE NOT NULL,
    description TEXT
);

-- =============================================================
-- GEARS
-- =============================================================

CREATE TABLE gears (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lender_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id         UUID REFERENCES gear_categories(id) ON DELETE SET NULL,
    name                VARCHAR(255) NOT NULL,
    brand               VARCHAR(100),
    model               VARCHAR(100),
    serial_number       VARCHAR(100),
    description         TEXT,
    specifications      JSONB,
    value               DECIMAL(15, 2),
    rent_price_per_day  DECIMAL(15, 2) NOT NULL,
    status              gear_status_type NOT NULL DEFAULT 'available',
    approval_status     approval_status_type NOT NULL DEFAULT 'pending',
    approved_by         UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at         TIMESTAMP,
    created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =============================================================
-- GEAR PRICE HISTORY
-- =============================================================

CREATE TABLE gear_price_history (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gear_id                 UUID NOT NULL REFERENCES gears(id) ON DELETE CASCADE,
    changed_by              UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    old_rent_price_per_day  DECIMAL(15, 2) NOT NULL,
    new_rent_price_per_day  DECIMAL(15, 2) NOT NULL,
    reason                  TEXT,
    changed_at              TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =============================================================
-- GEAR MEDIA
-- =============================================================

CREATE TABLE gear_media (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gear_id     UUID NOT NULL REFERENCES gears(id) ON DELETE CASCADE,
    type        VARCHAR(20) NOT NULL,   -- 'image' | 'video'
    url         TEXT NOT NULL,
    is_primary  BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order  INT NOT NULL DEFAULT 0
);

-- =============================================================
-- CREDIT PARTNERS
-- =============================================================

CREATE TABLE credit_partners (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          VARCHAR(255) NOT NULL,
    api_endpoint  TEXT,
    is_active     BOOLEAN NOT NULL DEFAULT TRUE
);

-- =============================================================
-- MUTUX WALLETS  (Ví Mutux – credit account)
-- =============================================================

CREATE TABLE mutux_wallets (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    credit_partner_id UUID REFERENCES credit_partners(id) ON DELETE SET NULL,
    total_limit       DECIMAL(15, 2) NOT NULL DEFAULT 0,
    display_balance   DECIMAL(15, 2) NOT NULL DEFAULT 0,
    locked_balance    DECIMAL(15, 2) NOT NULL DEFAULT 0,
    outstanding_debt  DECIMAL(15, 2) NOT NULL DEFAULT 0,
    status            wallet_status_type NOT NULL DEFAULT 'active',
    partner_ref_id    VARCHAR(255),
    approved_at       TIMESTAMP,
    expired_at        TIMESTAMP,
    updated_at        TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =============================================================
-- CREDIT TRANSACTIONS
-- =============================================================

CREATE TABLE credit_transactions (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mutux_wallet_id         UUID NOT NULL REFERENCES mutux_wallets(id) ON DELETE CASCADE,
    type                    credit_tx_type NOT NULL,
    amount                  DECIMAL(15, 2) NOT NULL,
    display_balance_before  DECIMAL(15, 2) NOT NULL,
    display_balance_after   DECIMAL(15, 2) NOT NULL,
    direction               credit_direction NOT NULL,
    ref_type                credit_ref_type,
    ref_id                  UUID,
    note                    TEXT,
    status                  credit_tx_status NOT NULL DEFAULT 'pending',
    created_at              TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =============================================================
-- RENTAL ORDERS
-- =============================================================

CREATE TABLE rental_orders (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_code                  VARCHAR(50) UNIQUE NOT NULL,
    renter_id                   UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    gear_id                     UUID NOT NULL REFERENCES gears(id) ON DELETE RESTRICT,
    lender_id                   UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    start_date                  DATE NOT NULL,
    end_date                    DATE NOT NULL,
    duration_days               INT NOT NULL,
    snapped_rent_price_per_day  DECIMAL(15, 2) NOT NULL,
    rental_fee                  DECIMAL(15, 2) NOT NULL,
    deposit_amount              DECIMAL(15, 2) NOT NULL,
    deposit_type                deposit_type_enum NOT NULL DEFAULT 'traditional',
    status                      order_status_type NOT NULL DEFAULT 'pending_confirm',
    shipping_address            TEXT,
    shipping_name               VARCHAR(255),
    shipping_phone              VARCHAR(20),
    lender_shipped_at           TIMESTAMP,
    renter_received_at          TIMESTAMP,
    renter_returned_at          TIMESTAMP,
    lender_received_back_at     TIMESTAMP,
    created_at                  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =============================================================
-- ESCROW WALLETS
-- =============================================================

CREATE TABLE escrow_wallets (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rental_order_id  UUID NOT NULL UNIQUE REFERENCES rental_orders(id) ON DELETE CASCADE,
    amount           DECIMAL(15, 2) NOT NULL,
    source           escrow_source_type NOT NULL,
    status           escrow_status_type NOT NULL DEFAULT 'locked',
    locked_at        TIMESTAMP NOT NULL DEFAULT NOW(),
    released_at      TIMESTAMP,
    updated_at       TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =============================================================
-- PAYMENTS
-- =============================================================

CREATE TABLE payments (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rental_order_id  UUID REFERENCES rental_orders(id) ON DELETE SET NULL,
    user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type             payment_type_enum NOT NULL,
    amount           DECIMAL(15, 2) NOT NULL,
    method           payment_method_enum NOT NULL,
    status           payment_status_enum NOT NULL DEFAULT 'pending',
    transaction_ref  VARCHAR(255),
    paid_at          TIMESTAMP,
    created_at       TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =============================================================
-- RENTAL PROOFS
-- =============================================================

CREATE TABLE rental_proofs (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rental_order_id  UUID NOT NULL REFERENCES rental_orders(id) ON DELETE CASCADE,
    uploaded_by      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stage            proof_stage_enum NOT NULL,
    proof_type       proof_type_enum NOT NULL,
    file_url         TEXT NOT NULL,
    note             TEXT,
    uploaded_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =============================================================
-- CONVERSATIONS
-- =============================================================

CREATE TABLE conversations (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rental_order_id  UUID REFERENCES rental_orders(id) ON DELETE SET NULL,
    renter_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lender_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    last_message_at  TIMESTAMP,
    created_at       TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =============================================================
-- MESSAGES
-- =============================================================

CREATE TABLE messages (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id  UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type             message_type_enum NOT NULL DEFAULT 'text',
    content          TEXT,
    media_url        TEXT,
    is_deleted       BOOLEAN NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =============================================================
-- DISPUTES
-- =============================================================

CREATE TABLE disputes (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rental_order_id  UUID NOT NULL REFERENCES rental_orders(id) ON DELETE CASCADE,
    reported_by      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reporter_role    reporter_role_enum NOT NULL,
    reason           dispute_reason_enum NOT NULL,
    description      TEXT,
    status           dispute_status_type NOT NULL DEFAULT 'open',
    resolved_by      UUID REFERENCES users(id) ON DELETE SET NULL,
    resolution_note  TEXT,
    resolution_type  resolution_type_enum,
    deduct_amount    DECIMAL(15, 2),
    created_at       TIMESTAMP NOT NULL DEFAULT NOW(),
    resolved_at      TIMESTAMP
);

-- =============================================================
-- DISPUTE EVIDENCES
-- =============================================================

CREATE TABLE dispute_evidences (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dispute_id   UUID NOT NULL REFERENCES disputes(id) ON DELETE CASCADE,
    uploaded_by  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    media_type   VARCHAR(20) NOT NULL,
    url          TEXT NOT NULL,
    uploaded_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =============================================================
-- REVIEWS
-- =============================================================

CREATE TABLE reviews (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rental_order_id  UUID NOT NULL REFERENCES rental_orders(id) ON DELETE CASCADE,
    reviewer_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_type      review_target_type NOT NULL,
    rating           INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment          TEXT,
    created_at       TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =============================================================
-- NOTIFICATIONS
-- =============================================================

CREATE TABLE notifications (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title       VARCHAR(255) NOT NULL,
    body        TEXT,
    type        VARCHAR(100),
    ref_type    VARCHAR(100),
    ref_id      UUID,
    is_read     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =============================================================
-- MEMBERSHIP PLANS  [POST-MVP – tạo sẵn bảng]
-- =============================================================

CREATE TABLE membership_plans (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                    VARCHAR(255) NOT NULL,
    price                   DECIMAL(15, 2) NOT NULL,
    duration_days           INT NOT NULL,
    rental_discount_rate    FLOAT NOT NULL DEFAULT 0,
    credit_fee_discount_rate FLOAT NOT NULL DEFAULT 0,
    priority_access         BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE user_memberships (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id     UUID NOT NULL REFERENCES membership_plans(id) ON DELETE RESTRICT,
    start_date  DATE NOT NULL,
    end_date    DATE NOT NULL,
    status      membership_status_type NOT NULL DEFAULT 'active',
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =============================================================
-- LENDER WALLETS
-- =============================================================

CREATE TABLE lender_wallets (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lender_id        UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    balance          DECIMAL(15, 2) NOT NULL DEFAULT 0,
    total_withdrawn  DECIMAL(15, 2) NOT NULL DEFAULT 0,
    status           lender_wallet_status NOT NULL DEFAULT 'active',
    created_at       TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE lender_wallet_transactions (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lender_wallet_id  UUID NOT NULL REFERENCES lender_wallets(id) ON DELETE CASCADE,
    rental_order_id   UUID REFERENCES rental_orders(id) ON DELETE SET NULL,
    type              lender_tx_type NOT NULL,
    amount            DECIMAL(15, 2) NOT NULL,
    balance_before    DECIMAL(15, 2) NOT NULL,
    balance_after     DECIMAL(15, 2) NOT NULL,
    note              TEXT,
    created_at        TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =============================================================
-- BANK ACCOUNTS
-- =============================================================

CREATE TABLE bank_accounts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bank_name       VARCHAR(255) NOT NULL,
    bank_code       VARCHAR(20),
    account_number  VARCHAR(50) NOT NULL,
    account_holder  VARCHAR(255) NOT NULL,
    is_default      BOOLEAN NOT NULL DEFAULT FALSE,
    is_verified     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =============================================================
-- INDEXES (performance)
-- =============================================================

CREATE INDEX idx_gears_lender_id         ON gears(lender_id);
CREATE INDEX idx_gears_category_id       ON gears(category_id);
CREATE INDEX idx_gears_status            ON gears(status);
CREATE INDEX idx_rental_orders_renter    ON rental_orders(renter_id);
CREATE INDEX idx_rental_orders_lender    ON rental_orders(lender_id);
CREATE INDEX idx_rental_orders_gear      ON rental_orders(gear_id);
CREATE INDEX idx_rental_orders_status    ON rental_orders(status);
CREATE INDEX idx_payments_order          ON payments(rental_order_id);
CREATE INDEX idx_messages_conversation   ON messages(conversation_id);
CREATE INDEX idx_notifications_user      ON notifications(user_id);
CREATE INDEX idx_credit_tx_wallet        ON credit_transactions(mutux_wallet_id);
CREATE INDEX idx_lender_tx_wallet        ON lender_wallet_transactions(lender_wallet_id);