import buyerRequestData from "@/data/buyerRequests.json";

export type BuyerRequest = {
  id: string;
  productName: string;
  quantityNeeded: string;
  region: string;
  district: string;
  deadline: string;
  buyerType: string;
  contactMethod: string;
  datePosted: string;
};

export const buyerRequestsMeta = {
  lastUpdated: buyerRequestData.lastUpdated,
  note: buyerRequestData.note
};

// Admin-editable source: update records in src/data/buyerRequests.json.
export const buyerRequests = buyerRequestData.requests as BuyerRequest[];
