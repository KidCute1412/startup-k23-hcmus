import type { ProofStage } from "@/types/rentals";

export const PROOF_STAGE_LABELS: Record<ProofStage, { title: string; desc: string }> = {
  pre_shipment: {
    title: "Ảnh trước khi giao gear",
    desc: "Chủ gear chụp ngoại hình và phụ kiện của thiết bị trước khi đóng gói gửi đi.",
  },
  post_received: {
    title: "Ảnh sau khi nhận gear",
    desc: "Người thuê chụp lại tình trạng gear ngay sau khi mở gói hàng.",
  },
  pre_return: {
    title: "Ảnh trước khi trả gear",
    desc: "Người thuê chụp ngoại hình và đóng gói thiết bị trước khi gửi trả lại chủ gear.",
  },
  post_returned: {
    title: "Ảnh sau khi nhận lại gear",
    desc: "Chủ gear chụp ngoại hình thiết bị khi đã nhận lại từ shipper/người thuê.",
  },
};
