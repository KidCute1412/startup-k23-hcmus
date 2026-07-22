export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  avatarUrl: string;
  bio: string;
  cccd: string;
  kycStatus: 'pending' | 'approved' | 'rejected' | 'unverified';
  kycRejectionReason?: string;
  createdAt: string;
}

export interface UserAddress {
  id: string;
  receiverName: string;
  phone: string;
  detailAddress: string;
  ward: string;
  district: string;
  province: string;
  isDefault: boolean;
}

export type OrderStatusType =
  | 'pending_confirm'
  | 'confirmed'
  | 'delivering'
  | 'active'
  | 'returning'
  | 'completed'
  | 'cancelled'
  | 'disputed';

export interface OrderProof {
  id: string;
  stage: 'handover' | 'return';
  images: string[];
  note?: string;
  createdAt: string;
}

export interface RentalOrderMock {
  id: string;
  code: string;
  status: OrderStatusType;
  gearId: string;
  gearTitle: string;
  gearImage: string;
  lenderName: string;
  lenderPhone: string;
  startDate: string;
  endDate: string;
  dailyRate: number;
  totalDays: number;
  rentalFee: number;
  depositAmount: number;
  depositType: 'traditional' | 'credit_line';
  shippingAddress: string;
  createdAt: string;
  timeline: {
    title: string;
    description: string;
    timestamp: string;
    completed: boolean;
  }[];
  proofs?: OrderProof[];
}

export const mockUserProfile: UserProfile = {
  id: "usr-8829102",
  fullName: "Nguyễn Văn Tuấn",
  email: "tuan.nguyen@example.com",
  phone: "0908 123 456",
  avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
  bio: "Gamer PC enthusiast & pro rental member tại Mutux.",
  cccd: "079201088921",
  kycStatus: "approved",
  createdAt: "2025-11-15",
};

export const mockUserAddresses: UserAddress[] = [
  {
    id: "addr-01",
    receiverName: "Nguyễn Văn Tuấn",
    phone: "0908 123 456",
    detailAddress: "227 Nguyễn Văn Cừ, Phường 4",
    ward: "Phường 4",
    district: "Quận 5",
    province: "TP. Hồ Chí Minh",
    isDefault: true,
  },
  {
    id: "addr-02",
    receiverName: "Nguyễn Văn Tuấn (Văn phòng)",
    phone: "0908 123 456",
    detailAddress: "Toà nhà Bitexco, 2 Hải Triều",
    ward: "Phường Bến Nghé",
    district: "Quận 1",
    province: "TP. Hồ Chí Minh",
    isDefault: false,
  },
];

