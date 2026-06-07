import marketPriceData from "@/data/marketPrices.json";

export type MarketPriceTrend = "Rising" | "Stable" | "Falling";

export type MarketPrice = {
  crop: string;
  market: string;
  region: string;
  wholesalePrice: string;
  retailPrice: string;
  dateUpdated: string;
  trend: MarketPriceTrend;
};

export const marketPriceMeta = {
  lastUpdated: marketPriceData.lastUpdated,
  currency: marketPriceData.currency,
  note: marketPriceData.note
};

// Admin-editable source: update records in src/data/marketPrices.json.
export const marketPrices = marketPriceData.records as MarketPrice[];
