import type { Metadata } from "next";
import Image from "next/image";
import {
  ArrowRight,
  Award,
  CheckCircle2,
  Cpu,
  Layers,
  Lock,
  RefreshCw,
  Scale,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { GoldSpotlight } from "@/components/ui/animations/gold-spotlight";
import { GoldDustParticles } from "@/components/ui/animations/gold-dust-particles";

export const metadata: Metadata = {
  title: "Về Chúng Tôi | Mutux - Nền Tảng Cho Thuê Gaming Gear Cao Cấp",
  description:
    "Tìm hiểu về Mutux: Sứ mệnh tái định hình trải nghiệm gaming hi-end qua mô hình cho thuê minh bạch, cơ chế cọc Escrow an toàn và bảo chứng bằng chứng thiết bị.",
};

const pillars = [
  {
    icon: Sparkles,
    title: "Trải Nghiệm Hi-End Thật Sự",
    description:
      "Tự do khám phá và thi đấu trên những bộ bàn phím custom CNC nguyên khối, headphone planar-magnetic đắt giá hay chuột flagship mà không cần bỏ chi phí sở hữu ban đầu quá lớn.",
  },
  {
    icon: ShieldCheck,
    title: "Bảo Chứng Minh Bạch (Proof-of-Condition)",
    description:
      "Mọi quy trình bàn giao gear đều được mã hóa serial number và lưu trữ bằng chứng hình ảnh/video 2 chiều, đảm bảo tính công bằng và minh bạch tuyệt đối cho cả người thuê và chủ sở hữu.",
  },
  {
    icon: Lock,
    title: "Mô Hình Cọc Escrow & Ví Mutux",
    description:
      "Tiền cọc được khóa an toàn trong hệ thống Escrow và tự động hoàn về Ví Mutux ngay khi thiết bị được xác nhận hoàn trả nguyên vẹn, xóa tan mối lo giữ cọc hay chậm thanh toán.",
  },
];

const workflowSteps = [
  {
    step: "01",
    title: "Khám Phá Catalog Hoàng Gia",
    description:
      "Lựa chọn thiết bị từ bộ sưu tập bàn phím custom, headset studio, màn hình tần số quét cao hay setup trọn gói phù hợp nhu cầu.",
  },
  {
    step: "02",
    title: "Xác Thực & Khóa Cọc Escrow",
    description:
      "Hệ thống tự động kiểm tra điểm tín dụng KYC và giữ tiền cọc an toàn trên Ví Mutux. Cọc linh hoạt dựa trên mức độ uy tín của tài khoản.",
  },
  {
    step: "03",
    title: "Bàn Giao & Lưu Bằng Chứng",
    description:
      "Chủ gear và Người thuê đồng kiểm tra tình trạng, chụp ảnh/video minh chứng và xác nhận mã serial trước khi kích hoạt thời gian sử dụng.",
  },
  {
    step: "04",
    title: "Hoàn Trả & Giải Ngân Tự Động",
    description:
      "Gear trả về đúng hạn được đối soát tự động. Tiền cọc lập tức hoàn trả và khoản phí thuê được giải ngân an toàn cho Lender.",
  },
];

const stats = [
  { label: "Thiết bị hi-end kiểm định", value: "500+" },
  { label: "Minh bạch bằng chứng bàn giao", value: "100%" },
  { label: "Thời gian xử lý cọc tự động", value: "< 2 Phút" },
  { label: "Đánh giá hài lòng từ Gamer", value: "4.9 / 5.0" },
];

const securityFeatures = [
  {
    icon: Users,
    title: "Xác thực danh tính KYC minh bạch",
    desc: "100% người dùng trên Mutux đều qua xác thực CCCD/VNeID và điểm uy tín giao dịch.",
  },
  {
    icon: Scale,
    title: "Đội ngũ Resolver hỗ trợ 24/7",
    desc: "Trọng tài độc lập hỗ trợ xử lý khiếu nại và trích xuất bằng chứng bàn giao khi phát sinh tranh chấp.",
  },
  {
    icon: Zap,
    title: "Thanh toán & Nạp rút qua PayOS",
    desc: "Tích hợp cổng thanh toán trực tuyến bảo mật, nạp rút ví tức thì không chi phí ẩn.",
  },
  {
    icon: Cpu,
    title: "Định danh Serial & Tem Niêm Phong",
    desc: "Mỗi chiếc gear đều có mã định danh duy nhất chống nguy cơ tráo đổi linh kiện.",
  },
];

const teamMembers = [
  {
    name: "Lưu Huy Minh Quang",
    studentId: "23127016",
    role: "Project Owner & Core System Architect",
    businessRole: "Project Owner",
    techRole: "Backend System Engineer",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
    bio: "Định hướng chiến lược phát triển sản phẩm, đảm bảo kiến trúc hệ thống và quy trình trải nghiệm tối ưu cho người dùng.",
  },
  {
    name: "Trần Cao Vân",
    studentId: "23127141",
    role: "Project Manager & Frontend Head",
    businessRole: "Project Manager & Business Analyst",
    techRole: "Frontend Lead & Quality Assurance",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
    bio: "Quản trị tiến độ dự án, định hướng giao diện UI/UX chuẩn mực và phụ trách kiểm định chất lượng toàn hệ thống.",
  },
  {
    name: "Lê Tuấn Lộc",
    studentId: "23127404",
    role: "Head of Growth & Backend Lead",
    businessRole: "Marketing Director",
    techRole: "Backend Head Engineer",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
    bio: "Hoạch định chiến lược phát triển đối tác, tiếp thị và phụ trách trực tiếp kiến trúc API & Cơ sở dữ liệu trung tâm.",
  },
  {
    name: "Nguyễn Hồ Anh Quốc",
    studentId: "23127465",
    role: "Head of Finance & Frontend Engineer",
    businessRole: "Finance & Credit Line Officer",
    techRole: "Frontend Engineer",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80",
    bio: "Quản lý mô hình tài chính Escrow, hạn mức tín dụng tài khoản và đồng phát triển các tính năng giao diện người dùng.",
  },
  {
    name: "Lê Hồ Đan Anh",
    studentId: "23127318",
    role: "Senior Business Analyst & Backend Engineer",
    businessRole: "Senior Business Analyst",
    techRole: "Backend Software Engineer",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80",
    bio: "Phân tích bài toán thị trường, tối ưu trải nghiệm khách hàng Renter/Lender và phát triển các dịch vụ backend chuyên sâu.",
  },
];

export default function AboutPage() {
  return (
    <GoldSpotlight className="w-full">
      <div className="relative space-y-16 py-8 sm:space-y-24 sm:py-12">
        <GoldDustParticles count={36} />
        {/* Hero Banner Section */}
        <section className="relative overflow-hidden px-4 sm:px-6">
          <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-12">
            <div className="space-y-6 lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-vanguard-primary/30 bg-vanguard-primary/5 px-4 py-1.5 font-display text-xs font-semibold uppercase tracking-widest text-vanguard-primary">
                <span className="size-1.5 rounded-full bg-vanguard-primary" />
                Nền Tảng Cho Thuê Gaming Gear Hàng Đầu
              </div>

              <h1 className="text-balance font-display text-3xl font-bold leading-[1.15] tracking-wide sm:text-5xl lg:text-6xl">
                Trải nghiệm Gear đỉnh cao,{" "}
                <span className="text-gradient font-normal italic">
                  an tâm tuyệt đối trong từng giao dịch
                </span>
              </h1>

              <p className="max-w-2xl text-base leading-8 text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted sm:text-lg">
                <strong>Mutux</strong> kết nối cộng đồng yêu công nghệ và game thủ, giúp bạn dễ dàng trải nghiệm các siêu phẩm bàn phím custom, tai nghe hi-end, màn hình gaming đỉnh cao với chi phí chỉ bằng một phần nhỏ giá mua mới — đi kèm cam kết <strong>hoàn cọc 100% tự động</strong> và <strong>bảo vệ quyền lợi người thuê</strong> tuyệt đối.
              </p>

              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                <LinkButton href="/gears" icon={<ArrowRight size={15} />}>
                  Thử Gear Ngay
                </LinkButton>
                <LinkButton href="/wallet" variant="outline" icon={<ShieldCheck size={15} />}>
                  Khám Phá Ví & Quyền Lợi Cọc
                </LinkButton>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="royal-glow relative mx-auto aspect-[4/3] w-full max-w-lg rounded-v-sm border border-vanguard-primary/30 bg-vanguard-light-surf p-2 shadow-2xl dark:bg-vanguard-dark-surf">
                <div className="gold-shimmer relative h-full overflow-hidden rounded-v-sm border border-vanguard-light-border dark:border-vanguard-dark-border">
                  <Image
                    src="https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80"
                    alt="Mutux Gaming Gear Rental Marketplace"
                    fill
                    priority
                    sizes="(min-width: 1024px) 40vw, 100vw"
                    className="object-cover"
                  />
                </div>
                <div className="absolute bottom-5 right-5 border border-vanguard-primary/30 bg-vanguard-dark-bg/90 px-4 py-2 font-display text-[10px] font-semibold uppercase tracking-widest text-vanguard-primary backdrop-blur-md">
                  Chuẩn Chu đáo & Minh Bạch
                </div>
              </div>
            </div>
          </div>
        </section>

      {/* Trust Stats Counter Section */}
      <section className="border-y border-vanguard-light-border bg-vanguard-light-surfDim/50 py-10 dark:border-vanguard-dark-border dark:bg-vanguard-dark-surfDim/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat, idx) => (
              <div
                key={idx}
                className="space-y-1 text-center md:text-left"
              >
                <p className="font-display text-3xl font-extrabold text-vanguard-primary sm:text-4xl">
                  {stat.value}
                </p>
                <p className="text-xs uppercase tracking-wider text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted font-medium">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Pillars / Mission Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Triết Lý Sản Phẩm"
          title="Vì Sao Hàng Ngàn Game Thủ Tin Chọn Mutux?"
          description="Chúng tôi mang đến giải pháp thuê thiết bị cao cấp vừa tiết kiệm chi phí vừa xóa bỏ hoàn toàn nỗi lo giam cọc hay tráo đồ."
        />

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {pillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div
                key={idx}
                className="group relative flex flex-col justify-between rounded-v-sm border border-vanguard-light-border bg-vanguard-light-surf p-7 transition-all duration-300 hover:-translate-y-1 hover:border-vanguard-primary/50 hover:shadow-royal dark:border-vanguard-dark-border dark:bg-vanguard-dark-surf"
              >
                <div className="space-y-4">
                  <div className="inline-flex size-12 items-center justify-center rounded-v-sm border border-vanguard-primary/30 bg-vanguard-primary/10 text-vanguard-primary transition-colors group-hover:bg-gold-metal group-hover:text-vanguard-dark-bg">
                    <Icon size={22} />
                  </div>
                  <h3 className="font-display text-xl font-bold">
                    {pillar.title}
                  </h3>
                  <p className="text-sm leading-7 text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                    {pillar.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* How Deposit & Escrow Works - Simplified Trust Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="rounded-v-sm border border-vanguard-primary/30 bg-vanguard-primary/5 p-8 sm:p-10 dark:bg-vanguard-dark-surf">
          <div className="grid gap-8 lg:grid-cols-12 items-center">
            <div className="space-y-4 lg:col-span-7">
              <span className="inline-flex items-center gap-2 font-display text-xs font-bold uppercase tracking-widest text-vanguard-primary">
                <Lock size={16} /> Cơ chế Giữ Cọc An Toàn 100%
              </span>
              <h3 className="font-display text-2xl font-bold sm:text-3xl">
                Tiền cọc của bạn được bảo vệ như thế nào?
              </h3>
              <p className="text-sm leading-7 text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                Trên Mutux, <strong>tiền cọc KHÔNG chuyển trực tiếp cho người chủ máy</strong>. Khoản cọc được giữ an toàn trên hệ thống trung gian (Escrow) của Mutux. Khi bạn hoàn trả thiết bị đúng hạn và nguyên vẹn, <strong>tiền cọc lập tức hoàn 100% về Ví Mutux</strong> và bạn có thể rút về tài khoản ngân hàng bất kỳ lúc nào.
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 pt-2">
                <div className="flex items-center gap-2.5 text-xs font-medium">
                  <CheckCircle2 size={16} className="text-vanguard-primary shrink-0" />
                  <span>Hoàn cọc tự động chỉ trong vài phút</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs font-medium">
                  <CheckCircle2 size={16} className="text-vanguard-primary shrink-0" />
                  <span>Rút tiền 24/7 về ngân hàng Việt Nam</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs font-medium">
                  <CheckCircle2 size={16} className="text-vanguard-primary shrink-0" />
                  <span>Hạn mức cọc ưu đãi cho tài khoản uy tín</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs font-medium">
                  <CheckCircle2 size={16} className="text-vanguard-primary shrink-0" />
                  <span>Không phát sinh phụ phí ẩn</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 rounded-v-sm border border-vanguard-primary/20 bg-vanguard-light-surf p-6 dark:bg-vanguard-dark-bg">
              <h4 className="font-display text-base font-bold text-vanguard-primary mb-3">
                Lợi ích khi mở Ví & Nạp tiền Mutux:
              </h4>
              <ul className="space-y-3 text-xs leading-6 text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-vanguard-primary">1.</span>
                  <span><strong>Đặt thuê tức thì:</strong> Giữ máy nhanh chóng không lo gián đoạn giao dịch.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-vanguard-primary">2.</span>
                  <span><strong>Ưu đãi Hạn Mức Tín Dụng:</strong> Được giảm hoặc miễn tiền cọc theo điểm uy tín tài khoản.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-vanguard-primary">3.</span>
                  <span><strong>Nạp rút linh hoạt qua PayOS:</strong> An toàn tuyệt đối với mã QR Napas247 chính chủ.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How Mutux Works / Operating Workflow */}
      <section className="border-t border-vanguard-light-border bg-vanguard-light-surfDim/30 py-16 dark:border-vanguard-dark-border dark:bg-vanguard-dark-surf/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading
            eyebrow="Quy Trình"
            title="4 Bước Thuê Gear Đơn Giản & Dễ Dàng"
            description="Quy trình chuẩn hóa bảo vệ trọn vẹn trải nghiệm của bạn từ khi đặt hàng đến lúc trả máy."
          />

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {workflowSteps.map((item, idx) => (
              <div
                key={idx}
                className="relative flex flex-col justify-between rounded-v-sm border border-vanguard-light-border bg-vanguard-light-surf p-6 dark:border-vanguard-dark-border dark:bg-vanguard-dark-bg"
              >
                <div>
                  <span className="font-display text-3xl font-black text-vanguard-primary/40">
                    {item.step}
                  </span>
                  <h4 className="mt-3 font-display text-lg font-semibold">
                    {item.title}
                  </h4>
                  <p className="mt-2 text-xs leading-6 text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security & Protection Features */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-12 items-center">
          <div className="space-y-6 lg:col-span-5">
            <SectionHeading
              eyebrow="An Toàn & Bảo Vệ"
              title="Quyền Lợi Của Bạn Luôn Được Đặt Lên Hàng Đầu"
              description="Mutux xây dựng hệ thống bảo vệ toàn diện để bạn hoàn toàn yên tâm trải nghiệm các thiết bị đắt tiền."
            />
            <ul className="space-y-3 pt-2">
              {[
                "100% Tiền cọc được khóa an toàn, tự động hoàn trả đầy đủ khi xong hợp đồng.",
                "Hạn mức cọc giảm đến 100% dựa trên mức độ uy tín tài khoản của bạn.",
                "Đồng kiểm tra & chụp ảnh xác minh tình trạng trước khi nhận thiết bị.",
                "Đội ngũ hỗ trợ Resolver can thiệp xử lý công bằng nếu phát sinh sự cố.",
              ].map((text, i) => (
                <li key={i} className="flex items-start gap-3 text-xs sm:text-sm">
                  <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-vanguard-primary" />
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-7">
            {securityFeatures.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div
                  key={idx}
                  className="rounded-v-sm border border-vanguard-light-border bg-vanguard-light-surf p-5 dark:border-vanguard-dark-border dark:bg-vanguard-dark-surf"
                >
                  <Icon size={20} className="text-vanguard-primary" />
                  <h4 className="mt-3 font-display text-base font-semibold">
                    {feat.title}
                  </h4>
                  <p className="mt-1 text-xs leading-5 text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                    {feat.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Founding Team & Key Roles Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Đội Ngũ Phát Triển"
          title="Đội Ngũ Sáng Lập & Chuyên Gia Vận Hành"
          description="Những con người đứng sau hệ thống Mutux — kết hợp giữa chuyên môn quản trị kinh doanh, tài chính, tiếp thị và kỹ thuật phần mềm."
        />

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {teamMembers.map((member, idx) => (
            <div
              key={idx}
              className="group relative flex flex-col justify-between rounded-v-sm border border-vanguard-light-border bg-vanguard-light-surf p-6 transition-all duration-300 hover:-translate-y-1 hover:border-vanguard-primary/50 hover:shadow-royal dark:border-vanguard-dark-border dark:bg-vanguard-dark-surf"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="relative size-14 shrink-0 overflow-hidden rounded-full border border-vanguard-primary/40">
                    <Image
                      src={member.avatar}
                      alt={member.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold text-vanguard-light-text dark:text-vanguard-dark-text">
                      {member.name}
                    </h3>
                    <p className="font-display text-xs font-semibold uppercase tracking-wider text-vanguard-primary">
                      {member.role}
                    </p>
                    <span className="text-[10px] font-mono text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                      MSSV: {member.studentId}
                    </span>
                  </div>
                </div>

                <p className="text-xs leading-6 text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                  {member.bio}
                </p>
              </div>

              <div className="mt-6 border-t border-vanguard-light-border/60 pt-4 dark:border-vanguard-dark-border/60 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted font-medium">Business:</span>
                  <span className="font-semibold text-vanguard-primary">{member.businessRole}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted font-medium">R&D / Tech:</span>
                  <span className="font-semibold text-vanguard-light-text dark:text-vanguard-dark-text">{member.techRole}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Section for Deposit & Wallet Trust */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Giải Đáp Thắc Mắc"
          title="Câu Hỏi Thường Gặp Về Đặt Cọc & Ví Mutux"
          description="Giải đáp các băn khoăn phổ biến để bạn tự tin mở ví và trải nghiệm ngay."
        />

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="rounded-v-sm border border-vanguard-light-border bg-vanguard-light-surf p-6 dark:border-vanguard-dark-border dark:bg-vanguard-dark-surf space-y-2">
            <h4 className="font-display text-base font-bold text-vanguard-primary">
              1. Tiền cọc của tôi có an toàn không và khi nào tôi nhận lại được?
            </h4>
            <p className="text-xs sm:text-sm leading-6 text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
              Rất an toàn! Tiền cọc của bạn được hệ thống giữ tạm thời (Escrow) chứ không chuyển cho bên cho thuê. Ngay khi bạn trả thiết bị và xác nhận tình trạng thành công, tiền cọc sẽ được hệ thống hoàn lại 100% vào Ví Mutux ngay lập tức.
            </p>
          </div>

          <div className="rounded-v-sm border border-vanguard-light-border bg-vanguard-light-surf p-6 dark:border-vanguard-dark-border dark:bg-vanguard-dark-surf space-y-2">
            <h4 className="font-display text-base font-bold text-vanguard-primary">
              2. Tôi có thể rút tiền từ Ví Mutux về ngân hàng được không?
            </h4>
            <p className="text-xs sm:text-sm leading-6 text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
              Hoàn toàn được! Bạn có thể thực hiện lệnh rút tiền từ Ví Mutux về tài khoản ngân hàng cá nhân bất kỳ lúc nào 24/7 qua cổng PayOS an toàn và miễn phí.
            </p>
          </div>

          <div className="rounded-v-sm border border-vanguard-light-border bg-vanguard-light-surf p-6 dark:border-vanguard-dark-border dark:bg-vanguard-dark-surf space-y-2">
            <h4 className="font-display text-base font-bold text-vanguard-primary">
              3. Làm sao để tôi được giảm tiền cọc khi thuê thiết bị?
            </h4>
            <p className="text-xs sm:text-sm leading-6 text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
              Chỉ cần bạn hoàn tất xác minh tài khoản (KYC) và duy trì lịch sử thuê máy đúng hạn, điểm uy tín của bạn sẽ tăng lên và Mutux sẽ cấp cho bạn Hạn Mức Tín Dụng giúp miễn giảm tiền cọc lên tới 100%.
            </p>
          </div>

          <div className="rounded-v-sm border border-vanguard-light-border bg-vanguard-light-surf p-6 dark:border-vanguard-dark-border dark:bg-vanguard-dark-surf space-y-2">
            <h4 className="font-display text-base font-bold text-vanguard-primary">
              4. Nếu thiết bị nhận được không đúng như mô tả thì xử lý thế nào?
            </h4>
            <p className="text-xs sm:text-sm leading-6 text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
              Bạn có thể từ chối nhận máy ở bước bàn giao và gửi khiếu nại. Đội ngũ trọng tài (Resolver) của Mutux sẽ kiểm tra bằng chứng hình ảnh và hoàn tiền 100% cho bạn mà không mất phí.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-v-sm border border-vanguard-primary/40 bg-vanguard-dark-surf p-8 sm:p-12 text-vanguard-dark-text shadow-2xl">
          <div className="relative z-10 max-w-3xl space-y-6">
            <span className="inline-flex items-center gap-2 rounded-v-sm bg-vanguard-primary px-3 py-1 font-display text-[10px] font-bold uppercase tracking-widest text-vanguard-dark-bg">
              <Layers size={13} />
              Sẵn Sàng Trải Nghiệm
            </span>

            <h2 className="font-display text-3xl font-bold leading-tight sm:text-4xl">
              Mở Ví Mutux & Trải Nghiệm Gear Ngay Hôm Nay
            </h2>

            <p className="text-sm leading-7 text-vanguard-dark-textMuted">
              Khám phá ngay bộ sưu tập bàn phím custom, tai nghe hi-end và gear thi đấu đỉnh cao với quy trình nạp/cọc minh bạch, an toàn tuyệt đối.
            </p>

            <div className="flex flex-col gap-4 pt-2 sm:flex-row">
              <LinkButton href="/gears" icon={<ArrowRight size={15} />}>
                Xem Danh Sách Thiết Bị
              </LinkButton>
              <LinkButton href="/wallet" variant="outline" icon={<RefreshCw size={15} />}>
                Nạp Ví & Kiểm Tra Tín Dụng
              </LinkButton>
            </div>
          </div>
        </div>
      </section>
    </div>
    </GoldSpotlight>
  );
}

