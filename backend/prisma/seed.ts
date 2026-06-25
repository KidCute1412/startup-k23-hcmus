import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

// --------------- helpers ---------------
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000)
const daysFromNow = (n: number) => new Date(Date.now() + n * 86_400_000)
const hoursAgo = (n: number) => new Date(Date.now() - n * 3_600_000)
const today = () => new Date(new Date().toISOString().slice(0, 10))
const dateOffset = (offsetDays: number) => {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return new Date(d.toISOString().slice(0, 10))
}

async function main() {
  console.log('🌱 Seeding Mutux MVP database…')

  // =============================================================
  // USERS
  // =============================================================
  await prisma.user.createMany({
    data: [
      // Admin
      {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'admin@mutux.vn',
        phone: '0900000001',
        password_hash: '$2b$10$hashedpassword001',
        full_name: 'Admin Mutux',
        cccd: '001099000001',
        rating: 5.0,
        total_reviews: 0,
        role: 'admin',
        kyc_status: 'verified',
        is_active: true,
      },
      // Lenders
      {
        id: '00000000-0000-0000-0000-000000000002',
        email: 'lender1@gmail.com',
        phone: '0901000002',
        password_hash: '$2b$10$hashedpassword002',
        full_name: 'Nguyễn Văn An',
        cccd: '001099000002',
        rating: 4.8,
        total_reviews: 12,
        role: 'lender',
        kyc_status: 'verified',
        is_active: true,
      },
      {
        id: '00000000-0000-0000-0000-000000000003',
        email: 'lender2@gmail.com',
        phone: '0901000003',
        password_hash: '$2b$10$hashedpassword003',
        full_name: 'Trần Thị Bình',
        cccd: '001099000003',
        rating: 4.5,
        total_reviews: 8,
        role: 'lender',
        kyc_status: 'verified',
        is_active: true,
      },
      {
        id: '00000000-0000-0000-0000-000000000004',
        email: 'lender3@gmail.com',
        phone: '0901000004',
        password_hash: '$2b$10$hashedpassword004',
        full_name: 'Lê Minh Cường',
        cccd: '001099000004',
        rating: 4.9,
        total_reviews: 20,
        role: 'lender',
        kyc_status: 'verified',
        is_active: true,
      },
      {
        id: '00000000-0000-0000-0000-000000000005',
        email: 'lender4@gmail.com',
        phone: '0901000005',
        password_hash: '$2b$10$hashedpassword005',
        full_name: 'Phạm Thúy Dung',
        cccd: '001099000005',
        rating: 4.2,
        total_reviews: 5,
        role: 'lender',
        kyc_status: 'pending',
        is_active: true,
      },
      // Renters
      {
        id: '00000000-0000-0000-0000-000000000006',
        email: 'renter1@gmail.com',
        phone: '0902000006',
        password_hash: '$2b$10$hashedpassword006',
        full_name: 'Hoàng Đức Em',
        cccd: '001099000006',
        rating: 4.7,
        total_reviews: 3,
        role: 'renter',
        kyc_status: 'verified',
        is_active: true,
      },
      {
        id: '00000000-0000-0000-0000-000000000007',
        email: 'renter2@gmail.com',
        phone: '0902000007',
        password_hash: '$2b$10$hashedpassword007',
        full_name: 'Vũ Lan Phương',
        cccd: '001099000007',
        rating: 4.3,
        total_reviews: 6,
        role: 'renter',
        kyc_status: 'verified',
        is_active: true,
      },
      {
        id: '00000000-0000-0000-0000-000000000008',
        email: 'renter3@gmail.com',
        phone: '0902000008',
        password_hash: '$2b$10$hashedpassword008',
        full_name: 'Đặng Minh Giang',
        cccd: '001099000008',
        rating: 5.0,
        total_reviews: 1,
        role: 'renter',
        kyc_status: 'verified',
        is_active: true,
      },
      {
        id: '00000000-0000-0000-0000-000000000009',
        email: 'renter4@gmail.com',
        phone: '0902000009',
        password_hash: '$2b$10$hashedpassword009',
        full_name: 'Bùi Thị Hoa',
        cccd: '001099000009',
        rating: 4.0,
        total_reviews: 4,
        role: 'renter',
        kyc_status: 'pending',
        is_active: true,
      },
      {
        id: '00000000-0000-0000-0000-000000000010',
        email: 'renter5@gmail.com',
        phone: '0902000010',
        password_hash: '$2b$10$hashedpassword010',
        full_name: 'Ngô Tuấn Kiệt',
        cccd: '001099000010',
        rating: 4.6,
        total_reviews: 7,
        role: 'renter',
        kyc_status: 'verified',
        is_active: true,
      },
    ],
    skipDuplicates: true,
  })
  console.log('✅ Users')

  // =============================================================
  // CREDIT PARTNERS
  // =============================================================
  await prisma.creditPartner.createMany({
    data: [
      {
        id: '10000000-0000-0000-0000-000000000001',
        name: 'Muadee Credit',
        api_endpoint: 'https://api.muadee.vn/credit',
        is_active: true,
      },
      {
        id: '10000000-0000-0000-0000-000000000002',
        name: 'VCredit Partner',
        api_endpoint: 'https://api.vcredit.vn/v2',
        is_active: true,
      },
    ],
    skipDuplicates: true,
  })
  console.log('✅ Credit Partners')

  // =============================================================
  // GEAR CATEGORIES
  // =============================================================
  // Insert parent categories first, then children
  await prisma.gearCategory.createMany({
    data: [
      {
        id: '20000000-0000-0000-0000-000000000001',
        parent_id: null,
        name: 'Ngoại vi máy tính',
        slug: 'ngoai-vi-may-tinh',
        description: 'Thiết bị ngoại vi gaming & văn phòng',
      },
      {
        id: '20000000-0000-0000-0000-000000000005',
        parent_id: null,
        name: 'Màn hình',
        slug: 'man-hinh',
        description: 'Màn hình gaming và đồ họa',
      },
    ],
    skipDuplicates: true,
  })
  await prisma.gearCategory.createMany({
    data: [
      {
        id: '20000000-0000-0000-0000-000000000002',
        parent_id: '20000000-0000-0000-0000-000000000001',
        name: 'Chuột gaming',
        slug: 'chuot-gaming',
        description: 'Chuột có dây và không dây',
      },
      {
        id: '20000000-0000-0000-0000-000000000003',
        parent_id: '20000000-0000-0000-0000-000000000001',
        name: 'Bàn phím cơ',
        slug: 'ban-phim-co',
        description: 'Bàn phím cơ đủ loại switch',
      },
      {
        id: '20000000-0000-0000-0000-000000000004',
        parent_id: '20000000-0000-0000-0000-000000000001',
        name: 'Tai nghe gaming',
        slug: 'tai-nghe-gaming',
        description: 'Tai nghe 7.1 surround',
      },
      {
        id: '20000000-0000-0000-0000-000000000006',
        parent_id: '20000000-0000-0000-0000-000000000005',
        name: 'Màn hình 144Hz+',
        slug: 'man-hinh-144hz',
        description: 'Màn hình high refresh rate',
      },
    ],
    skipDuplicates: true,
  })
  console.log('✅ Gear Categories')

  // =============================================================
  // GEARS
  // =============================================================
  await prisma.gear.createMany({
    data: [
      {
        id: '30000000-0000-0000-0000-000000000001',
        lender_id: '00000000-0000-0000-0000-000000000002',
        category_id: '20000000-0000-0000-0000-000000000002',
        name: 'Chuột Logitech G Pro X Superlight 2',
        brand: 'Logitech',
        model: 'G Pro X Superlight 2',
        serial_number: 'SN-GPXSL2-001',
        description: 'Chuột gaming không dây siêu nhẹ 60g, sensor HERO 2 25K',
        specifications: { connectivity: 'wireless', dpi_max: 32000, weight_g: 60, rgb: false, color: 'white' },
        value: 3500000,
        rent_price_per_day: 60000,
        status: 'available',
        approval_status: 'approved',
        approved_by: '00000000-0000-0000-0000-000000000001',
        approved_at: daysAgo(10),
      },
      {
        id: '30000000-0000-0000-0000-000000000002',
        lender_id: '00000000-0000-0000-0000-000000000002',
        category_id: '20000000-0000-0000-0000-000000000003',
        name: 'Bàn phím Keychron Q1 Pro',
        brand: 'Keychron',
        model: 'Q1 Pro',
        serial_number: 'SN-KCQ1P-002',
        description: 'Bàn phím cơ TKL không dây, switch QMX, gasket mount',
        specifications: { layout: 'TKL', switch_type: 'Gateron Jupiter Red', keycap_material: 'PBT', backlight: 'RGB', color: 'carbon_black', cable_length_m: 1.8 },
        value: 4200000,
        rent_price_per_day: 80000,
        status: 'available',
        approval_status: 'approved',
        approved_by: '00000000-0000-0000-0000-000000000001',
        approved_at: daysAgo(8),
      },
      {
        id: '30000000-0000-0000-0000-000000000003',
        lender_id: '00000000-0000-0000-0000-000000000003',
        category_id: '20000000-0000-0000-0000-000000000004',
        name: 'Tai nghe HyperX Cloud Alpha Wireless',
        brand: 'HyperX',
        model: 'Cloud Alpha Wireless',
        serial_number: 'SN-HXCAW-003',
        description: 'Tai nghe gaming wireless 300h pin, driver 50mm',
        specifications: { connectivity: 'wireless', driver_mm: 50, frequency_hz: '15-21000', microphone: true, ear_cushion: 'memory foam', color: 'black/red' },
        value: 2800000,
        rent_price_per_day: 55000,
        status: 'available',
        approval_status: 'approved',
        approved_by: '00000000-0000-0000-0000-000000000001',
        approved_at: daysAgo(7),
      },
      {
        id: '30000000-0000-0000-0000-000000000004',
        lender_id: '00000000-0000-0000-0000-000000000003',
        category_id: '20000000-0000-0000-0000-000000000006',
        name: 'Màn hình ASUS ROG Swift PG279QM',
        brand: 'ASUS',
        model: 'PG279QM',
        serial_number: 'SN-ASPG279-004',
        description: '27" IPS 2K 240Hz G-Sync, HDR600',
        specifications: { size_inch: 27, resolution: '2560x1440', refresh_hz: 240, panel: 'IPS', hdr: 'HDR600', sync: 'G-Sync' },
        value: 12000000,
        rent_price_per_day: 200000,
        status: 'available',
        approval_status: 'approved',
        approved_by: '00000000-0000-0000-0000-000000000001',
        approved_at: daysAgo(5),
      },
      {
        id: '30000000-0000-0000-0000-000000000005',
        lender_id: '00000000-0000-0000-0000-000000000004',
        category_id: '20000000-0000-0000-0000-000000000002',
        name: 'Chuột Razer DeathAdder V3 HyperSpeed',
        brand: 'Razer',
        model: 'DeathAdder V3 HyperSpeed',
        serial_number: 'SN-RZDAV3-005',
        description: 'Chuột gaming không dây 63g, Focus Pro 30K',
        specifications: { connectivity: 'wireless', dpi_max: 30000, weight_g: 63, rgb: false, color: 'black' },
        value: 2200000,
        rent_price_per_day: 45000,
        status: 'available',
        approval_status: 'approved',
        approved_by: '00000000-0000-0000-0000-000000000001',
        approved_at: daysAgo(4),
      },
      {
        id: '30000000-0000-0000-0000-000000000006',
        lender_id: '00000000-0000-0000-0000-000000000004',
        category_id: '20000000-0000-0000-0000-000000000003',
        name: 'Bàn phím AKKO 3068B Plus',
        brand: 'AKKO',
        model: '3068B Plus',
        serial_number: 'SN-AK3068B-006',
        description: 'Bàn phím cơ compact bluetooth/2.4G, switch CS Ocean Blue',
        specifications: { layout: '65%', switch_type: 'AKKO CS Ocean Blue', keycap_material: 'PBT', backlight: 'RGB', color: 'blue', cable_length_m: 1.5 },
        value: 1500000,
        rent_price_per_day: 35000,
        status: 'rented',
        approval_status: 'approved',
        approved_by: '00000000-0000-0000-0000-000000000001',
        approved_at: daysAgo(3),
      },
      {
        id: '30000000-0000-0000-0000-000000000007',
        lender_id: '00000000-0000-0000-0000-000000000002',
        category_id: '20000000-0000-0000-0000-000000000004',
        name: 'Tai nghe Sony WH-1000XM5',
        brand: 'Sony',
        model: 'WH-1000XM5',
        serial_number: 'SN-SNWH1000-007',
        description: 'Tai nghe chống ồn ANC flagship, 30h pin',
        specifications: { connectivity: 'wireless', driver_mm: 40, frequency_hz: '4-40000', microphone: true, anc: true, color: 'black' },
        value: 8000000,
        rent_price_per_day: 120000,
        status: 'available',
        approval_status: 'approved',
        approved_by: '00000000-0000-0000-0000-000000000001',
        approved_at: daysAgo(2),
      },
      {
        id: '30000000-0000-0000-0000-000000000008',
        lender_id: '00000000-0000-0000-0000-000000000005',
        category_id: '20000000-0000-0000-0000-000000000006',
        name: 'Màn hình LG UltraGear 27GR95QE',
        brand: 'LG',
        model: '27GR95QE',
        serial_number: 'SN-LGUG27-008',
        description: '27" OLED 2K 240Hz, 0.03ms response time',
        specifications: { size_inch: 27, resolution: '2560x1440', refresh_hz: 240, panel: 'OLED', response_ms: 0.03 },
        value: 15000000,
        rent_price_per_day: 250000,
        status: 'available',
        approval_status: 'pending',
        approved_by: null,
        approved_at: null,
      },
    ],
    skipDuplicates: true,
  })
  console.log('✅ Gears')

  // =============================================================
  // GEAR MEDIA
  // =============================================================
  await prisma.gearMedia.createMany({
    data: [
      { id: '40000000-0000-0000-0000-000000000001', gear_id: '30000000-0000-0000-0000-000000000001', type: 'image', url: 'https://cdn.mutux.vn/gear/gpxsl2-main.jpg',   is_primary: true,  sort_order: 1 },
      { id: '40000000-0000-0000-0000-000000000002', gear_id: '30000000-0000-0000-0000-000000000001', type: 'image', url: 'https://cdn.mutux.vn/gear/gpxsl2-side.jpg',     is_primary: false, sort_order: 2 },
      { id: '40000000-0000-0000-0000-000000000003', gear_id: '30000000-0000-0000-0000-000000000002', type: 'image', url: 'https://cdn.mutux.vn/gear/kcq1pro-main.jpg',    is_primary: true,  sort_order: 1 },
      { id: '40000000-0000-0000-0000-000000000004', gear_id: '30000000-0000-0000-0000-000000000003', type: 'image', url: 'https://cdn.mutux.vn/gear/hxcaw-main.jpg',      is_primary: true,  sort_order: 1 },
      { id: '40000000-0000-0000-0000-000000000005', gear_id: '30000000-0000-0000-0000-000000000004', type: 'image', url: 'https://cdn.mutux.vn/gear/pg279qm-main.jpg',    is_primary: true,  sort_order: 1 },
      { id: '40000000-0000-0000-0000-000000000006', gear_id: '30000000-0000-0000-0000-000000000004', type: 'video', url: 'https://cdn.mutux.vn/gear/pg279qm-review.mp4',  is_primary: false, sort_order: 2 },
    ],
    skipDuplicates: true,
  })
  console.log('✅ Gear Media')

  // =============================================================
  // MUTUX WALLETS
  // =============================================================
  await prisma.mutuxWallet.createMany({
    data: [
      {
        id: '50000000-0000-0000-0000-000000000001',
        user_id: '00000000-0000-0000-0000-000000000006',
        credit_partner_id: '10000000-0000-0000-0000-000000000001',
        total_limit: 5000000,
        display_balance: 4500000,
        locked_balance: 500000,
        outstanding_debt: 0,
        status: 'active',
        partner_ref_id: 'MCC-R001',
        approved_at: daysAgo(30),
        expired_at: daysFromNow(335),
      },
      {
        id: '50000000-0000-0000-0000-000000000002',
        user_id: '00000000-0000-0000-0000-000000000007',
        credit_partner_id: '10000000-0000-0000-0000-000000000001',
        total_limit: 3000000,
        display_balance: 3000000,
        locked_balance: 0,
        outstanding_debt: 0,
        status: 'active',
        partner_ref_id: 'MCC-R002',
        approved_at: daysAgo(20),
        expired_at: daysFromNow(345),
      },
      {
        id: '50000000-0000-0000-0000-000000000003',
        user_id: '00000000-0000-0000-0000-000000000008',
        credit_partner_id: '10000000-0000-0000-0000-000000000002',
        total_limit: 8000000,
        display_balance: 7000000,
        locked_balance: 1000000,
        outstanding_debt: 0,
        status: 'active',
        partner_ref_id: 'VCP-R001',
        approved_at: daysAgo(15),
        expired_at: daysFromNow(350),
      },
      {
        id: '50000000-0000-0000-0000-000000000004',
        user_id: '00000000-0000-0000-0000-000000000010',
        credit_partner_id: '10000000-0000-0000-0000-000000000002',
        total_limit: 2000000,
        display_balance: 2000000,
        locked_balance: 0,
        outstanding_debt: 500000,
        status: 'active',
        partner_ref_id: 'VCP-R002',
        approved_at: daysAgo(60),
        expired_at: daysFromNow(305),
      },
    ],
    skipDuplicates: true,
  })
  console.log('✅ Mutux Wallets')

  // =============================================================
  // LENDER WALLETS
  // =============================================================
  await prisma.lenderWallet.createMany({
    data: [
      { id: '60000000-0000-0000-0000-000000000001', lender_id: '00000000-0000-0000-0000-000000000002', balance: 1500000, total_withdrawn: 5000000, status: 'active' },
      { id: '60000000-0000-0000-0000-000000000002', lender_id: '00000000-0000-0000-0000-000000000003', balance: 800000,  total_withdrawn: 2000000, status: 'active' },
      { id: '60000000-0000-0000-0000-000000000003', lender_id: '00000000-0000-0000-0000-000000000004', balance: 2200000, total_withdrawn: 3500000, status: 'active' },
      { id: '60000000-0000-0000-0000-000000000004', lender_id: '00000000-0000-0000-0000-000000000005', balance: 0,       total_withdrawn: 0,       status: 'active' },
    ],
    skipDuplicates: true,
  })
  console.log('✅ Lender Wallets')

  // =============================================================
  // BANK ACCOUNTS
  // =============================================================
  await prisma.bankAccount.createMany({
    data: [
      { id: '70000000-0000-0000-0000-000000000001', user_id: '00000000-0000-0000-0000-000000000002', bank_name: 'Vietcombank', bank_code: 'VCB', account_number: '0071000123456', account_holder: 'NGUYEN VAN AN',  is_default: true,  is_verified: true  },
      { id: '70000000-0000-0000-0000-000000000002', user_id: '00000000-0000-0000-0000-000000000003', bank_name: 'Techcombank',  bank_code: 'TCB', account_number: '9021000234567', account_holder: 'TRAN THI BINH',  is_default: true,  is_verified: true  },
      { id: '70000000-0000-0000-0000-000000000003', user_id: '00000000-0000-0000-0000-000000000004', bank_name: 'MB Bank',      bank_code: 'MB',  account_number: '0391000345678', account_holder: 'LE MINH CUONG',  is_default: true,  is_verified: true  },
      { id: '70000000-0000-0000-0000-000000000004', user_id: '00000000-0000-0000-0000-000000000006', bank_name: 'VPBank',       bank_code: 'VPB', account_number: '2691000456789', account_holder: 'HOANG DUC EM',   is_default: true,  is_verified: false },
    ],
    skipDuplicates: true,
  })
  console.log('✅ Bank Accounts')

  // =============================================================
  // RENTAL ORDERS
  // =============================================================
  await prisma.rentalOrder.createMany({
    data: [
      // Completed
      {
        id: '80000000-0000-0000-0000-000000000001',
        order_code: 'MX-2024-0001',
        renter_id: '00000000-0000-0000-0000-000000000006',
        gear_id: '30000000-0000-0000-0000-000000000003',
        lender_id: '00000000-0000-0000-0000-000000000003',
        start_date: dateOffset(-20),
        end_date: dateOffset(-14),
        duration_days: 6,
        snapped_rent_price_per_day: 55000,
        rental_fee: 330000,
        deposit_amount: 500000,
        deposit_type: 'traditional',
        status: 'completed',
        shipping_address: '123 Lê Lợi, Q1, TP.HCM',
        shipping_name: 'Hoàng Đức Em',
        shipping_phone: '0902000006',
        lender_shipped_at: daysAgo(19),
        renter_received_at: daysAgo(18),
        renter_returned_at: daysAgo(15),
        lender_received_back_at: daysAgo(14),
      },
      // Active
      {
        id: '80000000-0000-0000-0000-000000000002',
        order_code: 'MX-2024-0002',
        renter_id: '00000000-0000-0000-0000-000000000007',
        gear_id: '30000000-0000-0000-0000-000000000006',
        lender_id: '00000000-0000-0000-0000-000000000004',
        start_date: dateOffset(-3),
        end_date: dateOffset(4),
        duration_days: 7,
        snapped_rent_price_per_day: 35000,
        rental_fee: 245000,
        deposit_amount: 300000,
        deposit_type: 'credit_line',
        status: 'active',
        shipping_address: '45 Nguyễn Huệ, Q1, TP.HCM',
        shipping_name: 'Vũ Lan Phương',
        shipping_phone: '0902000007',
        lender_shipped_at: daysAgo(2),
        renter_received_at: daysAgo(1),
        renter_returned_at: null,
        lender_received_back_at: null,
      },
      // Delivering
      {
        id: '80000000-0000-0000-0000-000000000003',
        order_code: 'MX-2024-0003',
        renter_id: '00000000-0000-0000-0000-000000000008',
        gear_id: '30000000-0000-0000-0000-000000000001',
        lender_id: '00000000-0000-0000-0000-000000000002',
        start_date: dateOffset(1),
        end_date: dateOffset(5),
        duration_days: 4,
        snapped_rent_price_per_day: 60000,
        rental_fee: 240000,
        deposit_amount: 500000,
        deposit_type: 'traditional',
        status: 'delivering',
        shipping_address: '78 Trần Hưng Đạo, Q5, TP.HCM',
        shipping_name: 'Đặng Minh Giang',
        shipping_phone: '0902000008',
        lender_shipped_at: hoursAgo(3),
        renter_received_at: null,
        renter_returned_at: null,
        lender_received_back_at: null,
      },
      // Pending confirm
      {
        id: '80000000-0000-0000-0000-000000000004',
        order_code: 'MX-2024-0004',
        renter_id: '00000000-0000-0000-0000-000000000010',
        gear_id: '30000000-0000-0000-0000-000000000004',
        lender_id: '00000000-0000-0000-0000-000000000003',
        start_date: dateOffset(2),
        end_date: dateOffset(9),
        duration_days: 7,
        snapped_rent_price_per_day: 200000,
        rental_fee: 1400000,
        deposit_amount: 2000000,
        deposit_type: 'traditional',
        status: 'pending_confirm',
        shipping_address: '12 Đinh Tiên Hoàng, Q Bình Thạnh, TP.HCM',
        shipping_name: 'Ngô Tuấn Kiệt',
        shipping_phone: '0902000010',
        lender_shipped_at: null,
        renter_received_at: null,
        renter_returned_at: null,
        lender_received_back_at: null,
      },
      // Disputed
      {
        id: '80000000-0000-0000-0000-000000000005',
        order_code: 'MX-2024-0005',
        renter_id: '00000000-0000-0000-0000-000000000006',
        gear_id: '30000000-0000-0000-0000-000000000002',
        lender_id: '00000000-0000-0000-0000-000000000002',
        start_date: dateOffset(-15),
        end_date: dateOffset(-8),
        duration_days: 7,
        snapped_rent_price_per_day: 80000,
        rental_fee: 560000,
        deposit_amount: 1000000,
        deposit_type: 'traditional',
        status: 'disputed',
        shipping_address: '99 Phan Xích Long, Q Phú Nhuận, TP.HCM',
        shipping_name: 'Hoàng Đức Em',
        shipping_phone: '0902000006',
        lender_shipped_at: daysAgo(14),
        renter_received_at: daysAgo(13),
        renter_returned_at: daysAgo(9),
        lender_received_back_at: daysAgo(8),
      },
      // Cancelled
      {
        id: '80000000-0000-0000-0000-000000000006',
        order_code: 'MX-2024-0006',
        renter_id: '00000000-0000-0000-0000-000000000009',
        gear_id: '30000000-0000-0000-0000-000000000007',
        lender_id: '00000000-0000-0000-0000-000000000002',
        start_date: dateOffset(5),
        end_date: dateOffset(10),
        duration_days: 5,
        snapped_rent_price_per_day: 120000,
        rental_fee: 600000,
        deposit_amount: 1500000,
        deposit_type: 'credit_line',
        status: 'cancelled',
        shipping_address: '55 Cách Mạng Tháng 8, Q3, TP.HCM',
        shipping_name: 'Bùi Thị Hoa',
        shipping_phone: '0902000009',
        lender_shipped_at: null,
        renter_received_at: null,
        renter_returned_at: null,
        lender_received_back_at: null,
      },
    ],
    skipDuplicates: true,
  })
  console.log('✅ Rental Orders')

  // =============================================================
  // ESCROW WALLETS
  // =============================================================
  await prisma.escrowWallet.createMany({
    data: [
      { id: '90000000-0000-0000-0000-000000000001', rental_order_id: '80000000-0000-0000-0000-000000000001', amount: 500000,  source: 'renter_cash', status: 'released',    locked_at: daysAgo(19), released_at: daysAgo(14) },
      { id: '90000000-0000-0000-0000-000000000002', rental_order_id: '80000000-0000-0000-0000-000000000002', amount: 300000,  source: 'credit_line', status: 'locked',      locked_at: daysAgo(2),  released_at: null },
      { id: '90000000-0000-0000-0000-000000000003', rental_order_id: '80000000-0000-0000-0000-000000000003', amount: 500000,  source: 'renter_cash', status: 'locked',      locked_at: hoursAgo(3), released_at: null },
      { id: '90000000-0000-0000-0000-000000000004', rental_order_id: '80000000-0000-0000-0000-000000000004', amount: 2000000, source: 'renter_cash', status: 'locked',      locked_at: new Date(),  released_at: null },
      { id: '90000000-0000-0000-0000-000000000005', rental_order_id: '80000000-0000-0000-0000-000000000005', amount: 1000000, source: 'renter_cash', status: 'compensated', locked_at: daysAgo(14), released_at: daysAgo(5) },
      { id: '90000000-0000-0000-0000-000000000006', rental_order_id: '80000000-0000-0000-0000-000000000006', amount: 1500000, source: 'credit_line', status: 'released',    locked_at: daysAgo(1),  released_at: daysAgo(1) },
    ],
    skipDuplicates: true,
  })
  console.log('✅ Escrow Wallets')

  // =============================================================
  // PAYMENTS
  // =============================================================
  await prisma.payment.createMany({
    data: [
      { id: 'A0000000-0000-0000-0000-000000000001', rental_order_id: '80000000-0000-0000-0000-000000000001', user_id: '00000000-0000-0000-0000-000000000006', type: 'deposit',    amount: 500000,  method: 'momo',          status: 'success', transaction_ref: 'MOMO-D001-001', paid_at: daysAgo(19) },
      { id: 'A0000000-0000-0000-0000-000000000002', rental_order_id: '80000000-0000-0000-0000-000000000001', user_id: '00000000-0000-0000-0000-000000000006', type: 'rental_fee', amount: 330000,  method: 'momo',          status: 'success', transaction_ref: 'MOMO-F001-001', paid_at: daysAgo(19) },
      { id: 'A0000000-0000-0000-0000-000000000003', rental_order_id: '80000000-0000-0000-0000-000000000002', user_id: '00000000-0000-0000-0000-000000000007', type: 'deposit',    amount: 300000,  method: 'credit_line',   status: 'success', transaction_ref: 'CL-D001-002',   paid_at: daysAgo(2)  },
      { id: 'A0000000-0000-0000-0000-000000000004', rental_order_id: '80000000-0000-0000-0000-000000000002', user_id: '00000000-0000-0000-0000-000000000007', type: 'rental_fee', amount: 245000,  method: 'credit_line',   status: 'success', transaction_ref: 'CL-F001-002',   paid_at: daysAgo(2)  },
      { id: 'A0000000-0000-0000-0000-000000000005', rental_order_id: '80000000-0000-0000-0000-000000000003', user_id: '00000000-0000-0000-0000-000000000008', type: 'deposit',    amount: 500000,  method: 'bank_transfer', status: 'success', transaction_ref: 'BT-D001-003',   paid_at: hoursAgo(4) },
      { id: 'A0000000-0000-0000-0000-000000000006', rental_order_id: '80000000-0000-0000-0000-000000000003', user_id: '00000000-0000-0000-0000-000000000008', type: 'rental_fee', amount: 240000,  method: 'bank_transfer', status: 'success', transaction_ref: 'BT-F001-003',   paid_at: hoursAgo(4) },
      { id: 'A0000000-0000-0000-0000-000000000007', rental_order_id: '80000000-0000-0000-0000-000000000005', user_id: '00000000-0000-0000-0000-000000000006', type: 'deposit',    amount: 1000000, method: 'vnpay',         status: 'success', transaction_ref: 'VP-D001-005',   paid_at: daysAgo(14) },
      { id: 'A0000000-0000-0000-0000-000000000008', rental_order_id: '80000000-0000-0000-0000-000000000005', user_id: '00000000-0000-0000-0000-000000000006', type: 'rental_fee', amount: 560000,  method: 'vnpay',         status: 'success', transaction_ref: 'VP-F001-005',   paid_at: daysAgo(14) },
    ],
    skipDuplicates: true,
  })
  console.log('✅ Payments')

  // =============================================================
  // RENTAL PROOFS
  // =============================================================
  await prisma.rentalProof.createMany({
    data: [
      // Order 1 – 4 stages
      { id: 'B0000000-0000-0000-0000-000000000001', rental_order_id: '80000000-0000-0000-0000-000000000001', uploaded_by: '00000000-0000-0000-0000-000000000003', stage: 'pre_shipment',  proof_type: 'image', file_url: 'https://cdn.mutux.vn/proof/o1-pre-ship.jpg',  note: 'Máy đầy đủ phụ kiện, không trầy xước' },
      { id: 'B0000000-0000-0000-0000-000000000002', rental_order_id: '80000000-0000-0000-0000-000000000001', uploaded_by: '00000000-0000-0000-0000-000000000006', stage: 'post_received', proof_type: 'image', file_url: 'https://cdn.mutux.vn/proof/o1-post-recv.jpg', note: 'Nhận hàng ok, hộp nguyên seal' },
      { id: 'B0000000-0000-0000-0000-000000000003', rental_order_id: '80000000-0000-0000-0000-000000000001', uploaded_by: '00000000-0000-0000-0000-000000000006', stage: 'pre_return',    proof_type: 'video', file_url: 'https://cdn.mutux.vn/proof/o1-pre-ret.mp4',   note: 'Trả hàng nguyên vẹn' },
      { id: 'B0000000-0000-0000-0000-000000000004', rental_order_id: '80000000-0000-0000-0000-000000000001', uploaded_by: '00000000-0000-0000-0000-000000000003', stage: 'post_returned', proof_type: 'image', file_url: 'https://cdn.mutux.vn/proof/o1-post-ret.jpg',  note: 'Nhận lại ok' },
      // Order 2 – active
      { id: 'B0000000-0000-0000-0000-000000000005', rental_order_id: '80000000-0000-0000-0000-000000000002', uploaded_by: '00000000-0000-0000-0000-000000000004', stage: 'pre_shipment',  proof_type: 'image', file_url: 'https://cdn.mutux.vn/proof/o2-pre-ship.jpg',  note: 'Bàn phím sạch sẽ' },
      { id: 'B0000000-0000-0000-0000-000000000006', rental_order_id: '80000000-0000-0000-0000-000000000002', uploaded_by: '00000000-0000-0000-0000-000000000007', stage: 'post_received', proof_type: 'image', file_url: 'https://cdn.mutux.vn/proof/o2-post-recv.jpg', note: 'Nhận đúng hàng' },
      // Order 5 – 4 stages
      { id: 'B0000000-0000-0000-0000-000000000007', rental_order_id: '80000000-0000-0000-0000-000000000005', uploaded_by: '00000000-0000-0000-0000-000000000002', stage: 'pre_shipment',  proof_type: 'image', file_url: 'https://cdn.mutux.vn/proof/o5-pre-ship.jpg',  note: null },
      { id: 'B0000000-0000-0000-0000-000000000008', rental_order_id: '80000000-0000-0000-0000-000000000005', uploaded_by: '00000000-0000-0000-0000-000000000006', stage: 'post_received', proof_type: 'image', file_url: 'https://cdn.mutux.vn/proof/o5-post-recv.jpg', note: null },
      { id: 'B0000000-0000-0000-0000-000000000009', rental_order_id: '80000000-0000-0000-0000-000000000005', uploaded_by: '00000000-0000-0000-0000-000000000006', stage: 'pre_return',    proof_type: 'video', file_url: 'https://cdn.mutux.vn/proof/o5-pre-ret.mp4',   note: 'Phím space bar bị vỡ clip mount' },
      { id: 'B0000000-0000-0000-0000-000000000010', rental_order_id: '80000000-0000-0000-0000-000000000005', uploaded_by: '00000000-0000-0000-0000-000000000002', stage: 'post_returned', proof_type: 'image', file_url: 'https://cdn.mutux.vn/proof/o5-post-ret.jpg',  note: 'Xác nhận hư hỏng' },
    ],
    skipDuplicates: true,
  })
  console.log('✅ Rental Proofs')

  // =============================================================
  // CONVERSATIONS + MESSAGES
  // =============================================================
  await prisma.conversation.createMany({
    data: [
      { id: 'C0000000-0000-0000-0000-000000000001', rental_order_id: '80000000-0000-0000-0000-000000000001', renter_id: '00000000-0000-0000-0000-000000000006', lender_id: '00000000-0000-0000-0000-000000000003', last_message_at: daysAgo(14) },
      { id: 'C0000000-0000-0000-0000-000000000002', rental_order_id: '80000000-0000-0000-0000-000000000002', renter_id: '00000000-0000-0000-0000-000000000007', lender_id: '00000000-0000-0000-0000-000000000004', last_message_at: daysAgo(1)  },
      { id: 'C0000000-0000-0000-0000-000000000003', rental_order_id: '80000000-0000-0000-0000-000000000005', renter_id: '00000000-0000-0000-0000-000000000006', lender_id: '00000000-0000-0000-0000-000000000002', last_message_at: daysAgo(8)  },
    ],
    skipDuplicates: true,
  })

  await prisma.message.createMany({
    data: [
      { id: 'D0000000-0000-0000-0000-000000000001', conversation_id: 'C0000000-0000-0000-0000-000000000001', sender_id: '00000000-0000-0000-0000-000000000006', type: 'text', content: 'Bạn ơi, tai nghe còn dây đi kèm không?' },
      { id: 'D0000000-0000-0000-0000-000000000002', conversation_id: 'C0000000-0000-0000-0000-000000000001', sender_id: '00000000-0000-0000-0000-000000000003', type: 'text', content: 'Còn đầy đủ nhé, có cả túi đựng.' },
      { id: 'D0000000-0000-0000-0000-000000000003', conversation_id: 'C0000000-0000-0000-0000-000000000002', sender_id: '00000000-0000-0000-0000-000000000007', type: 'text', content: 'Bàn phím giao bằng Giao Hàng Nhanh được không?' },
      { id: 'D0000000-0000-0000-0000-000000000004', conversation_id: 'C0000000-0000-0000-0000-000000000002', sender_id: '00000000-0000-0000-0000-000000000004', type: 'text', content: 'Được nha, mình sẽ đóng gói cẩn thận.' },
      { id: 'D0000000-0000-0000-0000-000000000005', conversation_id: 'C0000000-0000-0000-0000-000000000003', sender_id: '00000000-0000-0000-0000-000000000006', type: 'text', content: 'Phím space bị hỏng rồi, bạn xem video proof mình gửi nhé.' },
      { id: 'D0000000-0000-0000-0000-000000000006', conversation_id: 'C0000000-0000-0000-0000-000000000003', sender_id: '00000000-0000-0000-0000-000000000002', type: 'text', content: 'Mình đã nhận lại máy rồi, sẽ mở dispute.' },
    ],
    skipDuplicates: true,
  })
  console.log('✅ Conversations & Messages')

  // =============================================================
  // DISPUTES + EVIDENCES
  // =============================================================
  await prisma.dispute.createMany({
    data: [
      {
        id: 'E0000000-0000-0000-0000-000000000001',
        rental_order_id: '80000000-0000-0000-0000-000000000005',
        reported_by: '00000000-0000-0000-0000-000000000002',
        reporter_role: 'lender',
        reason: 'device_damaged',
        description: 'Phím Space bar bị vỡ clip mount khi trả lại, video rõ ràng. Yêu cầu bồi thường 200,000đ.',
        status: 'resolved',
        resolved_by: '00000000-0000-0000-0000-000000000001',
        resolution_note: 'Đã xem xét proof đủ 4 stages và video renter. Trừ 200,000đ từ cọc bồi thường cho lender.',
        resolution_type: 'deposit_deduct',
        deduct_amount: 200000,
        resolved_at: daysAgo(5),
      },
    ],
    skipDuplicates: true,
  })

  await prisma.disputeEvidence.createMany({
    data: [
      { id: 'F0000000-0000-0000-0000-000000000001', dispute_id: 'E0000000-0000-0000-0000-000000000001', uploaded_by: '00000000-0000-0000-0000-000000000002', media_type: 'image', url: 'https://cdn.mutux.vn/dispute/d1-evidence-1.jpg' },
      { id: 'F0000000-0000-0000-0000-000000000002', dispute_id: 'E0000000-0000-0000-0000-000000000001', uploaded_by: '00000000-0000-0000-0000-000000000002', media_type: 'video', url: 'https://cdn.mutux.vn/dispute/d1-evidence-2.mp4' },
      { id: 'F0000000-0000-0000-0000-000000000003', dispute_id: 'E0000000-0000-0000-0000-000000000001', uploaded_by: '00000000-0000-0000-0000-000000000006', media_type: 'image', url: 'https://cdn.mutux.vn/dispute/d1-counter-1.jpg'  },
    ],
    skipDuplicates: true,
  })
  console.log('✅ Disputes & Evidences')

  // =============================================================
  // REVIEWS
  // =============================================================
  await prisma.review.createMany({
    data: [
      { id: 'a1000000-0000-0000-0000-000000000001', rental_order_id: '80000000-0000-0000-0000-000000000001', reviewer_id: '00000000-0000-0000-0000-000000000006', target_id: '00000000-0000-0000-0000-000000000003', target_type: 'lender', rating: 5, comment: 'Lender rất nhiệt tình, giao hàng nhanh và đóng gói cẩn thận!' },
      { id: 'a1000000-0000-0000-0000-000000000002', rental_order_id: '80000000-0000-0000-0000-000000000001', reviewer_id: '00000000-0000-0000-0000-000000000003', target_id: '00000000-0000-0000-0000-000000000006', target_type: 'renter', rating: 5, comment: 'Renter hoàn trả đúng hạn, hàng nguyên vẹn. Sẽ cho thuê tiếp.' },
      { id: 'a1000000-0000-0000-0000-000000000003', rental_order_id: '80000000-0000-0000-0000-000000000005', reviewer_id: '00000000-0000-0000-0000-000000000006', target_id: '00000000-0000-0000-0000-000000000002', target_type: 'lender', rating: 2, comment: 'Bàn phím không như mô tả, phím space mount bị yếu sẵn.' },
    ],
    skipDuplicates: true,
  })
  console.log('✅ Reviews')

  // =============================================================
  // CREDIT TRANSACTIONS
  // =============================================================
  await prisma.creditTransaction.createMany({
    data: [
      { id: 'a2000000-0000-0000-0000-000000000001', mutux_wallet_id: '50000000-0000-0000-0000-000000000001', type: 'limit_granted', amount: 5000000, display_balance_before: 0,       display_balance_after: 5000000, direction: 'in',  ref_type: null,           ref_id: null,                                   note: 'Cấp hạn mức lần đầu',        status: 'success' },
      { id: 'a2000000-0000-0000-0000-000000000002', mutux_wallet_id: '50000000-0000-0000-0000-000000000001', type: 'deposit_lock',   amount: 500000,  display_balance_before: 5000000, display_balance_after: 4500000, direction: 'out', ref_type: 'rental_order', ref_id: '80000000-0000-0000-0000-000000000002', note: 'Khoá cọc đơn MX-2024-0002',   status: 'success' },
      { id: 'a2000000-0000-0000-0000-000000000003', mutux_wallet_id: '50000000-0000-0000-0000-000000000002', type: 'limit_granted', amount: 3000000, display_balance_before: 0,       display_balance_after: 3000000, direction: 'in',  ref_type: null,           ref_id: null,                                   note: 'Cấp hạn mức lần đầu',        status: 'success' },
      { id: 'a2000000-0000-0000-0000-000000000004', mutux_wallet_id: '50000000-0000-0000-0000-000000000003', type: 'limit_granted', amount: 8000000, display_balance_before: 0,       display_balance_after: 8000000, direction: 'in',  ref_type: null,           ref_id: null,                                   note: 'Cấp hạn mức lần đầu',        status: 'success' },
      { id: 'a2000000-0000-0000-0000-000000000005', mutux_wallet_id: '50000000-0000-0000-0000-000000000003', type: 'deposit_lock',   amount: 1000000, display_balance_before: 8000000, display_balance_after: 7000000, direction: 'out', ref_type: 'rental_order', ref_id: '80000000-0000-0000-0000-000000000003', note: 'Khoá cọc đơn MX-2024-0003',   status: 'success' },
    ],
    skipDuplicates: true,
  })
  console.log('✅ Credit Transactions')

  // =============================================================
  // LENDER WALLET TRANSACTIONS
  // =============================================================
  await prisma.lenderWalletTransaction.createMany({
    data: [
      { id: 'a3000000-0000-0000-0000-000000000001', lender_wallet_id: '60000000-0000-0000-0000-000000000002', rental_order_id: '80000000-0000-0000-0000-000000000001', type: 'income',       amount: 280500, balance_before: 0,       balance_after: 280500,  note: 'Thu nhập đơn MX-2024-0001 (sau phí 15%)' },
      { id: 'a3000000-0000-0000-0000-000000000002', lender_wallet_id: '60000000-0000-0000-0000-000000000002', rental_order_id: null,                                   type: 'withdrawal',   amount: 280500, balance_before: 280500,  balance_after: 0,       note: 'Rút về tài khoản Techcombank' },
      { id: 'a3000000-0000-0000-0000-000000000003', lender_wallet_id: '60000000-0000-0000-0000-000000000001', rental_order_id: '80000000-0000-0000-0000-000000000005', type: 'income',       amount: 476000, balance_before: 1023500, balance_after: 1499500, note: 'Thu nhập đơn MX-2024-0005 (sau phí 15%)' },
      { id: 'a3000000-0000-0000-0000-000000000004', lender_wallet_id: '60000000-0000-0000-0000-000000000001', rental_order_id: '80000000-0000-0000-0000-000000000005', type: 'compensation', amount: 200000, balance_before: 1499500, balance_after: 1699500, note: 'Bồi thường dispute D001 – trừ cọc renter' },
      { id: 'a3000000-0000-0000-0000-000000000005', lender_wallet_id: '60000000-0000-0000-0000-000000000001', rental_order_id: null,                                   type: 'withdrawal',   amount: 199500, balance_before: 1699500, balance_after: 1500000, note: 'Rút một phần về Vietcombank' },
    ],
    skipDuplicates: true,
  })
  console.log('✅ Lender Wallet Transactions')

  // =============================================================
  // NOTIFICATIONS
  // =============================================================
  await prisma.notification.createMany({
    data: [
      { id: 'a4000000-0000-0000-0000-000000000001', user_id: '00000000-0000-0000-0000-000000000006', title: 'Đơn thuê đã hoàn thành',       body: 'Đơn MX-2024-0001 đã hoàn thành. Cảm ơn bạn!',           type: 'order',   ref_type: 'rental_order', ref_id: '80000000-0000-0000-0000-000000000001', is_read: true  },
      { id: 'a4000000-0000-0000-0000-000000000002', user_id: '00000000-0000-0000-0000-000000000003', title: 'Lender nhận lại hàng',          body: 'Bạn đã xác nhận nhận lại tai nghe từ đơn MX-2024-0001.', type: 'order',   ref_type: 'rental_order', ref_id: '80000000-0000-0000-0000-000000000001', is_read: true  },
      { id: 'a4000000-0000-0000-0000-000000000003', user_id: '00000000-0000-0000-0000-000000000007', title: 'Đơn hàng đang giao',            body: 'Bàn phím đang được giao cho bạn – MX-2024-0002.',          type: 'order',   ref_type: 'rental_order', ref_id: '80000000-0000-0000-0000-000000000002', is_read: false },
      { id: 'a4000000-0000-0000-0000-000000000004', user_id: '00000000-0000-0000-0000-000000000010', title: 'Đơn chờ xác nhận',              body: 'Lender đang xem xét đơn MX-2024-0004 của bạn.',            type: 'order',   ref_type: 'rental_order', ref_id: '80000000-0000-0000-0000-000000000004', is_read: false },
      { id: 'a4000000-0000-0000-0000-000000000005', user_id: '00000000-0000-0000-0000-000000000006', title: 'Tranh chấp đã được giải quyết', body: 'Dispute đơn MX-2024-0005 đã xử lý. Trừ cọc 200,000đ.',    type: 'dispute', ref_type: 'rental_order', ref_id: '80000000-0000-0000-0000-000000000005', is_read: false },
      { id: 'a4000000-0000-0000-0000-000000000006', user_id: '00000000-0000-0000-0000-000000000002', title: 'Bồi thường đã được cộng',       body: 'Bạn nhận được 200,000đ bồi thường vào ví lender.',         type: 'dispute', ref_type: 'rental_order', ref_id: '80000000-0000-0000-0000-000000000005', is_read: true  },
      { id: 'a4000000-0000-0000-0000-000000000007', user_id: '00000000-0000-0000-0000-000000000008', title: 'Đơn đang vận chuyển',           body: 'Lender đã giao hàng. Vui lòng theo dõi MX-2024-0003.',     type: 'order',   ref_type: 'rental_order', ref_id: '80000000-0000-0000-0000-000000000003', is_read: false },
    ],
    skipDuplicates: true,
  })
  console.log('✅ Notifications')

  // =============================================================
  // MEMBERSHIP PLANS
  // =============================================================
  await prisma.membershipPlan.createMany({
    data: [
      { id: 'a5000000-0000-0000-0000-000000000001', name: 'Basic',   price: 99000,  duration_days: 30,  rental_discount_rate: 0.05, credit_fee_discount_rate: 0.00, priority_access: false },
      { id: 'a5000000-0000-0000-0000-000000000002', name: 'Pro',    price: 299000, duration_days: 30,  rental_discount_rate: 0.10, credit_fee_discount_rate: 0.05, priority_access: true  },
      { id: 'a5000000-0000-0000-0000-000000000003', name: 'Annual', price: 999000, duration_days: 365, rental_discount_rate: 0.15, credit_fee_discount_rate: 0.10, priority_access: true  },
    ],
    skipDuplicates: true,
  })
  console.log('✅ Membership Plans')

  // =============================================================
  // GEAR PRICE HISTORY
  // =============================================================
  await prisma.gearPriceHistory.createMany({
    data: [
      { id: 'a6000000-0000-0000-0000-000000000001', gear_id: '30000000-0000-0000-0000-000000000001', changed_by: '00000000-0000-0000-0000-000000000002', old_rent_price_per_day: 70000,  new_rent_price_per_day: 60000,  reason: 'Giảm giá khuyến mãi ra mắt'  },
      { id: 'a6000000-0000-0000-0000-000000000002', gear_id: '30000000-0000-0000-0000-000000000004', changed_by: '00000000-0000-0000-0000-000000000003', old_rent_price_per_day: 180000, new_rent_price_per_day: 200000, reason: 'Tăng giá theo thị trường' },
    ],
    skipDuplicates: true,
  })
  console.log('✅ Gear Price History')

  console.log('\n🎉 Seed hoàn tất!')
}

main()
  .catch((e) => {
    console.error('❌ Seed thất bại:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })