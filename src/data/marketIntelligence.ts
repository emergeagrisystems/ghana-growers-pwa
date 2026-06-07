import marketIntelligenceData from "@/data/marketIntelligence.json";

export type DemandLevel = "High Demand" | "Moderate Demand" | "Low Demand";

export type PriceTrendPoint = {
  period: string;
  price: number;
};

export type PriceTrendRecord = {
  product: string;
  region: string;
  unit: string;
  currentPrice: number;
  history: PriceTrendPoint[];
};

export type DemandSignal = {
  product: string;
  region: string;
  demandLevel: DemandLevel;
  lastUpdated: string;
};

export type SeasonalCalendarRecord = {
  product: string;
  plantingSeason: string;
  growingSeason: string;
  harvestSeason: string;
};

export type RegionalOpportunity = {
  region: string;
  mostRequestedProducts: string[];
  marketNotes: string;
};

export const marketIntelligenceMeta = {
  lastUpdated: marketIntelligenceData.lastUpdated,
  currency: marketIntelligenceData.currency
};

export const priceTrends = marketIntelligenceData.priceTrends as PriceTrendRecord[];
export const demandSignals = marketIntelligenceData.demandSignals as DemandSignal[];
export const seasonalCalendar = marketIntelligenceData.seasonalCalendar as SeasonalCalendarRecord[];
export const regionalOpportunities = marketIntelligenceData.regionalOpportunities as RegionalOpportunity[];
