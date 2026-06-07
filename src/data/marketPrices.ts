export type MarketPrice = {
  crop: string;
  market: string;
  region: string;
  wholesalePrice: string;
  retailPrice: string;
  dateUpdated: string;
  trend: "Rising" | "Stable" | "Falling";
};

// Edit indicative Ghana market prices here. Replace with API/database data when available.
export const marketPrices: MarketPrice[] = [
  { crop: "Tomatoes", market: "Agbogbloshie", region: "Greater Accra", wholesalePrice: "GHS 950 / crate", retailPrice: "GHS 25 / bowl", dateUpdated: "2026-06-07", trend: "Rising" },
  { crop: "Onions", market: "Kumasi Central Market", region: "Ashanti", wholesalePrice: "GHS 780 / sack", retailPrice: "GHS 18 / bowl", dateUpdated: "2026-06-07", trend: "Stable" },
  { crop: "Maize", market: "Tamale Central Market", region: "Northern", wholesalePrice: "GHS 520 / 100kg", retailPrice: "GHS 8 / olonka", dateUpdated: "2026-06-07", trend: "Falling" },
  { crop: "Cassava", market: "Mankessim Market", region: "Central", wholesalePrice: "GHS 260 / sack", retailPrice: "GHS 12 / bundle", dateUpdated: "2026-06-06", trend: "Stable" },
  { crop: "Yam", market: "Techiman Market", region: "Bono East", wholesalePrice: "GHS 1,100 / 100 tubers", retailPrice: "GHS 18 / tuber", dateUpdated: "2026-06-06", trend: "Rising" },
  { crop: "Plantain", market: "Koforidua Market", region: "Eastern", wholesalePrice: "GHS 420 / bunch lot", retailPrice: "GHS 25 / bunch", dateUpdated: "2026-06-05", trend: "Stable" },
  { crop: "Pepper", market: "Ho Central Market", region: "Volta", wholesalePrice: "GHS 620 / sack", retailPrice: "GHS 16 / bowl", dateUpdated: "2026-06-05", trend: "Rising" },
  { crop: "Rice", market: "Wa Market", region: "Upper West", wholesalePrice: "GHS 640 / 50kg", retailPrice: "GHS 16 / kg", dateUpdated: "2026-06-04", trend: "Stable" },
  { crop: "Eggs", market: "Takoradi Market Circle", region: "Western", wholesalePrice: "GHS 78 / crate", retailPrice: "GHS 3 / egg", dateUpdated: "2026-06-04", trend: "Rising" },
  { crop: "Poultry", market: "Bolgatanga Market", region: "Upper East", wholesalePrice: "GHS 95 / bird", retailPrice: "GHS 115 / bird", dateUpdated: "2026-06-03", trend: "Stable" }
];
