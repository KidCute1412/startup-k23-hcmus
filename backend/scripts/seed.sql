-- =============================================================
-- KHÔNG XÀI CÁI NÀY
-- =============================================================

-- =============================================================
-- USERS  (5 lender + 5 renter + 1 admin = 11 users)
-- =============================================================

INSERT INTO users (id, email, phone, password_hash, full_name, cccd, rating, total_reviews, role, kyc_status, is_active) VALUES
-- Admins
('00000000-0000-0000-0000-000000000001', 'admin@mutux.vn',        '0900000001', '$2b$10$hashedpassword001', 'Admin Mutux',      '001099000001', 5.0, 0,  'admin',  'verified', TRUE),
-- Lenders
('00000000-0000-0000-0000-000000000002', 'lender1@gmail.com',     '0901000002', '$2b$10$hashedpassword002', 'Nguyễn Văn An',    '001099000002', 4.8, 12, 'lender', 'verified', TRUE),
('00000000-0000-0000-0000-000000000003', 'lender2@gmail.com',     '0901000003', '$2b$10$hashedpassword003', 'Trần Thị Bình',    '001099000003', 4.5, 8,  'lender', 'verified', TRUE),
('00000000-0000-0000-0000-000000000004', 'lender3@gmail.com',     '0901000004', '$2b$10$hashedpassword004', 'Lê Minh Cường',    '001099000004', 4.9, 20, 'lender', 'verified', TRUE),
('00000000-0000-0000-0000-000000000005', 'lender4@gmail.com',     '0901000005', '$2b$10$hashedpassword005', 'Phạm Thúy Dung',   '001099000005', 4.2, 5,  'lender', 'pending',  TRUE),
-- Renters
('00000000-0000-0000-0000-000000000006', 'renter1@gmail.com',     '0902000006', '$2b$10$hashedpassword006', 'Hoàng Đức Em',     '001099000006', 4.7, 3,  'renter', 'verified', TRUE),
('00000000-0000-0000-0000-000000000007', 'renter2@gmail.com',     '0902000007', '$2b$10$hashedpassword007', 'Vũ Lan Phương',    '001099000007', 4.3, 6,  'renter', 'verified', TRUE),
('00000000-0000-0000-0000-000000000008', 'renter3@gmail.com',     '0902000008', '$2b$10$hashedpassword008', 'Đặng Minh Giang',  '001099000008', 5.0, 1,  'renter', 'verified', TRUE),
('00000000-0000-0000-0000-000000000009', 'renter4@gmail.com',     '0902000009', '$2b$10$hashedpassword009', 'Bùi Thị Hoa',      '001099000009', 4.0, 4,  'renter', 'pending',  TRUE),
('00000000-0000-0000-0000-000000000010', 'renter5@gmail.com',     '0902000010', '$2b$10$hashedpassword010', 'Ngô Tuấn Kiệt',    '001099000010', 4.6, 7,  'renter', 'verified', TRUE);

-- =============================================================
-- CREDIT PARTNERS
-- =============================================================

INSERT INTO credit_partners (id, name, api_endpoint, is_active) VALUES
('10000000-0000-0000-0000-000000000001', 'Muadee Credit',   'https://api.muadee.vn/credit',   TRUE),
('10000000-0000-0000-0000-000000000002', 'VCredit Partner', 'https://api.vcredit.vn/v2',      TRUE);

-- =============================================================
-- GEAR CATEGORIES  (parent + children)
-- =============================================================

INSERT INTO gear_categories (id, parent_id, name, slug, description) VALUES
('20000000-0000-0000-0000-000000000001', NULL,                                         'Ngoại vi máy tính', 'ngoai-vi-may-tinh', 'Thiết bị ngoại vi gaming & văn phòng'),
('20000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001',        'Chuột gaming',      'chuot-gaming',      'Chuột có dây và không dây'),
('20000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001',        'Bàn phím cơ',       'ban-phim-co',       'Bàn phím cơ đủ loại switch'),
('20000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000001',        'Tai nghe gaming',   'tai-nghe-gaming',   'Tai nghe 7.1 surround'),
('20000000-0000-0000-0000-000000000005', NULL,                                         'Màn hình',          'man-hinh',          'Màn hình gaming và đồ họa'),
('20000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000005',        'Màn hình 144Hz+',   'man-hinh-144hz',    'Màn hình high refresh rate');

