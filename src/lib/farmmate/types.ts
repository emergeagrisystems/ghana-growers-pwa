export type ConfidenceLevel = "low" | "medium" | "high";

export type FarmMateRegionId =
  | "ashanti"
  | "bono"
  | "central"
  | "eastern"
  | "greater-accra"
  | "northern"
  | "upper-east"
  | "upper-west"
  | "volta"
  | "western";

export type FarmMateQuestionType =
  | "crop-health"
  | "planting-advice"
  | "spraying-safety"
  | "soil-fertility"
  | "watering"
  | "harvest-timing"
  | "general";

export type FarmMateSafetyAction =
  | "recommend-extension-officer"
  | "recommend-crop-doctor"
  | "ask-follow-up-question"
  | "handle-uncertainty"
  | "avoid-unsafe-chemical-advice";

export type GrowthStage = {
  name: string;
  timing: string;
  keyCare: string[];
};

export type FarmMateCrop = {
  id: string;
  name: string;
  suitableRegions: FarmMateRegionId[];
  plantingSeasons: string[];
  spacing: string;
  soil: {
    type: string;
    ph?: string;
    preparation: string[];
  };
  water: {
    needs: string;
    guidance: string[];
  };
  growthStages: GrowthStage[];
  commonPests: string[];
  commonDiseases: string[];
  nutrientDeficiencies: string[];
  harvestIndicators: string[];
  sustainablePractices: string[];
  notes?: string[];
};

export type FarmMateDisease = {
  id: string;
  name: string;
  affectedCrops: string[];
  symptoms: string[];
  likelyConditions: string[];
  firstResponse: string[];
  recommendCropDoctor: boolean;
};

export type FarmMatePest = {
  id: string;
  name: string;
  affectedCrops: string[];
  signs: string[];
  prevention: string[];
  firstResponse: string[];
};

export type FarmMateNutrientDeficiency = {
  id: string;
  nutrient: string;
  commonSigns: string[];
  likelyCrops: string[];
  nextChecks: string[];
  generalAction: string;
};

export type FarmMateRegion = {
  id: FarmMateRegionId;
  name: string;
  climateNotes: string;
  commonCrops: string[];
  advisoryNotes: string[];
};

export type FarmMateSustainablePractice = {
  id: string;
  title: string;
  appliesTo: string[];
  benefit: string;
  steps: string[];
};

export type FarmMateReasoningRule = {
  id: string;
  questionType: FarmMateQuestionType;
  possibleCauses: string[];
  followUpQuestions: string[];
  recommendedNextAction: string;
  confidenceLevel: ConfidenceLevel;
  safetyActions: FarmMateSafetyAction[];
};

export type FarmMateSafetyRule = {
  id: string;
  trigger: string;
  action: FarmMateSafetyAction;
  responseGuidance: string;
  escalationMessage?: string;
};
