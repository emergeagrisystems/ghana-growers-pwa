export type PublicBuyerRequest = {
  reference: string;
  productName: string;
  quantityNeeded: string;
  region: string;
  district: string;
  deadline: string;
  buyerType: string;
  deliveryPreference: string;
  budgetRange?: string;
  status: "Open" | "Urgent" | "Fulfilled";
  datePosted: string;
};