export const mockRentalOrders: RentalOrderMock[] = [
  {
    id: "ord-1001",
    code: "MUTUX-1001",
    status: "active",
    gearId: "gear-01",
    gearTitle: "PlayStation 5 Slim Digital Edition + 2 Tay cầm DualSense",
    gearImage: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=500&q=80",
    lenderName: "Trần Minh Đức (Vanguard Store)",
    lenderPhone: "0912 345 678",
    startDate: "2026-07-20",
    endDate: "2026-07-25",
    dailyRate: 150000,
    totalDays: 5,
    rentalFee: 750000,
    depositAmount: 3000000,
    depositType: "credit_line",
    shippingAddress: "227 Nguyễn Văn Cừ, Phường 4, Quận 5, TP. Hồ Chí Minh",
    createdAt: "2026-07-19 14:30",
    timeline: [
      { title: "Tạo đơn thành công", description: "Đã giữ hạn mức cọc 3,000,000đ", timestamp: "19/07/2026 14:30", completed: true },
      { title: "Chủ gear xác nhận", description: "Đơn hàng đã được duyệt", timestamp: "19/07/2026 15:10", completed: true },
      { title: "Đang giao hàng", description: "Đơn hàng đang được shipper bàn giao", timestamp: "20/07/2026 09:00", completed: true },
      { title: "Đã nhận gear (Active)", description: "Đã nghiệm thu thiết bị và bắt đầu tính giờ thuê", timestamp: "20/07/2026 10:15", completed: true },
      { title: "Hoàn trả gear", description: "Dự kiến bàn giao lại cho chủ gear", timestamp: "25/07/2026 10:15", completed: false },
    ],
    proofs: [
      {
        id: "prf-01",
        stage: "handover",
        images: [
          "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=500&q=80",
          "https://images.unsplash.com/photo-1592840496694-26d035b52b48?auto=format&fit=crop&w=500&q=80",
        ],
        note: "Máy PS5 hoạt động bình thường, nguyên tem niêm phong Mutux.",
        createdAt: "20/07/2026 10:10",
      },
    ],
  },
  {
    id: "ord-1002",
    code: "MUTUX-1002",
    status: "pending_confirm",
    gearId: "gear-02",
    gearTitle: "Kính thực tế ảo Meta Quest 3 512GB VR Headset",
    gearImage: "https://images.unsplash.com/photo-1622979135225-d2ba269bc1bd?auto=format&fit=crop&w=500&q=80",
    lenderName: "Ngô Quốc Bảo",
    lenderPhone: "0988 777 666",
    startDate: "2026-07-24",
    endDate: "2026-07-26",
    dailyRate: 250000,
    totalDays: 2,
    rentalFee: 500000,
    depositAmount: 5000000,
    depositType: "traditional",
    shippingAddress: "227 Nguyễn Văn Cừ, Phường 4, Quận 5, TP. Hồ Chí Minh",
    createdAt: "2026-07-22 10:00",
    timeline: [
      { title: "Tạo đơn thành công", description: "Chờ chủ gear xác nhận nhận đơn", timestamp: "22/07/2026 10:00", completed: true },
      { title: "Chủ gear xác nhận", description: "Đợi phản hồi từ người cho thuê", timestamp: "Đang chờ...", completed: false },
    ],
  },
  {
    id: "ord-1003",
    code: "MUTUX-1003",
    status: "completed",
    gearId: "gear-03",
    gearTitle: "Vô lăng chơi game Logitech G29 Driving Force + Cần số Shifter",
    gearImage: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=500&q=80",
    lenderName: "Lê Hoàng Yến",
    lenderPhone: "0933 112 233",
    startDate: "2026-07-10",
    endDate: "2026-07-12",
    dailyRate: 180000,
    totalDays: 2,
    rentalFee: 360000,
    depositAmount: 2500000,
    depositType: "credit_line",
    shippingAddress: "Toà nhà Bitexco, 2 Hải Triều, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
    createdAt: "2026-07-09 16:45",
    timeline: [
      { title: "Tạo đơn thành công", description: "Xác nhận thành công", timestamp: "09/07/2026 16:45", completed: true },
      { title: "Đã giao & nhận", description: "Nghiệm thu vô lăng tốt", timestamp: "10/07/2026 09:30", completed: true },
      { title: "Đã hoàn trả", description: "Chủ gear nhận lại hàng & giải phóng cọc", timestamp: "12/07/2026 17:00", completed: true },
      { title: "Đơn hoàn tất", description: "Đơn thuê kết thúc thành công", timestamp: "12/07/2026 17:05", completed: true },
    ],
    proofs: [
      {
        id: "prf-02",
        stage: "handover",
        images: ["https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=500&q=80"],
        note: "Vô lăng mới 98%, nút bấm nhạy.",
        createdAt: "10/07/2026 09:30",
      },
      {
        id: "prf-03",
        stage: "return",
        images: ["https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=500&q=80"],
        note: "Bàn giao trả đầy đủ phụ kiện.",
        createdAt: "12/07/2026 17:00",
      },
    ],
  },
  {
    id: "ord-1004",
    code: "MUTUX-1004",
    status: "cancelled",
    gearId: "gear-04",
    gearTitle: "Màn hình di động ASUS ROG Strix XG16AHPE 144Hz",
    gearImage: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=500&q=80",
    lenderName: "Đặng Quang Anh",
    lenderPhone: "0977 223 344",
    startDate: "2026-07-05",
    endDate: "2026-07-07",
    dailyRate: 120000,
    totalDays: 2,
    rentalFee: 240000,
    depositAmount: 1800000,
    depositType: "traditional",
    shippingAddress: "227 Nguyễn Văn Cừ, Phường 4, Quận 5, TP. Hồ Chí Minh",
    createdAt: "2026-07-04 11:20",
    timeline: [
      { title: "Tạo đơn thành công", description: "Đã gửi yêu cầu", timestamp: "04/07/2026 11:20", completed: true },
      { title: "Đã hủy đơn", description: "Người thuê hủy đơn trước khi giao", timestamp: "04/07/2026 12:00", completed: true },
    ],
  },
];
