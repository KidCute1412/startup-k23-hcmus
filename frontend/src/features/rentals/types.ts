export type RentalRequestDraft = {
  gearId: string;
  startDate: string;
  endDate: string;
  depositType: "traditional" | "credit_line";
  shippingName: string;
  shippingPhone: string;
  shippingAddress: string;
};
