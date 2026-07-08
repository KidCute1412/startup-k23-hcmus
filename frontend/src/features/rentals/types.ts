export type RentalRequestDraft = {
  gearId: string;
  startDate: string;
  endDate: string;
  depositType: "cash" | "credit-line";
  shippingName: string;
  shippingPhone: string;
  shippingAddress: string;
};
