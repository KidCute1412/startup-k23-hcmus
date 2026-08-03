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
        password_hash: '$2b$10$VKlyxJLgvp7ep6ZskqJM3eyvq8nAzgmhmQWJPoJz4mVaW/1ek7ACS',
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
        password_hash: '$2b$10$VKlyxJLgvp7ep6ZskqJM3eyvq8nAzgmhmQWJPoJz4mVaW/1ek7ACS',
        full_name: 'Nguyễn Văn An',
        cccd: '001099000002',
        rating: 4.8,
        total_reviews: 12,
        role: 'renter',
        lender_enabled: true,
        kyc_status: 'verified',
        is_active: true,
      },
      {
        id: '00000000-0000-0000-0000-000000000003',
        email: 'lender2@gmail.com',
        phone: '0901000003',
        password_hash: '$2b$10$VKlyxJLgvp7ep6ZskqJM3eyvq8nAzgmhmQWJPoJz4mVaW/1ek7ACS',
        full_name: 'Trần Thị Bình',
        cccd: '001099000003',
        rating: 4.5,
        total_reviews: 8,
        role: 'renter',
        lender_enabled: true,
        kyc_status: 'verified',
        is_active: true,
      },
      {
        id: '00000000-0000-0000-0000-000000000004',
        email: 'lender3@gmail.com',
        phone: '0901000004',
        password_hash: '$2b$10$VKlyxJLgvp7ep6ZskqJM3eyvq8nAzgmhmQWJPoJz4mVaW/1ek7ACS',
        full_name: 'Lê Minh Cường',
        cccd: '001099000004',
        rating: 4.9,
        total_reviews: 20,
        role: 'renter',
        lender_enabled: true,
        kyc_status: 'verified',
        is_active: true,
      },
      {
        id: '00000000-0000-0000-0000-000000000005',
        email: 'lender4@gmail.com',
        phone: '0901000005',
        password_hash: '$2b$10$VKlyxJLgvp7ep6ZskqJM3eyvq8nAzgmhmQWJPoJz4mVaW/1ek7ACS',
        full_name: 'Phạm Thúy Dung',
        cccd: '001099000005',
        rating: 4.2,
        total_reviews: 5,
        role: 'renter',
        lender_enabled: true,
        kyc_status: 'pending',
        is_active: true,
      },
      // Renters
      {
        id: '00000000-0000-0000-0000-000000000006',
        email: 'renter1@gmail.com',
        phone: '0902000006',
        password_hash: '$2b$10$VKlyxJLgvp7ep6ZskqJM3eyvq8nAzgmhmQWJPoJz4mVaW/1ek7ACS',
        full_name: 'Hoàng Đức Em',
        dob: new Date('1999-05-15T00:00:00.000Z'),
        bio: 'Gamer PC enthusiast & pro rental member tại Mutux.',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
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
        password_hash: '$2b$10$VKlyxJLgvp7ep6ZskqJM3eyvq8nAzgmhmQWJPoJz4mVaW/1ek7ACS',
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
        password_hash: '$2b$10$VKlyxJLgvp7ep6ZskqJM3eyvq8nAzgmhmQWJPoJz4mVaW/1ek7ACS',
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
        password_hash: '$2b$10$VKlyxJLgvp7ep6ZskqJM3eyvq8nAzgmhmQWJPoJz4mVaW/1ek7ACS',
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
        password_hash: '$2b$10$VKlyxJLgvp7ep6ZskqJM3eyvq8nAzgmhmQWJPoJz4mVaW/1ek7ACS',
        full_name: 'Ngô Tuấn Kiệt',
        cccd: '001099000010',
        rating: 4.6,
        total_reviews: 7,
        role: 'renter',
        kyc_status: 'verified',
        is_active: true,
      },
      // Week 2 finance contract fixtures
      {
        id: '00000000-0000-0000-0000-000000000011',
        email: 'renter_cash@test.com',
        phone: '0910000011',
        password_hash: '$2b$10$VKlyxJLgvp7ep6ZskqJM3eyvq8nAzgmhmQWJPoJz4mVaW/1ek7ACS',
        full_name: 'W2 Renter Cash',
        cccd: '001099000011',
        rating: 5.0,
        total_reviews: 0,
        role: 'renter',
        kyc_status: 'verified',
        is_active: true,
      },
      {
        id: '00000000-0000-0000-0000-000000000012',
        email: 'renter_credit@test.com',
        phone: '0910000012',
        password_hash: '$2b$10$VKlyxJLgvp7ep6ZskqJM3eyvq8nAzgmhmQWJPoJz4mVaW/1ek7ACS',
        full_name: 'W2 Renter Credit',
        cccd: '001099000012',
        rating: 5.0,
        total_reviews: 0,
        role: 'renter',
        kyc_status: 'verified',
        is_active: true,
      },
      {
        id: '00000000-0000-0000-0000-000000000013',
        email: 'lender@test.com',
        phone: '0910000013',
        password_hash: '$2b$10$VKlyxJLgvp7ep6ZskqJM3eyvq8nAzgmhmQWJPoJz4mVaW/1ek7ACS',
        full_name: 'W2 Lender',
        cccd: '001099000013',
        rating: 5.0,
        total_reviews: 0,
        role: 'renter',
        lender_enabled: true,
        kyc_status: 'verified',
        is_active: true,
      },
      {
        id: '00000000-0000-0000-0000-000000000014',
        email: 'admin@test.com',
        phone: '0910000014',
        password_hash: '$2b$10$VKlyxJLgvp7ep6ZskqJM3eyvq8nAzgmhmQWJPoJz4mVaW/1ek7ACS',
        full_name: 'W2 Admin',
        cccd: '001099000014',
        rating: 5.0,
        total_reviews: 0,
        role: 'admin',
        kyc_status: 'verified',
        is_active: true,
      },
    ],
    skipDuplicates: true,
  })
  console.log('✅ Users')

  await prisma.userAddress.createMany({
    data: [
      {
        id: '01000000-0000-0000-0000-000000000001',
        user_id: '00000000-0000-0000-0000-000000000006',
        receiver_name: 'Hoàng Đức Em',
        phone: '0902000006',
        detail_address: '227 Nguyễn Văn Cừ',
        ward: 'Phường 4',
        district: 'Quận 5',
        province: 'TP. Hồ Chí Minh',
        is_default: true,
      },
      {
        id: '01000000-0000-0000-0000-000000000002',
        user_id: '00000000-0000-0000-0000-000000000006',
        receiver_name: 'Hoàng Đức Em (Văn phòng)',
        phone: '0902000006',
        detail_address: '2 Hải Triều',
        ward: 'Phường Bến Nghé',
        district: 'Quận 1',
        province: 'TP. Hồ Chí Minh',
        is_default: false,
      },
    ],
    skipDuplicates: true,
  })
  console.log('✅ User addresses')

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

  // Clean up existing gear catalog data to ensure fresh images and subcategories are applied
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE gear_media, reviews, rental_proofs, disputes, escrow_wallets, payments, rental_orders, gears, gear_categories RESTART IDENTITY CASCADE;`
  )

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
      {
        id: '20000000-0000-0000-0000-000000000010',
        parent_id: null,
        name: 'PC & Linh kiện',
        slug: 'pc-linh-kien',
        description: 'Card đồ họa, CPU, RAM, Tản nhiệt & Case',
      },
      {
        id: '20000000-0000-0000-0000-000000000020',
        parent_id: null,
        name: 'Thiết bị Stream & Audio',
        slug: 'stream-audio',
        description: 'Microphone, Soundcard, Webcam & Stream Deck',
      },
      {
        id: '20000000-0000-0000-0000-000000000030',
        parent_id: null,
        name: 'Ghế & Setup Gaming',
        slug: 'ghe-setup',
        description: 'Ghế gaming ergonomic, bàn nâng hạ & phụ kiện',
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
        description: 'Chuột có dây và không dây cao cấp',
      },
      {
        id: '20000000-0000-0000-0000-000000000003',
        parent_id: '20000000-0000-0000-0000-000000000001',
        name: 'Bàn phím cơ',
        slug: 'ban-phim-co',
        description: 'Bàn phím cơ đủ loại switch và layout',
      },
      {
        id: '20000000-0000-0000-0000-000000000004',
        parent_id: '20000000-0000-0000-0000-000000000001',
        name: 'Tai nghe gaming',
        slug: 'tai-nghe-gaming',
        description: 'Tai nghe 7.1 surround & không dây',
      },
      {
        id: '20000000-0000-0000-0000-000000000007',
        parent_id: '20000000-0000-0000-0000-000000000001',
        name: 'Tay cầm & VR',
        slug: 'tay-cam-vr',
        description: 'Tay cầm chơi game console/PC và kính thực tế ảo',
      },
      {
        id: '20000000-0000-0000-0000-000000000006',
        parent_id: '20000000-0000-0000-0000-000000000005',
        name: 'Màn hình 144Hz - 240Hz',
        slug: 'man-hinh-144hz',
        description: 'Màn hình tốc độ cao cho game thủ Esports',
      },
      {
        id: '20000000-0000-0000-0000-000000000012',
        parent_id: '20000000-0000-0000-0000-000000000005',
        name: 'Màn hình 4K & OLED',
        slug: 'man-hinh-4k-oled',
        description: 'Màn hình độ phân giải siêu cao và tấm nền OLED',
      },
      {
        id: '20000000-0000-0000-0000-000000000013',
        parent_id: '20000000-0000-0000-0000-000000000005',
        name: 'Màn hình Cong & Ultrawide',
        slug: 'man-hinh-ultrawide',
        description: 'Màn hình tỉ lệ 21:9 & 32:9 siêu rộng',
      },
      {
        id: '20000000-0000-0000-0000-000000000009',
        parent_id: '20000000-0000-0000-0000-000000000010',
        name: 'Card đồ họa (GPU)',
        slug: 'card-do-hoa',
        description: 'VGA Gaming & Đồ họa RTX 40 series, RX 7000 series',
      },
      {
        id: '20000000-0000-0000-0000-000000000014',
        parent_id: '20000000-0000-0000-0000-000000000010',
        name: 'CPU & Mainboard',
        slug: 'cpu-mainboard',
        description: 'Vi xử lý Intel/AMD & Bo mạch chủ cao cấp',
      },
      {
        id: '20000000-0000-0000-0000-000000000015',
        parent_id: '20000000-0000-0000-0000-000000000010',
        name: 'RAM & Ổ cứng SSD',
        slug: 'ram-ssd',
        description: 'Bộ nhớ RAM DDR5 & SSD NVMe Gen4/Gen5',
      },
      {
        id: '20000000-0000-0000-0000-000000000016',
        parent_id: '20000000-0000-0000-0000-000000000010',
        name: 'Case & Tản nhiệt',
        slug: 'case-tan-nhiet',
        description: 'Vỏ máy tính & Tản nhiệt nước AIO / Tản khí',
      },
      {
        id: '20000000-0000-0000-0000-000000000008',
        parent_id: '20000000-0000-0000-0000-000000000020',
        name: 'Microphone & Soundcard',
        slug: 'microphone-audio',
        description: 'Micro Thu Âm Stream & Audio Interface',
      },
      {
        id: '20000000-0000-0000-0000-000000000017',
        parent_id: '20000000-0000-0000-0000-000000000020',
        name: 'Stream Deck & Capture Card',
        slug: 'stream-deck-capture',
        description: 'Bàn điều khiển Stream Deck & Thiết bị ghi hình Capture Card',
      },
      {
        id: '20000000-0000-0000-0000-000000000018',
        parent_id: '20000000-0000-0000-0000-000000000020',
        name: 'Webcam & Đèn Stream',
        slug: 'webcam-lighting',
        description: 'Webcam 4K & Đèn chiếu sáng Key Light chuyên nghiệp',
      },
      {
        id: '20000000-0000-0000-0000-000000000011',
        parent_id: '20000000-0000-0000-0000-000000000030',
        name: 'Ghế Gaming Ergonomic',
        slug: 'ghe-gaming-ban',
        description: 'Ghế gaming & Ghế công thái học',
      },
      {
        id: '20000000-0000-0000-0000-000000000019',
        parent_id: '20000000-0000-0000-0000-000000000030',
        name: 'Bàn Nâng Hạ Điện',
        slug: 'ban-nang-ha',
        description: 'Bàn làm việc nâng hạ thông minh (Standing Desk)',
      },
      {
        id: '20000000-0000-0000-0000-000000000021',
        parent_id: '20000000-0000-0000-0000-000000000030',
        name: 'Phụ kiện Setup & Decor',
        slug: 'phu-kien-setup',
        description: 'Tay nâng màn hình Arm, LED RGB & thảm trải bàn',
      },
    ],
    skipDuplicates: true,
  })
  console.log('✅ Gear Categories')

  // =============================================================
  // GEARS & GEAR MEDIA GENERATOR (300+ Distinct Products)
  // =============================================================
  const lenderIds = [
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000013',
  ]

  const categoryImages: Record<string, string[]> = {
    '20000000-0000-0000-0000-000000000002': [ // Chuột gaming
      'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1629429408209-1f912961dbd8?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1613141411244-0e4ac259d217?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1627850743564-20d3c0125ea8?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1748480248093-dc2827284840?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1756928626912-17d51297f43d?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1703052398270-27b5b394ee35?w=800&auto=format&fit=crop&q=80',
    ],
    '20000000-0000-0000-0000-000000000003': [ // Bàn phím cơ
      'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1595225476474-87563907a212?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1603481588273-2f908a9a7a1b?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1672173351203-89b1654742fc?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1636858507430-a1306162def1?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1722445423294-f3bc8317d93b?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1632125907236-b48eaaf35ddb?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1627510444490-95637baaf6cc?w=800&auto=format&fit=crop&q=80',
    ],
    '20000000-0000-0000-0000-000000000004': [ // Tai nghe gaming
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=800&auto=format&fit=crop&q=80',
    ],
    '20000000-0000-0000-0000-000000000007': [ // Tay cầm & VR
      'https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1628277613967-6abca504d0ac?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1622297845775-5ff3fef71d13?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1742509084930-a196684325d0?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1576633587382-13ddf37b1fc1?w=800&auto=format&fit=crop&q=80',
    ],
    '20000000-0000-0000-0000-000000000006': [ // Màn hình 144Hz
      'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1547082299-de196ea013d6?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1677685854218-94b2b0250575?w=800&auto=format&fit=crop&q=80',
    ],
    '20000000-0000-0000-0000-000000000012': [ // Màn hình 4K & OLED
      'https://images.unsplash.com/photo-1585792180666-f7347c490ee2?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1639342405971-a428b16b0f16?w=800&auto=format&fit=crop&q=80',
    ],
    '20000000-0000-0000-0000-000000000013': [ // Màn hình Cong & Ultrawide
      'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1705579609949-f4a73c9eee4f?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1760278041797-2a21a385f17c?w=800&auto=format&fit=crop&q=80',
    ],
    '20000000-0000-0000-0000-000000000008': [ // Microphone & Soundcard
      'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1598550476439-6847785fcea6?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1636996805273-64cb9ecadf16?w=800&auto=format&fit=crop&q=80',
    ],
    '20000000-0000-0000-0000-000000000017': [ // Stream Deck & Capture Card
      'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&auto=format&fit=crop&q=80',
    ],
    '20000000-0000-0000-0000-000000000018': [ // Webcam & Đèn Stream
      'https://images.unsplash.com/photo-1587826080692-f439cd0b70da?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1585060544812-6b45742d762f?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1760348213920-d2a90ed705fd?w=800&auto=format&fit=crop&q=80',
    ],
    '20000000-0000-0000-0000-000000000009': [ // Card đồ họa (GPU)
      'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1741392078112-f3a5fe979bcf?w=800&auto=format&fit=crop&q=80',
    ],
    '20000000-0000-0000-0000-000000000014': [ // CPU & Mainboard
      'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1760708528862-c07b820354c6?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1644987708868-1a97a5341ec3?w=800&auto=format&fit=crop&q=80',
    ],
    '20000000-0000-0000-0000-000000000015': [ // RAM & Ổ cứng SSD
      'https://images.unsplash.com/photo-1562976540-1502c2145186?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=800&auto=format&fit=crop&q=80',
    ],
    '20000000-0000-0000-0000-000000000016': [ // Case & Tản nhiệt
      'https://images.unsplash.com/photo-1587202372616-b43abea06c2a?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1745412297990-02036b9a931f?w=800&auto=format&fit=crop&q=80',
    ],
    '20000000-0000-0000-0000-000000000011': [ // Ghế Gaming Ergonomic
      'https://images.unsplash.com/photo-1616588589676-62b3bd4ff6d2?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=800&auto=format&fit=crop&q=80',
    ],
    '20000000-0000-0000-0000-000000000019': [ // Bàn Nâng Hạ Điện
      'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1632923945815-c5a235ab458e?w=800&auto=format&fit=crop&q=80',
    ],
    '20000000-0000-0000-0000-000000000021': [ // Phụ kiện Setup & Decor
      'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=1000&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1593642532400-2682810df593?w=1000&auto=format&fit=crop&q=80',
    ],
  }

  const sourcePhotoIds = Object.values(categoryImages)
    .flat()
    .map((url) => new URL(url).pathname)
  const uniqueSourcePhotoIds = new Set(sourcePhotoIds)

  if (sourcePhotoIds.length < 60) {
    throw new Error(`Expected at least 60 catalog image sources, found ${sourcePhotoIds.length}`)
  }
  if (sourcePhotoIds.length !== uniqueSourcePhotoIds.size) {
    throw new Error('Catalog image sources must use unique Unsplash photo IDs')
  }
  for (const [categoryId, images] of Object.entries(categoryImages)) {
    if (images.length < 2) {
      throw new Error(`Category ${categoryId} needs at least two distinct image sources`)
    }
  }

  const imageUsage = new Map<string, number>()
  const stableHash = (value: string) => {
    let hash = 2166136261
    for (let index = 0; index < value.length; index++) {
      hash ^= value.charCodeAt(index)
      hash = Math.imul(hash, 16777619)
    }
    return hash >>> 0
  }
  const getImagesForCategory = (
    categoryId: string,
    brand: string,
    productName: string,
  ): [string, string] => {
    const pool = categoryImages[categoryId]
    if (!pool) {
      throw new Error(`Missing catalog image pool for category ${categoryId}`)
    }

    const productKey = `${categoryId}|${brand}|${productName}`
    const selectLeastUsed = (candidates: string[], salt: string) =>
      [...candidates].sort((left, right) => {
        const usageDifference =
          (imageUsage.get(left) ?? 0) - (imageUsage.get(right) ?? 0)
        if (usageDifference !== 0) return usageDifference
        return stableHash(`${productKey}|${salt}|${left}`) -
          stableHash(`${productKey}|${salt}|${right}`)
      })[0]

    const primary = selectLeastUsed(pool, 'primary')
    imageUsage.set(primary, (imageUsage.get(primary) ?? 0) + 1)

    const secondary = selectLeastUsed(
      pool.filter((url) => url !== primary),
      'secondary',
    )
    imageUsage.set(secondary, (imageUsage.get(secondary) ?? 0) + 1)

    return [primary, secondary]
  }

  // Preserve initial 17 gears (referenced by orders and tests)
  const initialGears = [
    {
      id: '30000000-0000-0000-0000-000000000001',
      lender_id: '00000000-0000-0000-0000-000000000002',
      category_id: '20000000-0000-0000-0000-000000000002',
      name: 'Chuột Logitech G Pro X Superlight 2',
      brand: 'Logitech',
      model: 'G Pro X Superlight 2',
      serial_number: 'SN-GPXSL2-001',
      description: 'Chuột gaming không dây siêu nhẹ 60g, sensor HERO 2 32K',
      specifications: { connectivity: 'wireless', dpi_max: 32000, weight_g: 60, rgb: false, color: 'white' },
      value: 3500000,
      rent_price_per_day: 60000,
      status: 'available' as const,
      approval_status: 'approved' as const,
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
      specifications: { layout: 'TKL', switch_type: 'Gateron Jupiter Red', keycap_material: 'PBT', backlight: 'RGB', color: 'carbon_black' },
      value: 4200000,
      rent_price_per_day: 80000,
      status: 'available' as const,
      approval_status: 'approved' as const,
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
      specifications: { connectivity: 'wireless', driver_mm: 50, frequency_hz: '15-21000', microphone: true, color: 'black/red' },
      value: 2800000,
      rent_price_per_day: 55000,
      status: 'available' as const,
      approval_status: 'approved' as const,
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
      specifications: { size_inch: 27, resolution: '2560x1440', refresh_hz: 240, panel: 'IPS', hdr: 'HDR600' },
      value: 12000000,
      rent_price_per_day: 200000,
      status: 'available' as const,
      approval_status: 'approved' as const,
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
      status: 'available' as const,
      approval_status: 'approved' as const,
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
      specifications: { layout: '65%', switch_type: 'AKKO CS Ocean Blue', keycap_material: 'PBT', backlight: 'RGB' },
      value: 1500000,
      rent_price_per_day: 35000,
      status: 'rented' as const,
      approval_status: 'approved' as const,
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
      specifications: { connectivity: 'wireless', driver_mm: 40, frequency_hz: '4-40000', microphone: true, anc: true },
      value: 8000000,
      rent_price_per_day: 120000,
      status: 'available' as const,
      approval_status: 'approved' as const,
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
      specifications: { size_inch: 27, resolution: '2560x1440', refresh_hz: 240, panel: 'OLED' },
      value: 15000000,
      rent_price_per_day: 250000,
      status: 'available' as const,
      approval_status: 'pending' as const,
      approved_by: null,
      approved_at: null,
    },
    {
      id: '30000000-0000-0000-0000-000000000009',
      lender_id: '00000000-0000-0000-0000-000000000013',
      category_id: '20000000-0000-0000-0000-000000000002',
      name: 'W2 Logitech G502 X Plus',
      brand: 'Logitech',
      model: 'G502 X Plus',
      serial_number: 'SN-W2-G502X-009',
      description: 'Week 2 approved demo mouse for escrow and wallet flows',
      specifications: { connectivity: 'wireless', dpi_max: 25600, rgb: true, color: 'black' },
      value: 3200000,
      rent_price_per_day: 70000,
      status: 'available' as const,
      approval_status: 'approved' as const,
      approved_by: '00000000-0000-0000-0000-000000000014',
      approved_at: daysAgo(1),
    },
    {
      id: '30000000-0000-0000-0000-000000000010',
      lender_id: '00000000-0000-0000-0000-000000000013',
      category_id: '20000000-0000-0000-0000-000000000003',
      name: 'W2 Keychron K8 Pro',
      brand: 'Keychron',
      model: 'K8 Pro',
      serial_number: 'SN-W2-K8PRO-010',
      description: 'Week 2 approved demo keyboard for escrow and wallet flows',
      specifications: { layout: 'TKL', switch_type: 'Brown', keycap_material: 'PBT', backlight: 'RGB' },
      value: 2800000,
      rent_price_per_day: 65000,
      status: 'available' as const,
      approval_status: 'approved' as const,
      approved_by: '00000000-0000-0000-0000-000000000014',
      approved_at: daysAgo(1),
    },
    {
      id: '30000000-0000-0000-0000-000000000011',
      lender_id: '00000000-0000-0000-0000-000000000013',
      category_id: '20000000-0000-0000-0000-000000000002',
      name: 'W2 Test Mouse INSUFFICIENT_CREDIT',
      brand: 'Test', model: 'TM-IC-011',
      serial_number: 'SN-W2-TMIC-011',
      description: 'Test gear for INSUFFICIENT_CREDIT scenario',
      specifications: { color: 'black' }, value: 100000, rent_price_per_day: 50000,
      status: 'available' as const, approval_status: 'approved' as const,
      approved_by: '00000000-0000-0000-0000-000000000014', approved_at: daysAgo(1),
    },
    {
      id: '30000000-0000-0000-0000-000000000012',
      lender_id: '00000000-0000-0000-0000-000000000013',
      category_id: '20000000-0000-0000-0000-000000000002',
      name: 'W2 Test Mouse ESCROW_INVALID_STATUS',
      brand: 'Test', model: 'TM-EIS-012',
      serial_number: 'SN-W2-TMEIS-012',
      description: 'Test gear for ESCROW_INVALID_STATUS',
      specifications: { color: 'white' }, value: 2000000, rent_price_per_day: 70000,
      status: 'available' as const, approval_status: 'approved' as const,
      approved_by: '00000000-0000-0000-0000-000000000014', approved_at: daysAgo(1),
    },
    {
      id: '30000000-0000-0000-0000-000000000013',
      lender_id: '00000000-0000-0000-0000-000000000013',
      category_id: '20000000-0000-0000-0000-000000000002',
      name: 'W2 Test Mouse Release Traditional',
      brand: 'Test', model: 'TM-RT-013',
      serial_number: 'SN-W2-TMRT-013',
      description: 'Test gear for release traditional happy path',
      specifications: { color: 'red' }, value: 2000000, rent_price_per_day: 70000,
      status: 'available' as const, approval_status: 'approved' as const,
      approved_by: '00000000-0000-0000-0000-000000000014', approved_at: daysAgo(1),
    },
    {
      id: '30000000-0000-0000-0000-000000000014',
      lender_id: '00000000-0000-0000-0000-000000000013',
      category_id: '20000000-0000-0000-0000-000000000003',
      name: 'W2 Test Keyboard Release Credit',
      brand: 'Test', model: 'TK-RC-014',
      serial_number: 'SN-W2-TKRC-014',
      description: 'Test gear for release credit-line happy path',
      specifications: { layout: 'TKL' }, value: 2000000, rent_price_per_day: 80000,
      status: 'available' as const, approval_status: 'approved' as const,
      approved_by: '00000000-0000-0000-0000-000000000014', approved_at: daysAgo(1),
    },
    {
      id: '30000000-0000-0000-0000-000000000015',
      lender_id: '00000000-0000-0000-0000-000000000013',
      category_id: '20000000-0000-0000-0000-000000000002',
      name: 'W2 Test Mouse Compensate Traditional',
      brand: 'Test', model: 'TM-CT-015',
      serial_number: 'SN-W2-TMCT-015',
      description: 'Test gear for compensate traditional',
      specifications: { color: 'blue' }, value: 1500000, rent_price_per_day: 60000,
      status: 'available' as const, approval_status: 'approved' as const,
      approved_by: '00000000-0000-0000-0000-000000000014', approved_at: daysAgo(1),
    },
    {
      id: '30000000-0000-0000-0000-000000000016',
      lender_id: '00000000-0000-0000-0000-000000000013',
      category_id: '20000000-0000-0000-0000-000000000003',
      name: 'W2 Test Keyboard Compensate Credit',
      brand: 'Test', model: 'TK-CC-016',
      serial_number: 'SN-W2-TKCC-016',
      description: 'Test gear for compensate credit-line',
      specifications: { layout: '65%' }, value: 2500000, rent_price_per_day: 90000,
      status: 'available' as const, approval_status: 'approved' as const,
      approved_by: '00000000-0000-0000-0000-000000000014', approved_at: daysAgo(1),
    },
    {
      id: '30000000-0000-0000-0000-000000000017',
      lender_id: '00000000-0000-0000-0000-000000000013',
      category_id: '20000000-0000-0000-0000-000000000002',
      name: 'W2 Test Mouse Release Idempotent',
      brand: 'Test', model: 'TM-RI-017',
      serial_number: 'SN-W2-TMRI-017',
      description: 'Test gear for release idempotent',
      specifications: { color: 'green' }, value: 1000000, rent_price_per_day: 50000,
      status: 'available' as const, approval_status: 'approved' as const,
      approved_by: '00000000-0000-0000-0000-000000000014', approved_at: daysAgo(1),
    },
  ]

  // Catalogs for generating 300+ realistic products
  const productCatalogs = [
    // 1. Chuột gaming (40 items)
    {
      catId: '20000000-0000-0000-0000-000000000002',
      brand: 'Logitech',
      models: ['G Pro X Superlight 2', 'G502 X LIGHTSPEED', 'G305 LIGHTSPEED', 'G703 LIGHTSPEED', 'G502 HERO', 'G203 Lightsync', 'G Pro Wireless'],
      baseVal: 1500000, baseRent: 35000,
      specGen: (m: string) => ({ connectivity: 'wireless', dpi_max: 25600, weight_g: 60, rgb: true }),
    },
    {
      catId: '20000000-0000-0000-0000-000000000002',
      brand: 'Razer',
      models: ['Viper V3 Pro', 'DeathAdder V3 Pro', 'Basilisk V3 Pro', 'Naga V2 Pro', 'Viper Mini Signature', 'Orochi V2'],
      baseVal: 2200000, baseRent: 45000,
      specGen: (m: string) => ({ connectivity: 'wireless', dpi_max: 30000, weight_g: 58, rgb: false }),
    },
    {
      catId: '20000000-0000-0000-0000-000000000002',
      brand: 'SteelSeries',
      models: ['Aerox 3 Wireless', 'Prime Wireless', 'Rival 5', 'Aerox 5 Wireless', 'Aerox 9 Wireless'],
      baseVal: 1800000, baseRent: 40000,
      specGen: (m: string) => ({ connectivity: 'wireless', dpi_max: 18000, weight_g: 66, rgb: true }),
    },
    {
      catId: '20000000-0000-0000-0000-000000000002',
      brand: 'Glorious',
      models: ['Model O 2 Wireless', 'Model D 2 Wireless', 'Series One PRO', 'Model I 2 Wireless'],
      baseVal: 1900000, baseRent: 42000,
      specGen: (m: string) => ({ connectivity: 'wireless', dpi_max: 26000, weight_g: 68, rgb: true }),
    },
    {
      catId: '20000000-0000-0000-0000-000000000002',
      brand: 'BenQ ZOWIE',
      models: ['EC2-CW Wireless', 'FK2-C', 'ZA13-C', 'S2-C', 'EC1-CW'],
      baseVal: 3200000, baseRent: 70000,
      specGen: (m: string) => ({ connectivity: 'wireless', dpi_max: 3200, weight_g: 77, rgb: false }),
    },

    // 2. Bàn phím cơ (50 items)
    {
      catId: '20000000-0000-0000-0000-000000000003',
      brand: 'Keychron',
      models: ['Q1 Pro', 'Q2 Max', 'K2 Pro Wireless', 'V1 Max Gasket', 'Lemokey L3', 'Q3 Max TKL', 'K8 Pro', 'Q5 Pro 96%'],
      baseVal: 3500000, baseRent: 75000,
      specGen: (m: string) => ({ layout: '75%', switch_type: 'Gateron Jupiter Red', keycap: 'PBT Double-shot', backlight: 'RGB' }),
    },
    {
      catId: '20000000-0000-0000-0000-000000000003',
      brand: 'Razer',
      models: ['Huntsman V3 Pro TKL', 'BlackWidow V4 Pro', 'DeathStalker V2 Pro Wireless', 'Huntsman Mini 60%'],
      baseVal: 4500000, baseRent: 90000,
      specGen: (m: string) => ({ layout: 'TKL', switch_type: 'Razer Analog Optical Gen-2', keycap: 'PBT', backlight: 'Razer Chroma RGB' }),
    },
    {
      catId: '20000000-0000-0000-0000-000000000003',
      brand: 'Akko',
      models: ['MOD007B PC', '3068B Plus Horizon', '5075B Plus', '3098B Multi-modes', 'MonsGeek M1W Aluminum'],
      baseVal: 2200000, baseRent: 45000,
      specGen: (m: string) => ({ layout: '75%', switch_type: 'Akko V3 Cream Yellow', keycap: 'PBT Cherry Profile', backlight: 'RGB' }),
    },
    {
      catId: '20000000-0000-0000-0000-000000000003',
      brand: 'Corsair',
      models: ['K100 RGB Mechanical', 'K70 MAX Magnetic', 'K65 PRO MINI 60%', 'K70 PRO RGB'],
      baseVal: 4800000, baseRent: 95000,
      specGen: (m: string) => ({ layout: 'Full-size', switch_type: 'CORSAIR MGX Magnetic', keycap: 'PBT Double-shot', backlight: 'RGB' }),
    },
    {
      catId: '20000000-0000-0000-0000-000000000003',
      brand: 'ASUS ROG',
      models: ['ROG Azoth Custom 75%', 'ROG Scope II 96 Wireless', 'ROG Strix Flare II Animate'],
      baseVal: 5200000, baseRent: 110000,
      specGen: (m: string) => ({ layout: '75%', switch_type: 'ROG NX Snow Linear', keycap: 'PBT', display: 'OLED Smart Display' }),
    },

    // 3. Tai nghe gaming (40 items)
    {
      catId: '20000000-0000-0000-0000-000000000004',
      brand: 'HyperX',
      models: ['Cloud II Wireless', 'Cloud Alpha Wireless 300h', 'Cloud III Wireless', 'Cloud Stinger 2 Core'],
      baseVal: 2600000, baseRent: 50000,
      specGen: (m: string) => ({ connectivity: '2.4GHz Wireless', driver_mm: 53, surround: 'DTS Headphone:X', battery_h: 300 }),
    },
    {
      catId: '20000000-0000-0000-0000-000000000004',
      brand: 'Logitech G',
      models: ['G PRO X 2 LIGHTSPEED', 'G733 LIGHTSPEED RGB', 'G435 LIGHTSPEED Wireless', 'G535 Wireless'],
      baseVal: 4200000, baseRent: 85000,
      specGen: (m: string) => ({ connectivity: 'Bluetooth / LIGHTSPEED', driver_mm: 50, diaphragm: 'Graphene 50mm' }),
    },
    {
      catId: '20000000-0000-0000-0000-000000000004',
      brand: 'SteelSeries',
      models: ['Arctis Nova Pro Wireless', 'Arctis Nova 7 Wireless', 'Arctis 9 Dual Wireless', 'Arctis Nova 1'],
      baseVal: 6500000, baseRent: 130000,
      specGen: (m: string) => ({ connectivity: 'Wireless + ANC', anc: true, audio_dac: 'GameDAC Gen 2' }),
    },
    {
      catId: '20000000-0000-0000-0000-000000000004',
      brand: 'Sony',
      models: ['INZONE H9 Wireless ANC', 'INZONE H7 Wireless', 'WH-1000XM5 Flagship', 'INZONE H3 Wired'],
      baseVal: 5500000, baseRent: 110000,
      specGen: (m: string) => ({ connectivity: 'Bluetooth 5.3 + 2.4G', spatial_audio: '360 Spatial Sound', anc: true }),
    },

    // 4. Màn hình subcategories
    {
      catId: '20000000-0000-0000-0000-000000000006', // 144Hz - 240Hz
      brand: 'ASUS ROG',
      models: ['ROG Swift PG279QM 2K 240Hz', 'TUF Gaming VG27AQ 165Hz', 'ROG Strix XG27AQMR 300Hz'],
      baseVal: 14000000, baseRent: 220000,
      specGen: (m: string) => ({ size_inch: 27, resolution: '2560x1440', refresh_hz: 240, panel: 'Fast IPS', response_ms: 1 }),
    },
    {
      catId: '20000000-0000-0000-0000-000000000012', // 4K & OLED
      brand: 'LG UltraGear',
      models: ['27GR95QE OLED 240Hz', '32GQ950-B 4K 144Hz', '27GP850-B Nano IPS 180Hz'],
      baseVal: 18000000, baseRent: 280000,
      specGen: (m: string) => ({ size_inch: 27, resolution: '3840x2160', refresh_hz: 240, panel: 'OLED', hdr: 'HDR True Black 400' }),
    },
    {
      catId: '20000000-0000-0000-0000-000000000013', // Cong & Ultrawide
      brand: 'Samsung Odyssey',
      models: ['Odyssey OLED G8 34" 175Hz', 'Odyssey G9 49" Curved 240Hz', 'Odyssey OLED G9 49"'],
      baseVal: 24000000, baseRent: 380000,
      specGen: (m: string) => ({ size_inch: 34, resolution: '3440x1440', refresh_hz: 175, panel: 'Neo Quantum OLED', curvature: '1800R' }),
    },

    // 5. Tay cầm & VR
    {
      catId: '20000000-0000-0000-0000-000000000007',
      brand: 'Sony PlayStation',
      models: ['DualSense Edge Wireless Controller', 'DualSense PS5 Controller Cosmic Red', 'DualSense Midnight Black', 'PS VR2 Headset'],
      baseVal: 4800000, baseRent: 90000,
      specGen: (m: string) => ({ platform: 'PS5 / PC', haptic_feedback: true, adaptive_triggers: true, battery: 'Rechargeable Li-Ion' }),
    },
    {
      catId: '20000000-0000-0000-0000-000000000007',
      brand: 'Meta',
      models: ['Quest 3 VR 128GB Headset', 'Quest 3 VR 512GB Headset', 'Quest Pro Mixed Reality', 'Quest 2 VR 128GB'],
      baseVal: 13000000, baseRent: 220000,
      specGen: (m: string) => ({ display: '4K+ Infinite Display', tracking: 'Inside-out 6DOF', chip: 'Snapdragon XR2 Gen 2' }),
    },

    // 6. Stream & Audio subcategories
    {
      catId: '20000000-0000-0000-0000-000000000008', // Microphone & Soundcard
      brand: 'Shure',
      models: ['SM7B Cardioid Dynamic Vocal Mic', 'MV7 USB/XLR Podcast Mic', 'MV7+ Digital Dynamic Mic'],
      baseVal: 9500000, baseRent: 180000,
      specGen: (m: string) => ({ type: 'Dynamic Vocal Mic', connection: 'XLR & USB', frequency_range: '50Hz - 20kHz' }),
    },
    {
      catId: '20000000-0000-0000-0000-000000000017', // Stream Deck & Capture Card
      brand: 'Elgato',
      models: ['Stream Deck MK.2 White', 'Stream Deck + Dial Controller', 'Cam Link 4K Capture Card', 'HD60 X External Capture'],
      baseVal: 4500000, baseRent: 80000,
      specGen: (m: string) => ({ type: 'Studio Controller', keys: '15 LCD Keys', connectivity: 'USB 2.0 / USB 3.0' }),
    },
    {
      catId: '20000000-0000-0000-0000-000000000018', // Webcam & Đèn Stream
      brand: 'Logitech',
      models: ['Brio 4K Ultra HD Webcam', 'Litra Glow Premium LED Light', 'StreamCam Full HD 60fps'],
      baseVal: 3800000, baseRent: 65000,
      specGen: (m: string) => ({ resolution: '4K/30fps, 1080p/60fps', hdr: true, microphone: 'Dual omnidirectional' }),
    },

    // 7. PC & Linh kiện subcategories
    {
      catId: '20000000-0000-0000-0000-000000000009', // GPU
      brand: 'ASUS ROG',
      models: ['ROG Strix GeForce RTX 4090 24GB', 'ROG Strix RTX 4080 Super 16GB', 'TUF Gaming RTX 4070 Ti Super 16GB'],
      baseVal: 45000000, baseRent: 650000,
      specGen: (m: string) => ({ vram: '24GB GDDR6X', bus_width: '384-bit', cooling: 'Axial-tech 3.5 slot' }),
    },
    {
      catId: '20000000-0000-0000-0000-000000000014', // CPU & Mainboard
      brand: 'Intel',
      models: ['Core i9-14900K Flagship CPU', 'Core i7-14700K Gaming CPU', 'ROG Maximus Z790 Hero Mainboard'],
      baseVal: 15000000, baseRent: 250000,
      specGen: (m: string) => ({ cores: '24 Cores (8P + 16E)', socket: 'LGA1700', max_clock: '6.0 GHz' }),
    },
    {
      catId: '20000000-0000-0000-0000-000000000015', // RAM & SSD
      brand: 'Corsair',
      models: ['Dominator Titanium DDR5 64GB 7200MHz', 'MP700 PRO PCIe 5.0 2TB SSD', 'Vengeance RGB DDR5 32GB'],
      baseVal: 7500000, baseRent: 120000,
      specGen: (m: string) => ({ capacity: '64GB (2x32GB)', type: 'DDR5', speed: '7200 MT/s' }),
    },
    // 8. Ghế & Setup Gaming subcategories
    {
      catId: '20000000-0000-0000-0000-000000000011', // Ghế Gaming Ergonomic
      brand: 'Secretlab',
      models: ['TITAN Evo 2022 SoftWeave Plus', 'Herman Miller x Logitech G Embody', 'Noblechairs HERO Real Leather'],
      baseVal: 14000000, baseRent: 200000,
      specGen: (m: string) => ({ material: 'SoftWeave Plus / Leather', lumbar: 'Multi-direction L-ADAPT' }),
    },
    {
      catId: '20000000-0000-0000-0000-000000000019', // Bàn Nâng Hạ Điện
      brand: 'FlexiSpot',
      models: ['E7 Pro Standing Desk Dual-Motor', 'Secretlab MAGNUS Pro Electric Desk'],
      baseVal: 12500000, baseRent: 190000,
      specGen: (m: string) => ({ motor: 'Dual Motor', height_range_cm: '60-125cm', max_load_kg: 125 }),
    },
    {
      catId: '20000000-0000-0000-0000-000000000021', // Phụ kiện Setup
      brand: 'HumanMotion',
      models: ['Monitor Arm T9 Pro Dual Monitor', 'Nanoleaf Lines RGB LED Desk Kit', 'Elgato Master Mount L'],
      baseVal: 3500000, baseRent: 50000,
      specGen: (m: string) => ({ type: 'Dual Monitor Arm', max_size_inch: 35, spring_type: 'Gas Spring' }),
    },
    {
      catId: '20000000-0000-0000-0000-000000000011',
      brand: 'Noblechairs',
      models: ['HERO Real Leather Black', 'ICON Gaming Chair Hybrid Material', 'EPIC Mercedes-AMG PETRONAS Edition'],
      baseVal: 14000000, baseRent: 220000,
      specGen: (m: string) => ({ material: 'Top Grain Real Leather', frame: 'Steel Frame', max_load_kg: 150 }),
    },
  ]

  const generatedGears: any[] = [...initialGears]
  const generatedMedia: any[] = []

  let currentGearIdx = 18
  const totalTargetGears = 310

  while (generatedGears.length < totalTargetGears) {
    for (const catalog of productCatalogs) {
      if (generatedGears.length >= totalTargetGears) break

      const modelName = catalog.models[(currentGearIdx - 18) % catalog.models.length]
      const editionSuffix = currentGearIdx % 3 === 0 ? ' (Edition Black)' : currentGearIdx % 3 === 1 ? ' (Edition White)' : ' (Special Edition)'
      const productName = `${catalog.brand} ${modelName}${editionSuffix}`
      const gearUuid = `30000000-0000-0000-0000-${currentGearIdx.toString().padStart(12, '0')}`
      const lenderId = lenderIds[currentGearIdx % lenderIds.length]

      const priceVariation = 1 + ((currentGearIdx % 7) - 3) * 0.05
      const gearValue = Math.round((catalog.baseVal * priceVariation) / 50000) * 50000
      const rentFee = Math.round((catalog.baseRent * priceVariation) / 5000) * 5000

      generatedGears.push({
        id: gearUuid,
        lender_id: lenderId,
        category_id: catalog.catId,
        name: productName,
        brand: catalog.brand,
        model: modelName,
        serial_number: `SN-MTX-${currentGearIdx.toString().padStart(4, '0')}`,
        description: `${productName} hàng chính hãng, tình trạng mới 98-99%, đầy đủ phụ kiện cho thuê tại Mutux.`,
        specifications: catalog.specGen(modelName),
        value: gearValue,
        rent_price_per_day: rentFee,
        status: currentGearIdx % 10 === 0 ? 'rented' : 'available',
        approval_status: 'approved',
        approved_by: '00000000-0000-0000-0000-000000000001',
        approved_at: daysAgo((currentGearIdx % 30) + 1),
      })

      currentGearIdx++
    }
  }

  let mediaIdx = 1
  for (const gear of generatedGears) {
    const [primaryImgUrl, secondaryImgUrl] = getImagesForCategory(
      gear.category_id,
      gear.brand,
      gear.name,
    )
    for (const [imageIndex, url] of [primaryImgUrl, secondaryImgUrl].entries()) {
      generatedMedia.push({
        id: `40000000-0000-0000-0000-${mediaIdx.toString().padStart(12, '0')}`,
        gear_id: gear.id,
        type: 'image',
        url,
        is_primary: imageIndex === 0,
        sort_order: imageIndex + 1,
      })
      mediaIdx++
    }
  }

  await prisma.gear.createMany({
    data: generatedGears,
    skipDuplicates: true,
  })
  console.log(`✅ Gears (${generatedGears.length} products seeded)`)

  await prisma.$transaction([
    prisma.gearMedia.deleteMany({
      where: { id: { in: generatedMedia.map((media) => media.id) } },
    }),
    prisma.gearMedia.createMany({ data: generatedMedia }),
  ])
  console.log(`✅ Gear Media (${generatedMedia.length} media items seeded)`)

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
        expired_at: null,
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
        expired_at: null,
      },
      {
        id: '50000000-0000-0000-0000-000000000005',
        user_id: '00000000-0000-0000-0000-000000000012',
        credit_partner_id: '10000000-0000-0000-0000-000000000002',
        total_limit: 10000000,
        display_balance: 6000000,
        locked_balance: 4000000,
        outstanding_debt: 0,
        status: 'active',
        partner_ref_id: 'MCC-R-W2',
        approved_at: daysAgo(10),
        expired_at: null,
      },
      {
        id: '50000000-0000-0000-0000-000000000003',
        user_id: '00000000-0000-0000-0000-000000000008',
        credit_partner_id: '10000000-0000-0000-0000-000000000002',
        total_limit: 10000000,
        display_balance: 9000000,
        locked_balance: 1000000,
        outstanding_debt: 0,
        status: 'active',
        partner_ref_id: 'VCP-R001',
        approved_at: daysAgo(15),
        expired_at: null,
      },
      {
        id: '50000000-0000-0000-0000-000000000004',
        user_id: '00000000-0000-0000-0000-000000000010',
        credit_partner_id: '10000000-0000-0000-0000-000000000002',
        total_limit: 3000000,
        display_balance: 2500000,
        locked_balance: 0,
        outstanding_debt: 500000,
        status: 'active',
        partner_ref_id: 'VCP-R002',
        approved_at: daysAgo(60),
        expired_at: null,
      },
    ],
    skipDuplicates: true,
  })
  console.log('✅ Mutux Wallets')

  // =============================================================
  // RENTER WALLETS
  // =============================================================
  await prisma.renterWallet.createMany({
    data: [
      {
        id: '51000000-0000-0000-0000-000000000001',
        user_id: '00000000-0000-0000-0000-000000000011',
        balance: 500000,
        locked_balance: 4500000,
        status: 'active',
      },
      {
        id: '51000000-0000-0000-0000-000000000002',
        user_id: '00000000-0000-0000-0000-000000000012',
        balance: 200000,
        locked_balance: 0,
        status: 'active',
      },
      {
        id: '51000000-0000-0000-0000-000000000003',
        user_id: '00000000-0000-0000-0000-000000000007',
        balance: 500000,
        locked_balance: 0,
        status: 'active',
      },
    ],
    skipDuplicates: true,
  })
  console.log('✅ Renter Wallets')

  // =============================================================
  // LENDER WALLETS
  // =============================================================
  await prisma.lenderWallet.createMany({
    data: [
      { id: '60000000-0000-0000-0000-000000000001', lender_id: '00000000-0000-0000-0000-000000000002', balance: 1500000, total_withdrawn: 5000000, status: 'active' },
      { id: '60000000-0000-0000-0000-000000000002', lender_id: '00000000-0000-0000-0000-000000000003', balance: 800000, total_withdrawn: 2000000, status: 'active' },
      { id: '60000000-0000-0000-0000-000000000003', lender_id: '00000000-0000-0000-0000-000000000004', balance: 2200000, total_withdrawn: 3500000, status: 'active' },
      { id: '60000000-0000-0000-0000-000000000004', lender_id: '00000000-0000-0000-0000-000000000005', balance: 0, total_withdrawn: 0, status: 'active' },
      { id: '60000000-0000-0000-0000-000000000005', lender_id: '00000000-0000-0000-0000-000000000013', balance: 0, total_withdrawn: 0, status: 'active' },
    ],
    skipDuplicates: true,
  })
  console.log('✅ Lender Wallets')

  // =============================================================
  // BANK ACCOUNTS
  // =============================================================
  await prisma.bankAccount.createMany({
    data: [
      { id: '70000000-0000-0000-0000-000000000001', user_id: '00000000-0000-0000-0000-000000000002', bank_name: 'Vietcombank', bank_code: 'VCB', account_number: '0071000123456', account_holder: 'NGUYEN VAN AN', is_default: true, is_verified: true },
      { id: '70000000-0000-0000-0000-000000000002', user_id: '00000000-0000-0000-0000-000000000003', bank_name: 'Techcombank', bank_code: 'TCB', account_number: '9021000234567', account_holder: 'TRAN THI BINH', is_default: true, is_verified: true },
      { id: '70000000-0000-0000-0000-000000000003', user_id: '00000000-0000-0000-0000-000000000004', bank_name: 'MB Bank', bank_code: 'MB', account_number: '0391000345678', account_holder: 'LE MINH CUONG', is_default: true, is_verified: true },
      { id: '70000000-0000-0000-0000-000000000004', user_id: '00000000-0000-0000-0000-000000000006', bank_name: 'VPBank', bank_code: 'VPB', account_number: '2691000456789', account_holder: 'HOANG DUC EM', is_default: true, is_verified: false },
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
      // W2: pending_confirm, credit_line, deposit exceeds credit limit -> INSUFFICIENT_CREDIT
      // renter=007 has mutux wallet with limit=3M; deposit=4M > 3M
      {
        id: '80000000-0000-0000-0000-000000000007',
        order_code: 'W2-0007-IC',
        renter_id: '00000000-0000-0000-0000-000000000007',
        gear_id: '30000000-0000-0000-0000-000000000011',
        lender_id: '00000000-0000-0000-0000-000000000013',
        start_date: dateOffset(3),
        end_date: dateOffset(5),
        duration_days: 2,
        snapped_rent_price_per_day: 50000,
        rental_fee: 100000,
        deposit_amount: 4000000,
        deposit_type: 'credit_line',
        status: 'pending_confirm',
        shipping_address: 'W2 Test Address',
        shipping_name: 'Vu Lan Phuong',
        shipping_phone: '0902000007',
      },
      // W2: returning, traditional, escrow pending -> ESCROW_INVALID_STATUS
      {
        id: '80000000-0000-0000-0000-000000000008',
        order_code: 'W2-0008-EIS',
        renter_id: '00000000-0000-0000-0000-000000000011',
        gear_id: '30000000-0000-0000-0000-000000000012',
        lender_id: '00000000-0000-0000-0000-000000000013',
        start_date: dateOffset(-5),
        end_date: dateOffset(-1),
        duration_days: 4,
        snapped_rent_price_per_day: 70000,
        rental_fee: 280000,
        deposit_amount: 3000000,
        deposit_type: 'traditional',
        status: 'returning',
        shipping_address: 'W2 Test Address',
        shipping_name: 'W2 Renter_cash',
        shipping_phone: '0902000011',
        lender_shipped_at: daysAgo(4),
        renter_received_at: daysAgo(3),
        renter_returned_at: hoursAgo(12),
      },
      // W2: returning, traditional, escrow locked -> Release Traditional
      {
        id: '80000000-0000-0000-0000-000000000009',
        order_code: 'W2-0009-RT',
        renter_id: '00000000-0000-0000-0000-000000000011',
        gear_id: '30000000-0000-0000-0000-000000000013',
        lender_id: '00000000-0000-0000-0000-000000000013',
        start_date: dateOffset(-5),
        end_date: dateOffset(-1),
        duration_days: 4,
        snapped_rent_price_per_day: 70000,
        rental_fee: 280000,
        deposit_amount: 3000000,
        deposit_type: 'traditional',
        status: 'returning',
        shipping_address: 'W2 Test Address',
        shipping_name: 'W2 Renter_cash',
        shipping_phone: '0902000011',
        lender_shipped_at: daysAgo(4),
        renter_received_at: daysAgo(3),
        renter_returned_at: hoursAgo(12),
      },
      // W2: returning, credit_line, escrow locked -> Release Credit
      {
        id: '80000000-0000-0000-0000-000000000010',
        order_code: 'W2-0010-RC',
        renter_id: '00000000-0000-0000-0000-000000000012',
        gear_id: '30000000-0000-0000-0000-000000000014',
        lender_id: '00000000-0000-0000-0000-000000000013',
        start_date: dateOffset(-5),
        end_date: dateOffset(-1),
        duration_days: 4,
        snapped_rent_price_per_day: 80000,
        rental_fee: 320000,
        deposit_amount: 2000000,
        deposit_type: 'credit_line',
        status: 'returning',
        shipping_address: 'W2 Test Address',
        shipping_name: 'W2 Renter_credit',
        shipping_phone: '0902000012',
        lender_shipped_at: daysAgo(4),
        renter_received_at: daysAgo(3),
        renter_returned_at: hoursAgo(12),
      },
      // W2: disputed, traditional, escrow locked -> Compensate Traditional
      {
        id: '80000000-0000-0000-0000-000000000011',
        order_code: 'W2-0011-CT',
        renter_id: '00000000-0000-0000-0000-000000000011',
        gear_id: '30000000-0000-0000-0000-000000000015',
        lender_id: '00000000-0000-0000-0000-000000000013',
        start_date: dateOffset(-10),
        end_date: dateOffset(-6),
        duration_days: 4,
        snapped_rent_price_per_day: 60000,
        rental_fee: 240000,
        deposit_amount: 1500000,
        deposit_type: 'traditional',
        status: 'disputed',
        shipping_address: 'W2 Test Address',
        shipping_name: 'W2 Renter_cash',
        shipping_phone: '0902000011',
        lender_shipped_at: daysAgo(9),
        renter_received_at: daysAgo(8),
        renter_returned_at: daysAgo(5),
        lender_received_back_at: daysAgo(4),
      },
      // W2: disputed, credit_line, escrow locked -> Compensate Credit
      {
        id: '80000000-0000-0000-0000-000000000012',
        order_code: 'W2-0012-CC',
        renter_id: '00000000-0000-0000-0000-000000000012',
        gear_id: '30000000-0000-0000-0000-000000000016',
        lender_id: '00000000-0000-0000-0000-000000000013',
        start_date: dateOffset(-10),
        end_date: dateOffset(-6),
        duration_days: 4,
        snapped_rent_price_per_day: 90000,
        rental_fee: 360000,
        deposit_amount: 2000000,
        deposit_type: 'credit_line',
        status: 'disputed',
        shipping_address: 'W2 Test Address',
        shipping_name: 'W2 Renter_credit',
        shipping_phone: '0902000012',
        lender_shipped_at: daysAgo(9),
        renter_received_at: daysAgo(8),
        renter_returned_at: daysAgo(5),
        lender_received_back_at: daysAgo(4),
      },
      // W2: returning with escrow already released -> Release Idempotent
      {
        id: '80000000-0000-0000-0000-000000000013',
        order_code: 'W2-0013-RI',
        renter_id: '00000000-0000-0000-0000-000000000011',
        gear_id: '30000000-0000-0000-0000-000000000017',
        lender_id: '00000000-0000-0000-0000-000000000013',
        start_date: dateOffset(-10),
        end_date: dateOffset(-6),
        duration_days: 4,
        snapped_rent_price_per_day: 50000,
        rental_fee: 200000,
        deposit_amount: 1000000,
        deposit_type: 'traditional',
        status: 'returning',
        shipping_address: 'W2 Test Address',
        shipping_name: 'W2 Renter_cash',
        shipping_phone: '0902000011',
        lender_shipped_at: daysAgo(9),
        renter_received_at: daysAgo(8),
        renter_returned_at: daysAgo(5),
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
      { id: '90000000-0000-0000-0000-000000000001', rental_order_id: '80000000-0000-0000-0000-000000000001', amount: 500000, source: 'renter_cash', status: 'released', locked_at: daysAgo(19), released_at: daysAgo(14) },
      { id: '90000000-0000-0000-0000-000000000002', rental_order_id: '80000000-0000-0000-0000-000000000002', amount: 300000, source: 'credit_line', status: 'locked', locked_at: daysAgo(2), released_at: null },
      { id: '90000000-0000-0000-0000-000000000003', rental_order_id: '80000000-0000-0000-0000-000000000003', amount: 500000, source: 'renter_cash', status: 'locked', locked_at: hoursAgo(3), released_at: null },
      { id: '90000000-0000-0000-0000-000000000005', rental_order_id: '80000000-0000-0000-0000-000000000005', amount: 1000000, source: 'renter_cash', status: 'compensated', locked_at: daysAgo(14), released_at: daysAgo(5) },
      { id: '90000000-0000-0000-0000-000000000006', rental_order_id: '80000000-0000-0000-0000-000000000006', amount: 1500000, source: 'credit_line', status: 'released', locked_at: daysAgo(1), released_at: daysAgo(1) },
      // W2 test escrows
      // No escrow for order 007 - INSUFFICIENT_CREDIT test should fail before creating escrow
      { id: '90000000-0000-0000-0000-000000000008', rental_order_id: '80000000-0000-0000-0000-000000000008', amount: 3000000, source: 'renter_cash', status: 'pending_return', released_at: null },
      { id: '90000000-0000-0000-0000-000000000009', rental_order_id: '80000000-0000-0000-0000-000000000009', amount: 3000000, source: 'renter_cash', status: 'locked', locked_at: daysAgo(3), released_at: null },
      { id: '90000000-0000-0000-0000-000000000010', rental_order_id: '80000000-0000-0000-0000-000000000010', amount: 2000000, source: 'credit_line', status: 'locked', locked_at: daysAgo(3), released_at: null },
      { id: '90000000-0000-0000-0000-000000000011', rental_order_id: '80000000-0000-0000-0000-000000000011', amount: 1500000, source: 'renter_cash', status: 'locked', locked_at: daysAgo(8), released_at: null },
      { id: '90000000-0000-0000-0000-000000000012', rental_order_id: '80000000-0000-0000-0000-000000000012', amount: 2000000, source: 'credit_line', status: 'locked', locked_at: daysAgo(8), released_at: null },
      { id: '90000000-0000-0000-0000-000000000013', rental_order_id: '80000000-0000-0000-0000-000000000013', amount: 1000000, source: 'renter_cash', status: 'released', locked_at: daysAgo(8), released_at: daysAgo(4) },
    ],
    skipDuplicates: true,
  })
  console.log('✅ Escrow Wallets')

  // =============================================================
  // PAYMENTS
  // =============================================================
  await prisma.payment.createMany({
    data: [
      { id: 'A0000000-0000-0000-0000-000000000001', rental_order_id: '80000000-0000-0000-0000-000000000001', user_id: '00000000-0000-0000-0000-000000000006', type: 'deposit', amount: 500000, method: 'momo', status: 'success', transaction_ref: 'MOMO-D001-001', paid_at: daysAgo(19) },
      { id: 'A0000000-0000-0000-0000-000000000002', rental_order_id: '80000000-0000-0000-0000-000000000001', user_id: '00000000-0000-0000-0000-000000000006', type: 'rental_fee', amount: 330000, method: 'momo', status: 'success', transaction_ref: 'MOMO-F001-001', paid_at: daysAgo(19) },
      { id: 'A0000000-0000-0000-0000-000000000003', rental_order_id: '80000000-0000-0000-0000-000000000002', user_id: '00000000-0000-0000-0000-000000000007', type: 'deposit', amount: 300000, method: 'credit_line', status: 'success', transaction_ref: 'CL-D001-002', paid_at: daysAgo(2) },
      { id: 'A0000000-0000-0000-0000-000000000004', rental_order_id: '80000000-0000-0000-0000-000000000002', user_id: '00000000-0000-0000-0000-000000000007', type: 'rental_fee', amount: 245000, method: 'credit_line', status: 'success', transaction_ref: 'CL-F001-002', paid_at: daysAgo(2) },
      { id: 'A0000000-0000-0000-0000-000000000005', rental_order_id: '80000000-0000-0000-0000-000000000003', user_id: '00000000-0000-0000-0000-000000000008', type: 'deposit', amount: 500000, method: 'bank_transfer', status: 'success', transaction_ref: 'BT-D001-003', paid_at: hoursAgo(4) },
      { id: 'A0000000-0000-0000-0000-000000000006', rental_order_id: '80000000-0000-0000-0000-000000000003', user_id: '00000000-0000-0000-0000-000000000008', type: 'rental_fee', amount: 240000, method: 'bank_transfer', status: 'success', transaction_ref: 'BT-F001-003', paid_at: hoursAgo(4) },
      { id: 'A0000000-0000-0000-0000-000000000007', rental_order_id: '80000000-0000-0000-0000-000000000005', user_id: '00000000-0000-0000-0000-000000000006', type: 'deposit', amount: 1000000, method: 'vnpay', status: 'success', transaction_ref: 'VP-D001-005', paid_at: daysAgo(14) },
      { id: 'A0000000-0000-0000-0000-000000000008', rental_order_id: '80000000-0000-0000-0000-000000000005', user_id: '00000000-0000-0000-0000-000000000006', type: 'rental_fee', amount: 560000, method: 'vnpay', status: 'success', transaction_ref: 'VP-F001-005', paid_at: daysAgo(14) },
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
      { id: 'B0000000-0000-0000-0000-000000000001', rental_order_id: '80000000-0000-0000-0000-000000000001', uploaded_by: '00000000-0000-0000-0000-000000000003', stage: 'pre_shipment', proof_type: 'image', file_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80', note: 'Máy đầy đủ phụ kiện, không trầy xước' },
      { id: 'B0000000-0000-0000-0000-000000000002', rental_order_id: '80000000-0000-0000-0000-000000000001', uploaded_by: '00000000-0000-0000-0000-000000000006', stage: 'post_received', proof_type: 'image', file_url: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&auto=format&fit=crop&q=80', note: 'Nhận hàng ok, hộp nguyên seal' },
      { id: 'B0000000-0000-0000-0000-000000000003', rental_order_id: '80000000-0000-0000-0000-000000000001', uploaded_by: '00000000-0000-0000-0000-000000000006', stage: 'pre_return', proof_type: 'image', file_url: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&auto=format&fit=crop&q=80', note: 'Trả hàng nguyên vẹn' },
      { id: 'B0000000-0000-0000-0000-000000000004', rental_order_id: '80000000-0000-0000-0000-000000000001', uploaded_by: '00000000-0000-0000-0000-000000000003', stage: 'post_returned', proof_type: 'image', file_url: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&auto=format&fit=crop&q=80', note: 'Nhận lại ok' },
      // Order 2 – active
      { id: 'B0000000-0000-0000-0000-000000000005', rental_order_id: '80000000-0000-0000-0000-000000000002', uploaded_by: '00000000-0000-0000-0000-000000000004', stage: 'pre_shipment', proof_type: 'image', file_url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80', note: 'Bàn phím sạch sẽ' },
      { id: 'B0000000-0000-0000-0000-000000000006', rental_order_id: '80000000-0000-0000-0000-000000000002', uploaded_by: '00000000-0000-0000-0000-000000000007', stage: 'post_received', proof_type: 'image', file_url: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=800&auto=format&fit=crop&q=80', note: 'Nhận đúng hàng' },
      // Order 5 – 4 stages
      { id: 'B0000000-0000-0000-0000-000000000007', rental_order_id: '80000000-0000-0000-0000-000000000005', uploaded_by: '00000000-0000-0000-0000-000000000002', stage: 'pre_shipment', proof_type: 'image', file_url: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&auto=format&fit=crop&q=80', note: null },
      { id: 'B0000000-0000-0000-0000-000000000008', rental_order_id: '80000000-0000-0000-0000-000000000005', uploaded_by: '00000000-0000-0000-0000-000000000006', stage: 'post_received', proof_type: 'image', file_url: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&auto=format&fit=crop&q=80', note: null },
      { id: 'B0000000-0000-0000-0000-000000000009', rental_order_id: '80000000-0000-0000-0000-000000000005', uploaded_by: '00000000-0000-0000-0000-000000000006', stage: 'pre_return', proof_type: 'image', file_url: 'https://images.unsplash.com/photo-1629429408209-1f912961dbd8?w=800&auto=format&fit=crop&q=80', note: 'Phím space bar bị vỡ clip mount' },
      { id: 'B0000000-0000-0000-0000-000000000010', rental_order_id: '80000000-0000-0000-0000-000000000005', uploaded_by: '00000000-0000-0000-0000-000000000002', stage: 'post_returned', proof_type: 'image', file_url: 'https://images.unsplash.com/photo-1613141411244-0e4ac259d217?w=800&auto=format&fit=crop&q=80', note: 'Xác nhận hư hỏng' },
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
      { id: 'C0000000-0000-0000-0000-000000000002', rental_order_id: '80000000-0000-0000-0000-000000000002', renter_id: '00000000-0000-0000-0000-000000000007', lender_id: '00000000-0000-0000-0000-000000000004', last_message_at: daysAgo(1) },
      { id: 'C0000000-0000-0000-0000-000000000003', rental_order_id: '80000000-0000-0000-0000-000000000005', renter_id: '00000000-0000-0000-0000-000000000006', lender_id: '00000000-0000-0000-0000-000000000002', last_message_at: daysAgo(8) },
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
      // W2: open dispute for Compensate Traditional
      {
        id: 'E0000000-0000-0000-0000-000000000002',
        rental_order_id: '80000000-0000-0000-0000-000000000011',
        reported_by: '00000000-0000-0000-0000-000000000013',
        reporter_role: 'lender',
        reason: 'device_damaged',
        description: 'Chuột bị hỏng nút bấm khi trả lại, yêu cầu bồi thường 600,000đ.',
        status: 'open',
        deduct_amount: 600000,
      },
      // W2: open dispute for Compensate Credit
      {
        id: 'E0000000-0000-0000-0000-000000000003',
        rental_order_id: '80000000-0000-0000-0000-000000000012',
        reported_by: '00000000-0000-0000-0000-000000000013',
        reporter_role: 'lender',
        reason: 'missing_accessory',
        description: 'Bàn phím bị mất 3 keycap, yêu cầu bồi thường 500,000đ.',
        status: 'open',
        deduct_amount: 500000,
      },
    ],
    skipDuplicates: true,
  })

  await prisma.disputeEvidence.createMany({
    data: [
      { id: 'F0000000-0000-0000-0000-000000000001', dispute_id: 'E0000000-0000-0000-0000-000000000001', uploaded_by: '00000000-0000-0000-0000-000000000002', media_type: 'image', url: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=800&auto=format&fit=crop&q=80' },
      { id: 'F0000000-0000-0000-0000-000000000002', dispute_id: 'E0000000-0000-0000-0000-000000000001', uploaded_by: '00000000-0000-0000-0000-000000000002', media_type: 'image', url: 'https://images.unsplash.com/photo-1595225476474-87563907a212?w=800&auto=format&fit=crop&q=80' },
      { id: 'F0000000-0000-0000-0000-000000000003', dispute_id: 'E0000000-0000-0000-0000-000000000001', uploaded_by: '00000000-0000-0000-0000-000000000006', media_type: 'image', url: 'https://images.unsplash.com/photo-1603481588273-2f908a9a7a1b?w=800&auto=format&fit=crop&q=80' },
      { id: 'F0000000-0000-0000-0000-000000000004', dispute_id: 'E0000000-0000-0000-0000-000000000002', uploaded_by: '00000000-0000-0000-0000-000000000013', media_type: 'image', url: 'https://images.unsplash.com/photo-1629429408209-1f912961dbd8?w=800&auto=format&fit=crop&q=80' },
      { id: 'F0000000-0000-0000-0000-000000000005', dispute_id: 'E0000000-0000-0000-0000-000000000003', uploaded_by: '00000000-0000-0000-0000-000000000013', media_type: 'image', url: 'https://images.unsplash.com/photo-1613141411244-0e4ac259d217?w=800&auto=format&fit=crop&q=80' },
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
      { id: 'a2000000-0000-0000-0000-000000000001', mutux_wallet_id: '50000000-0000-0000-0000-000000000001', type: 'limit_granted', amount: 5000000, display_balance_before: 0, display_balance_after: 5000000, direction: 'in', ref_type: null, ref_id: null, note: 'Cấp hạn mức lần đầu', status: 'success' },
      { id: 'a2000000-0000-0000-0000-000000000002', mutux_wallet_id: '50000000-0000-0000-0000-000000000002', type: 'deposit_lock', amount: 300000, display_balance_before: 3000000, display_balance_after: 2700000, direction: 'out', ref_type: 'rental_order', ref_id: '80000000-0000-0000-0000-000000000002', note: 'Khoá cọc đơn MX-2024-0002', status: 'success' },
      { id: 'a2000000-0000-0000-0000-000000000003', mutux_wallet_id: '50000000-0000-0000-0000-000000000002', type: 'limit_granted', amount: 3000000, display_balance_before: 0, display_balance_after: 3000000, direction: 'in', ref_type: null, ref_id: null, note: 'Cấp hạn mức lần đầu', status: 'success' },
      { id: 'a2000000-0000-0000-0000-000000000004', mutux_wallet_id: '50000000-0000-0000-0000-000000000003', type: 'limit_granted', amount: 10000000, display_balance_before: 0, display_balance_after: 10000000, direction: 'in', ref_type: null, ref_id: null, note: 'Cấp hạn mức lần đầu', status: 'success' },
      { id: 'a2000000-0000-0000-0000-000000000005', mutux_wallet_id: '50000000-0000-0000-0000-000000000003', type: 'deposit_lock', amount: 1000000, display_balance_before: 10000000, display_balance_after: 9000000, direction: 'out', ref_type: 'rental_order', ref_id: '80000000-0000-0000-0000-000000000003', note: 'Khoá cọc đơn MX-2024-0003', status: 'success' },
      { id: 'a2000000-0000-0000-0000-000000000006', mutux_wallet_id: '50000000-0000-0000-0000-000000000005', type: 'limit_granted', amount: 10000000, display_balance_before: 0, display_balance_after: 10000000, direction: 'in', ref_type: null, ref_id: null, note: 'W2 credit fixture limit granted', status: 'success' },
      { id: 'a2000000-0000-0000-0000-000000000007', mutux_wallet_id: '50000000-0000-0000-0000-000000000005', type: 'deposit_lock', amount: 2000000, display_balance_before: 10000000, display_balance_after: 8000000, direction: 'out', ref_type: 'rental_order', ref_id: '80000000-0000-0000-0000-000000000010', note: 'Khoá cọc đơn W2-0010-RC', status: 'success' },
      { id: 'a2000000-0000-0000-0000-000000000008', mutux_wallet_id: '50000000-0000-0000-0000-000000000005', type: 'deposit_lock', amount: 2000000, display_balance_before: 8000000, display_balance_after: 6000000, direction: 'out', ref_type: 'rental_order', ref_id: '80000000-0000-0000-0000-000000000012', note: 'Khoá cọc đơn W2-0012-CC', status: 'success' },
    ],
    skipDuplicates: true,
  })
  console.log('✅ Credit Transactions')

  // =============================================================
  // LENDER WALLET TRANSACTIONS
  // =============================================================
  await prisma.lenderWalletTransaction.createMany({
    data: [
      { id: 'a3000000-0000-0000-0000-000000000001', lender_wallet_id: '60000000-0000-0000-0000-000000000002', rental_order_id: '80000000-0000-0000-0000-000000000001', type: 'income', amount: 280500, balance_before: 0, balance_after: 280500, note: 'Thu nhập đơn MX-2024-0001 (sau phí 15%)' },
      { id: 'a3000000-0000-0000-0000-000000000002', lender_wallet_id: '60000000-0000-0000-0000-000000000002', rental_order_id: null, type: 'withdrawal', amount: 280500, balance_before: 280500, balance_after: 0, note: 'Rút về tài khoản Techcombank' },
      { id: 'a3000000-0000-0000-0000-000000000003', lender_wallet_id: '60000000-0000-0000-0000-000000000001', rental_order_id: '80000000-0000-0000-0000-000000000005', type: 'income', amount: 476000, balance_before: 1023500, balance_after: 1499500, note: 'Thu nhập đơn MX-2024-0005 (sau phí 15%)' },
      { id: 'a3000000-0000-0000-0000-000000000004', lender_wallet_id: '60000000-0000-0000-0000-000000000001', rental_order_id: '80000000-0000-0000-0000-000000000005', type: 'compensation', amount: 200000, balance_before: 1499500, balance_after: 1699500, note: 'Bồi thường dispute D001 – trừ cọc renter' },
      { id: 'a3000000-0000-0000-0000-000000000005', lender_wallet_id: '60000000-0000-0000-0000-000000000001', rental_order_id: null, type: 'withdrawal', amount: 199500, balance_before: 1699500, balance_after: 1500000, note: 'Rút một phần về Vietcombank' },
    ],
    skipDuplicates: true,
  })
  console.log('✅ Lender Wallet Transactions')

  // =============================================================
  // NOTIFICATIONS
  // =============================================================
  await prisma.notification.createMany({
    data: [
      { id: 'a4000000-0000-0000-0000-000000000001', user_id: '00000000-0000-0000-0000-000000000006', title: 'Đơn thuê đã hoàn thành', body: 'Đơn MX-2024-0001 đã hoàn thành. Cảm ơn bạn!', type: 'order', ref_type: 'rental_order', ref_id: '80000000-0000-0000-0000-000000000001', is_read: true },
      { id: 'a4000000-0000-0000-0000-000000000002', user_id: '00000000-0000-0000-0000-000000000003', title: 'Lender nhận lại hàng', body: 'Bạn đã xác nhận nhận lại tai nghe từ đơn MX-2024-0001.', type: 'order', ref_type: 'rental_order', ref_id: '80000000-0000-0000-0000-000000000001', is_read: true },
      { id: 'a4000000-0000-0000-0000-000000000003', user_id: '00000000-0000-0000-0000-000000000007', title: 'Đơn hàng đang giao', body: 'Bàn phím đang được giao cho bạn – MX-2024-0002.', type: 'order', ref_type: 'rental_order', ref_id: '80000000-0000-0000-0000-000000000002', is_read: false },
      { id: 'a4000000-0000-0000-0000-000000000004', user_id: '00000000-0000-0000-0000-000000000010', title: 'Đơn chờ xác nhận', body: 'Lender đang xem xét đơn MX-2024-0004 của bạn.', type: 'order', ref_type: 'rental_order', ref_id: '80000000-0000-0000-0000-000000000004', is_read: false },
      { id: 'a4000000-0000-0000-0000-000000000005', user_id: '00000000-0000-0000-0000-000000000006', title: 'Tranh chấp đã được giải quyết', body: 'Dispute đơn MX-2024-0005 đã xử lý. Trừ cọc 200,000đ.', type: 'dispute', ref_type: 'rental_order', ref_id: '80000000-0000-0000-0000-000000000005', is_read: false },
      { id: 'a4000000-0000-0000-0000-000000000006', user_id: '00000000-0000-0000-0000-000000000002', title: 'Bồi thường đã được cộng', body: 'Bạn nhận được 200,000đ bồi thường vào ví lender.', type: 'dispute', ref_type: 'rental_order', ref_id: '80000000-0000-0000-0000-000000000005', is_read: true },
      { id: 'a4000000-0000-0000-0000-000000000007', user_id: '00000000-0000-0000-0000-000000000008', title: 'Đơn đang vận chuyển', body: 'Lender đã giao hàng. Vui lòng theo dõi MX-2024-0003.', type: 'order', ref_type: 'rental_order', ref_id: '80000000-0000-0000-0000-000000000003', is_read: false },
    ],
    skipDuplicates: true,
  })
  console.log('✅ Notifications')

  // =============================================================
  // MEMBERSHIP PLANS
  // =============================================================
  await prisma.membershipPlan.createMany({
    data: [
      { id: 'a5000000-0000-0000-0000-000000000001', name: 'Basic', price: 99000, duration_days: 30, rental_discount_rate: 0.05, credit_fee_discount_rate: 0.00, priority_access: false },
      { id: 'a5000000-0000-0000-0000-000000000002', name: 'Pro', price: 299000, duration_days: 30, rental_discount_rate: 0.10, credit_fee_discount_rate: 0.05, priority_access: true },
      { id: 'a5000000-0000-0000-0000-000000000003', name: 'Annual', price: 999000, duration_days: 365, rental_discount_rate: 0.15, credit_fee_discount_rate: 0.10, priority_access: true },
    ],
    skipDuplicates: true,
  })
  console.log('✅ Membership Plans')

  // =============================================================
  // GEAR PRICE HISTORY
  // =============================================================
  await prisma.gearPriceHistory.createMany({
    data: [
      { id: 'a6000000-0000-0000-0000-000000000001', gear_id: '30000000-0000-0000-0000-000000000001', changed_by: '00000000-0000-0000-0000-000000000002', old_rent_price_per_day: 70000, new_rent_price_per_day: 60000, reason: 'Giảm giá khuyến mãi ra mắt' },
      { id: 'a6000000-0000-0000-0000-000000000002', gear_id: '30000000-0000-0000-0000-000000000004', changed_by: '00000000-0000-0000-0000-000000000003', old_rent_price_per_day: 180000, new_rent_price_per_day: 200000, reason: 'Tăng giá theo thị trường' },
    ],
    skipDuplicates: true,
  })
  await prisma.cart.upsert({
    where: { renter_id: '00000000-0000-0000-0000-000000000006' },
    create: {
      id: 'ca000000-0000-0000-0000-000000000001',
      renter_id: '00000000-0000-0000-0000-000000000006',
      items: {
        create: {
          id: 'cb000000-0000-0000-0000-000000000001',
          gear_id: '30000000-0000-0000-0000-000000000005',
          start_date: new Date('2027-08-01T00:00:00.000Z'),
          end_date: new Date('2027-08-05T00:00:00.000Z'),
        },
      },
    },
    update: {},
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