-- =============================================================
-- GEARS  (8 thiết bị thuộc nhiều lender)
-- =============================================================

INSERT INTO gears (id, lender_id, category_id, name, brand, model, serial_number, description, specifications, value, rent_price_per_day, status, approval_status, approved_by, approved_at) VALUES
('30000000-0000-0000-0000-000000000001',
 '00000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002',
 'Chuột Logitech G Pro X Superlight 2', 'Logitech', 'G Pro X Superlight 2', 'SN-GPXSL2-001',
 'Chuột gaming không dây siêu nhẹ 60g, sensor HERO 2 25K',
 '{"connectivity":"wireless","dpi_max":32000,"weight_g":60,"rgb":false,"color":"white"}',
 3500000, 60000, 'available', 'approved', '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '10 days'),

('30000000-0000-0000-0000-000000000002',
 '00000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000003',
 'Bàn phím Keychron Q1 Pro', 'Keychron', 'Q1 Pro', 'SN-KCQ1P-002',
 'Bàn phím cơ TKL không dây, switch QMX, gasket mount',
 '{"layout":"TKL","switch_type":"Gateron Jupiter Red","keycap_material":"PBT","backlight":"RGB","color":"carbon_black","cable_length_m":1.8}',
 4200000, 80000, 'available', 'approved', '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '8 days'),

('30000000-0000-0000-0000-000000000003',
 '00000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000004',
 'Tai nghe HyperX Cloud Alpha Wireless', 'HyperX', 'Cloud Alpha Wireless', 'SN-HXCAW-003',
 'Tai nghe gaming wireless 300h pin, driver 50mm',
 '{"connectivity":"wireless","driver_mm":50,"frequency_hz":"15-21000","microphone":true,"ear_cushion":"memory foam","color":"black/red"}',
 2800000, 55000, 'available', 'approved', '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '7 days'),

('30000000-0000-0000-0000-000000000004',
 '00000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000006',
 'Màn hình ASUS ROG Swift PG279QM', 'ASUS', 'PG279QM', 'SN-ASPG279-004',
 '27" IPS 2K 240Hz G-Sync, HDR600',
 '{"size_inch":27,"resolution":"2560x1440","refresh_hz":240,"panel":"IPS","hdr":"HDR600","sync":"G-Sync"}',
 12000000, 200000, 'available', 'approved', '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '5 days'),

('30000000-0000-0000-0000-000000000005',
 '00000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000002',
 'Chuột Razer DeathAdder V3 HyperSpeed', 'Razer', 'DeathAdder V3 HyperSpeed', 'SN-RZDAV3-005',
 'Chuột gaming không dây 63g, Focus Pro 30K',
 '{"connectivity":"wireless","dpi_max":30000,"weight_g":63,"rgb":false,"color":"black"}',
 2200000, 45000, 'available', 'approved', '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '4 days'),

('30000000-0000-0000-0000-000000000006',
 '00000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000003',
 'Bàn phím AKKO 3068B Plus', 'AKKO', '3068B Plus', 'SN-AK3068B-006',
 'Bàn phím cơ compact bluetooth/2.4G, switch CS Ocean Blue',
 '{"layout":"65%","switch_type":"AKKO CS Ocean Blue","keycap_material":"PBT","backlight":"RGB","color":"blue","cable_length_m":1.5}',
 1500000, 35000, 'rented', 'approved', '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '3 days'),

('30000000-0000-0000-0000-000000000007',
 '00000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000004',
 'Tai nghe Sony WH-1000XM5', 'Sony', 'WH-1000XM5', 'SN-SNWH1000-007',
 'Tai nghe chống ồn ANC flagship, 30h pin',
 '{"connectivity":"wireless","driver_mm":40,"frequency_hz":"4-40000","microphone":true,"anc":true,"color":"black"}',
 8000000, 120000, 'available', 'approved', '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '2 days'),

('30000000-0000-0000-0000-000000000008',
 '00000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000006',
 'Màn hình LG UltraGear 27GR95QE', 'LG', '27GR95QE', 'SN-LGUG27-008',
 '27" OLED 2K 240Hz, 0.03ms response time',
 '{"size_inch":27,"resolution":"2560x1440","refresh_hz":240,"panel":"OLED","response_ms":0.03}',
 15000000, 250000, 'available', 'pending', NULL, NULL);

-- =============================================================
-- GEAR MEDIA
-- =============================================================

INSERT INTO gear_media (id, gear_id, type, url, is_primary, sort_order) VALUES
('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'image', 'https://cdn.mutux.vn/gear/gpxsl2-main.jpg',    TRUE,  1),
('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', 'image', 'https://cdn.mutux.vn/gear/gpxsl2-side.jpg',     FALSE, 2),
('40000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000002', 'image', 'https://cdn.mutux.vn/gear/kcq1pro-main.jpg',    TRUE,  1),
('40000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000003', 'image', 'https://cdn.mutux.vn/gear/hxcaw-main.jpg',      TRUE,  1),
('40000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000004', 'image', 'https://cdn.mutux.vn/gear/pg279qm-main.jpg',    TRUE,  1),
('40000000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000004', 'video', 'https://cdn.mutux.vn/gear/pg279qm-review.mp4',  FALSE, 2);

-- =============================================================
-- MUTUX WALLETS
-- =============================================================

INSERT INTO mutux_wallets (id, user_id, credit_partner_id, total_limit, display_balance, locked_balance, outstanding_debt, status, partner_ref_id, approved_at, expired_at) VALUES
('50000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000001', 5000000, 4500000, 500000, 0,       'active', 'MCC-R001', NOW() - INTERVAL '30 days', NOW() + INTERVAL '335 days'),
('50000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000001', 3000000, 3000000, 0,       0,       'active', 'MCC-R002', NOW() - INTERVAL '20 days', NOW() + INTERVAL '345 days'),
('50000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000002', 8000000, 7000000, 1000000, 0,       'active', 'VCP-R001', NOW() - INTERVAL '15 days', NOW() + INTERVAL '350 days'),
('50000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000002', 2000000, 2000000, 0,       500000,  'active', 'VCP-R002', NOW() - INTERVAL '60 days', NOW() + INTERVAL '305 days');

-- =============================================================
-- LENDER WALLETS
-- =============================================================

INSERT INTO lender_wallets (id, lender_id, balance, total_withdrawn, status) VALUES
('60000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 1500000, 5000000, 'active'),
('60000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 800000,  2000000, 'active'),
('60000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004', 2200000, 3500000, 'active'),
('60000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000005', 0,       0,       'active');

-- =============================================================
-- BANK ACCOUNTS
-- =============================================================

INSERT INTO bank_accounts (id, user_id, bank_name, bank_code, account_number, account_holder, is_default, is_verified) VALUES
('70000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Vietcombank', 'VCB', '0071000123456', 'NGUYEN VAN AN',   TRUE,  TRUE),
('70000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 'Techcombank',  'TCB', '9021000234567', 'TRAN THI BINH',   TRUE,  TRUE),
('70000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004', 'MB Bank',      'MB',  '0391000345678', 'LE MINH CUONG',   TRUE,  TRUE),
('70000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000006', 'VPBank',       'VPB', '2691000456789', 'HOANG DUC EM',    TRUE,  FALSE);

-- =============================================================
-- RENTAL ORDERS  (6 đơn hàng với trạng thái đa dạng)
-- =============================================================

INSERT INTO rental_orders (id, order_code, renter_id, gear_id, lender_id, start_date, end_date, duration_days, snapped_rent_price_per_day, rental_fee, deposit_amount, deposit_type, status, shipping_address, shipping_name, shipping_phone, lender_shipped_at, renter_received_at, renter_returned_at, lender_received_back_at) VALUES
-- Đơn hoàn thành
('80000000-0000-0000-0000-000000000001',
 'MX-2024-0001', '00000000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003',
 NOW()::date - 20, NOW()::date - 14, 6,
 55000, 330000, 500000, 'traditional', 'completed',
 '123 Lê Lợi, Q1, TP.HCM', 'Hoàng Đức Em', '0902000006',
 NOW() - INTERVAL '19 days', NOW() - INTERVAL '18 days', NOW() - INTERVAL '15 days', NOW() - INTERVAL '14 days'),

-- Đơn đang active
('80000000-0000-0000-0000-000000000002',
 'MX-2024-0002', '00000000-0000-0000-0000-000000000007', '30000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000004',
 NOW()::date - 3, NOW()::date + 4, 7,
 35000, 245000, 300000, 'credit_line', 'active',
 '45 Nguyễn Huệ, Q1, TP.HCM', 'Vũ Lan Phương', '0902000007',
 NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day', NULL, NULL),

-- Đơn đang giao hàng
('80000000-0000-0000-0000-000000000003',
 'MX-2024-0003', '00000000-0000-0000-0000-000000000008', '30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002',
 NOW()::date + 1, NOW()::date + 5, 4,
 60000, 240000, 500000, 'traditional', 'delivering',
 '78 Trần Hưng Đạo, Q5, TP.HCM', 'Đặng Minh Giang', '0902000008',
 NOW() - INTERVAL '3 hours', NULL, NULL, NULL),

-- Đơn chờ xác nhận
('80000000-0000-0000-0000-000000000004',
 'MX-2024-0004', '00000000-0000-0000-0000-000000000010', '30000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000003',
 NOW()::date + 2, NOW()::date + 9, 7,
 200000, 1400000, 2000000, 'traditional', 'pending_confirm',
 '12 Đinh Tiên Hoàng, Q Bình Thạnh, TP.HCM', 'Ngô Tuấn Kiệt', '0902000010',
 NULL, NULL, NULL, NULL),

-- Đơn tranh chấp
('80000000-0000-0000-0000-000000000005',
 'MX-2024-0005', '00000000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002',
 NOW()::date - 15, NOW()::date - 8, 7,
 80000, 560000, 1000000, 'traditional', 'disputed',
 '99 Phan Xích Long, Q Phú Nhuận, TP.HCM', 'Hoàng Đức Em', '0902000006',
 NOW() - INTERVAL '14 days', NOW() - INTERVAL '13 days', NOW() - INTERVAL '9 days', NOW() - INTERVAL '8 days'),

-- Đơn đã hủy
('80000000-0000-0000-0000-000000000006',
 'MX-2024-0006', '00000000-0000-0000-0000-000000000009', '30000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000002',
 NOW()::date + 5, NOW()::date + 10, 5,
 120000, 600000, 1500000, 'credit_line', 'cancelled',
 '55 Cách Mạng Tháng 8, Q3, TP.HCM', 'Bùi Thị Hoa', '0902000009',
 NULL, NULL, NULL, NULL);

-- =============================================================
-- ESCROW WALLETS
-- =============================================================

INSERT INTO escrow_wallets (id, rental_order_id, amount, source, status, locked_at, released_at) VALUES
('90000000-0000-0000-0000-000000000001', '80000000-0000-0000-0000-000000000001', 500000,  'renter_cash',  'released',    NOW() - INTERVAL '19 days', NOW() - INTERVAL '14 days'),
('90000000-0000-0000-0000-000000000002', '80000000-0000-0000-0000-000000000002', 300000,  'credit_line',  'locked',      NOW() - INTERVAL '2 days',  NULL),
('90000000-0000-0000-0000-000000000003', '80000000-0000-0000-0000-000000000003', 500000,  'renter_cash',  'locked',      NOW() - INTERVAL '3 hours', NULL),
('90000000-0000-0000-0000-000000000004', '80000000-0000-0000-0000-000000000004', 2000000, 'renter_cash',  'locked',      NOW(),                      NULL),
('90000000-0000-0000-0000-000000000005', '80000000-0000-0000-0000-000000000005', 1000000, 'renter_cash',  'compensated', NOW() - INTERVAL '14 days', NOW() - INTERVAL '5 days'),
('90000000-0000-0000-0000-000000000006', '80000000-0000-0000-0000-000000000006', 1500000, 'credit_line',  'released',    NOW() - INTERVAL '1 day',   NOW() - INTERVAL '1 day');

-- =============================================================
-- PAYMENTS
-- =============================================================

INSERT INTO payments (id, rental_order_id, user_id, type, amount, method, status, transaction_ref, paid_at) VALUES
-- Order 1: phí thuê + cọc → hoàn thành
('A0000000-0000-0000-0000-000000000001', '80000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000006', 'deposit',    500000,  'momo',          'success', 'MOMO-D001-001', NOW() - INTERVAL '19 days'),
('A0000000-0000-0000-0000-000000000002', '80000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000006', 'rental_fee', 330000,  'momo',          'success', 'MOMO-F001-001', NOW() - INTERVAL '19 days'),
-- Order 2: credit_line
('A0000000-0000-0000-0000-000000000003', '80000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000007', 'deposit',    300000,  'credit_line',   'success', 'CL-D001-002',   NOW() - INTERVAL '2 days'),
('A0000000-0000-0000-0000-000000000004', '80000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000007', 'rental_fee', 245000,  'credit_line',   'success', 'CL-F001-002',   NOW() - INTERVAL '2 days'),
-- Order 3: bank transfer
('A0000000-0000-0000-0000-000000000005', '80000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000008', 'deposit',    500000,  'bank_transfer', 'success', 'BT-D001-003',   NOW() - INTERVAL '4 hours'),
('A0000000-0000-0000-0000-000000000006', '80000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000008', 'rental_fee', 240000,  'bank_transfer', 'success', 'BT-F001-003',   NOW() - INTERVAL '4 hours'),
-- Order 5 (disputed): phí thuê đã thu, escrow bị deduct
('A0000000-0000-0000-0000-000000000007', '80000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000006', 'deposit',    1000000, 'vnpay',         'success', 'VP-D001-005',   NOW() - INTERVAL '14 days'),
('A0000000-0000-0000-0000-000000000008', '80000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000006', 'rental_fee', 560000,  'vnpay',         'success', 'VP-F001-005',   NOW() - INTERVAL '14 days');

-- =============================================================
-- RENTAL PROOFS
-- =============================================================

INSERT INTO rental_proofs (id, rental_order_id, uploaded_by, stage, proof_type, file_url, note) VALUES
-- Order 1 (completed) – 4 stages
('B0000000-0000-0000-0000-000000000001', '80000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'pre_shipment',  'image', 'https://cdn.mutux.vn/proof/o1-pre-ship.jpg',   'Máy đầy đủ phụ kiện, không trầy xước'),
('B0000000-0000-0000-0000-000000000002', '80000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000006', 'post_received', 'image', 'https://cdn.mutux.vn/proof/o1-post-recv.jpg',  'Nhận hàng ok, hộp nguyên seal'),
('B0000000-0000-0000-0000-000000000003', '80000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000006', 'pre_return',    'video', 'https://cdn.mutux.vn/proof/o1-pre-ret.mp4',    'Trả hàng nguyên vẹn'),
('B0000000-0000-0000-0000-000000000004', '80000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'post_returned', 'image', 'https://cdn.mutux.vn/proof/o1-post-ret.jpg',   'Nhận lại ok'),
-- Order 2 (active) – lender đã giao
('B0000000-0000-0000-0000-000000000005', '80000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000004', 'pre_shipment',  'image', 'https://cdn.mutux.vn/proof/o2-pre-ship.jpg',   'Bàn phím sạch sẽ'),
('B0000000-0000-0000-0000-000000000006', '80000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000007', 'post_received', 'image', 'https://cdn.mutux.vn/proof/o2-post-recv.jpg',  'Nhận đúng hàng'),
-- Order 5 (disputed) – đủ 4 stages
('B0000000-0000-0000-0000-000000000007', '80000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000002', 'pre_shipment',  'image', 'https://cdn.mutux.vn/proof/o5-pre-ship.jpg',   NULL),
('B0000000-0000-0000-0000-000000000008', '80000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000006', 'post_received', 'image', 'https://cdn.mutux.vn/proof/o5-post-recv.jpg',  NULL),
('B0000000-0000-0000-0000-000000000009', '80000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000006', 'pre_return',    'video', 'https://cdn.mutux.vn/proof/o5-pre-ret.mp4',    'Phím space bar bị vỡ clip mount'),
('B0000000-0000-0000-0000-000000000010', '80000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000002', 'post_returned', 'image', 'https://cdn.mutux.vn/proof/o5-post-ret.jpg',   'Xác nhận hư hỏng');

-- =============================================================
-- CONVERSATIONS + MESSAGES
-- =============================================================

INSERT INTO conversations (id, rental_order_id, renter_id, lender_id, last_message_at) VALUES
('C0000000-0000-0000-0000-000000000001', '80000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000003', NOW() - INTERVAL '14 days'),
('C0000000-0000-0000-0000-000000000002', '80000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000004', NOW() - INTERVAL '1 day'),
('C0000000-0000-0000-0000-000000000003', '80000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000002', NOW() - INTERVAL '8 days');

INSERT INTO messages (id, conversation_id, sender_id, type, content) VALUES
('D0000000-0000-0000-0000-000000000001', 'C0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000006', 'text', 'Bạn ơi, tai nghe còn dây đi kèm không?'),
('D0000000-0000-0000-0000-000000000002', 'C0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'text', 'Còn đầy đủ nhé, có cả túi đựng.'),
('D0000000-0000-0000-0000-000000000003', 'C0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000007', 'text', 'Bàn phím giao bằng Giao Hàng Nhanh được không?'),
('D0000000-0000-0000-0000-000000000004', 'C0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000004', 'text', 'Được nha, mình sẽ đóng gói cẩn thận.'),
('D0000000-0000-0000-0000-000000000005', 'C0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000006', 'text', 'Phím space bị hỏng rồi, bạn xem video proof mình gửi nhé.'),
('D0000000-0000-0000-0000-000000000006', 'C0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', 'text', 'Mình đã nhận lại máy rồi, sẽ mở dispute.');

-- =============================================================
-- DISPUTES + EVIDENCES
-- =============================================================

INSERT INTO disputes (id, rental_order_id, reported_by, reporter_role, reason, description, status, resolved_by, resolution_note, resolution_type, deduct_amount, resolved_at) VALUES
('E0000000-0000-0000-0000-000000000001',
 '80000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000002', 'lender',
 'device_damaged',
 'Phím Space bar bị vỡ clip mount khi trả lại, video rõ ràng. Yêu cầu bồi thường 200,000đ.',
 'resolved', '00000000-0000-0000-0000-000000000001',
 'Đã xem xét proof đủ 4 stages và video renter. Trừ 200,000đ từ cọc bồi thường cho lender.',
 'deposit_deduct', 200000, NOW() - INTERVAL '5 days');

INSERT INTO dispute_evidences (id, dispute_id, uploaded_by, media_type, url) VALUES
('F0000000-0000-0000-0000-000000000001', 'E0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'image', 'https://cdn.mutux.vn/dispute/d1-evidence-1.jpg'),
('F0000000-0000-0000-0000-000000000002', 'E0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'video', 'https://cdn.mutux.vn/dispute/d1-evidence-2.mp4'),
('F0000000-0000-0000-0000-000000000003', 'E0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000006', 'image', 'https://cdn.mutux.vn/dispute/d1-counter-1.jpg');

-- =============================================================
-- REVIEWS
-- =============================================================

INSERT INTO reviews (id, rental_order_id, reviewer_id, target_id, target_type, rating, comment) VALUES
-- Order 1: renter review lender + gear; lender review renter
('a1000000-0000-0000-0000-000000000001', '80000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000003', 'lender', 5, 'Lender rất nhiệt tình, giao hàng nhanh và đóng gói cẩn thận!'),
('a1000000-0000-0000-0000-000000000002', '80000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000006', 'renter', 5, 'Renter hoàn trả đúng hạn, hàng nguyên vẹn. Sẽ cho thuê tiếp.'),
-- Order 2 (active – chưa có review)
-- Order 5 (disputed – renter review gear)
('a1000000-0000-0000-0000-000000000003', '80000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000002', 'lender', 2, 'Bàn phím không như mô tả, phím space mount bị yếu sẵn.');

-- =============================================================
-- CREDIT TRANSACTIONS
-- =============================================================

INSERT INTO credit_transactions (id, mutux_wallet_id, type, amount, display_balance_before, display_balance_after, direction, ref_type, ref_id, note, status) VALUES
('a2000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 'limit_granted',      5000000, 0,       5000000, 'in',  NULL,           NULL,                                          'Cấp hạn mức lần đầu',               'success'),
('a2000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000001', 'deposit_lock',        500000,  5000000, 4500000, 'out', 'rental_order', '80000000-0000-0000-0000-000000000002',        'Khoá cọc đơn MX-2024-0002',          'success'),
('a2000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000002', 'limit_granted',      3000000, 0,       3000000, 'in',  NULL,           NULL,                                          'Cấp hạn mức lần đầu',               'success'),
('a2000000-0000-0000-0000-000000000004', '50000000-0000-0000-0000-000000000003', 'limit_granted',      8000000, 0,       8000000, 'in',  NULL,           NULL,                                          'Cấp hạn mức lần đầu',               'success'),
('a2000000-0000-0000-0000-000000000005', '50000000-0000-0000-0000-000000000003', 'deposit_lock',       1000000, 8000000, 7000000, 'out', 'rental_order', '80000000-0000-0000-0000-000000000003',        'Khoá cọc đơn MX-2024-0003',          'success');

-- =============================================================
-- LENDER WALLET TRANSACTIONS
-- =============================================================

INSERT INTO lender_wallet_transactions (id, lender_wallet_id, rental_order_id, type, amount, balance_before, balance_after, note) VALUES
('a3000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000002', '80000000-0000-0000-0000-000000000001', 'income',       280500, 0,        280500,  'Thu nhập đơn MX-2024-0001 (sau phí 15%)'),
('a3000000-0000-0000-0000-000000000002', '60000000-0000-0000-0000-000000000002', NULL,                                   'withdrawal',   280500, 280500,  0,       'Rút về tài khoản Techcombank'),
('a3000000-0000-0000-0000-000000000003', '60000000-0000-0000-0000-000000000001', '80000000-0000-0000-0000-000000000005', 'income',       476000, 1023500, 1499500, 'Thu nhập đơn MX-2024-0005 (sau phí 15%)'),
('a3000000-0000-0000-0000-000000000004', '60000000-0000-0000-0000-000000000001', '80000000-0000-0000-0000-000000000005', 'compensation', 200000, 1499500, 1699500, 'Bồi thường dispute D001 – trừ cọc renter'),
('a3000000-0000-0000-0000-000000000005', '60000000-0000-0000-0000-000000000001', NULL,                                   'withdrawal',   199500, 1699500, 1500000, 'Rút một phần về Vietcombank');

-- =============================================================
-- NOTIFICATIONS
-- =============================================================

INSERT INTO notifications (id, user_id, title, body, type, ref_type, ref_id, is_read) VALUES
('a4000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000006', 'Đơn thuê đã hoàn thành',      'Đơn MX-2024-0001 đã hoàn thành. Cảm ơn bạn!',          'order',   'rental_order', '80000000-0000-0000-0000-000000000001', TRUE),
('a4000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 'Lender nhận lại hàng',        'Bạn đã xác nhận nhận lại tai nghe từ đơn MX-2024-0001.','order',   'rental_order', '80000000-0000-0000-0000-000000000001', TRUE),
('a4000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000007', 'Đơn hàng đang giao',          'Bàn phím đang được giao cho bạn – MX-2024-0002.',       'order',   'rental_order', '80000000-0000-0000-0000-000000000002', FALSE),
('a4000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000010', 'Đơn chờ xác nhận',           'Lender đang xem xét đơn MX-2024-0004 của bạn.',         'order',   'rental_order', '80000000-0000-0000-0000-000000000004', FALSE),
('a4000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000006', 'Tranh chấp đã được giải quyết','Dispute đơn MX-2024-0005 đã xử lý. Trừ cọc 200,000đ.', 'dispute', 'rental_order', '80000000-0000-0000-0000-000000000005', FALSE),
('a4000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000002', 'Bồi thường đã được cộng',    'Bạn nhận được 200,000đ bồi thường vào ví lender.',      'dispute', 'rental_order', '80000000-0000-0000-0000-000000000005', TRUE),
('a4000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000008', 'Đơn đang vận chuyển',        'Lender đã giao hàng. Vui lòng theo dõi MX-2024-0003.',  'order',   'rental_order', '80000000-0000-0000-0000-000000000003', FALSE);

-- =============================================================
-- MEMBERSHIP PLANS  (seed sẵn để dùng post-MVP)
-- =============================================================

INSERT INTO membership_plans (id, name, price, duration_days, rental_discount_rate, credit_fee_discount_rate, priority_access) VALUES
('a5000000-0000-0000-0000-000000000001', 'Basic',   99000,  30, 0.05, 0.00, FALSE),
('a5000000-0000-0000-0000-000000000002', 'Pro',    299000,  30, 0.10, 0.05, TRUE),
('a5000000-0000-0000-0000-000000000003', 'Annual', 999000, 365, 0.15, 0.10, TRUE);

-- =============================================================
-- GEAR PRICE HISTORY
-- =============================================================

INSERT INTO gear_price_history (id, gear_id, changed_by, old_rent_price_per_day, new_rent_price_per_day, reason) VALUES
('a6000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 70000, 60000, 'Giảm giá khuyến mãi ra mắt'),
('a6000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000003', 180000, 200000, 'Tăng giá theo thị trường');