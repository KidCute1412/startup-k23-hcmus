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
                Heritage Gaming Gear Marketplace
              </div>

              <h1 className="text-balance font-display text-3xl font-bold leading-[1.15] tracking-wide sm:text-5xl lg:text-6xl">
                Nâng tầm trải nghiệm gaming,{" "}
                <span className="text-gradient font-normal italic">
                  tối ưu hóa giá trị tài sản gear
                </span>
              </h1>

              <p className="max-w-2xl text-base leading-8 text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted sm:text-lg">
                <strong>Mutux</strong> là marketplace chuyên biệt cho thuê thiết bị gaming hi-end và audio gear cao cấp. Chúng tôi kết nối cộng đồng yêu công nghệ, giúp người chơi dễ dàng trải nghiệm siêu phẩm flagship trước khi quyết định sở hữu, đồng thời hỗ trợ chủ gear biến thiết bị nhàn rỗi thành nguồn thu nhập thụ động an toàn.
              </p>

              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                <LinkButton href="/gears" icon={<ArrowRight size={15} />}>
                  Khám phá Bộ Sưu Tập
                </LinkButton>
                <LinkButton href="/lender/gears" variant="outline" icon={<Award size={15} />}>
                  Đăng Ký Cho Thuê Gear
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
                  Vanguard Elite Standard
                </div>
              </div>
            </div>
          </div>
        </section>

      {/* Stats Counter Section */}
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
          eyebrow="Our Philosophy"
          title="Ba Trụ Cột Nền Tảng Của Mutux"
          description="Chúng tôi giải quyết bài toán cốt lõi của thị trường gear cao cấp: Chi phí sở hữu đắt đỏ và rủi ro tranh chấp khi giao dịch cá nhân."
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

      {/* How Mutux Works / Operating Workflow */}
      <section className="border-t border-vanguard-light-border bg-vanguard-light-surfDim/30 py-16 dark:border-vanguard-dark-border dark:bg-vanguard-dark-surf/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading
            eyebrow="Workflow"
            title="Quy Trình Thuê & Cho Thuê Minh Bạch"
            description="4 bước chuẩn hóa giúp đảm bảo quyền lợi tối đa cho cả Renter và Lender."
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
              eyebrow="Trust & Security"
              title="An Tâm Tuyệt Đối Trong Mọi Giao Dịch"
              description="Hệ thống công nghệ bảo mật của Mutux được thiết kế đặc thù cho các tài sản gaming hi-end có giá trị cao."
            />
            <ul className="space-y-3 pt-2">
              {[
                "Không lo nguy cơ bị bùng cọc hay chậm trễ nợ tiền thuê.",
                "Hạn mức cọc linh hoạt dựa trên điểm uy tín KYC.",
                "Hồ sơ bằng chứng hình ảnh/video mã hóa thời gian thực.",
                "Hỗ trợ trọng tài Resolver can thiệp xử lý sự cố công bằng.",
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

      {/* CTA Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-v-sm border border-vanguard-primary/40 bg-vanguard-dark-surf p-8 sm:p-12 text-vanguard-dark-text shadow-2xl">
          <div className="relative z-10 max-w-3xl space-y-6">
            <span className="inline-flex items-center gap-2 rounded-v-sm bg-vanguard-primary px-3 py-1 font-display text-[10px] font-bold uppercase tracking-widest text-vanguard-dark-bg">
              <Layers size={13} />
              Sẵn Sàng Trải Nghiệm
            </span>

            <h2 className="font-display text-3xl font-bold leading-tight sm:text-4xl">
              Nâng cấp trải nghiệm góc máy của bạn ngay hôm nay
            </h2>

            <p className="text-sm leading-7 text-vanguard-dark-textMuted">
              Dù bạn cần một bộ bàn phím custom cho giải đấu cuối tuần, tai nghe audiophile để thẩm âm hay muốn cho thuê thiết bị nhàn rỗi, Mutux luôn sẵn sàng đồng hành cùng bạn.
            </p>

            <div className="flex flex-col gap-4 pt-2 sm:flex-row">
              <LinkButton href="/gears" icon={<ArrowRight size={15} />}>
                Xem Sản Phẩm Ngay
              </LinkButton>
              <LinkButton href="/wallet" variant="outline" icon={<RefreshCw size={15} />}>
                Kiểm Tra Ví & Tín Dụng
              </LinkButton>
            </div>
          </div>
        </div>
      </section>
    </div>
    </GoldSpotlight>
  );
}
