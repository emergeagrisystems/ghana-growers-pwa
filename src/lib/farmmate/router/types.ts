export type FarmMateSpecialist =
  | "crop_health"
  | "pest_disease"
  | "weather_decision"
  | "planting"
  | "fertilizer"
  | "crop_doctor"
  | "sustainability"
  | "learning"
  | "general_farming";

export type RouterConfidence = "high" | "medium" | "low";

export type RouterRule = {
  specialist: FarmMateSpecialist;
  keywords: string[];
  reason: string;
  suggestedFallbackSpecialist: FarmMateSpecialist;
};

export type RouterResult = {
  selectedSpecialist: FarmMateSpecialist;
  confidence: RouterConfidence;
  matchedKeywords: string[];
  reason: string;
  suggestedFallbackSpecialist: FarmMateSpecialist;
  detectedCrop?: string;
};

export type FarmMateRouterContext = {
  source?: "crop_doctor";
  crop?: string | null;
  issueCategory?: "pest" | "disease" | "nutrient" | "water_stress" | "unknown";
  possibleIssue?: string;
};

export type FarmMateSpecialistProfile = {
  specialist: FarmMateSpecialist;
  title: string;
  description: string;
};
