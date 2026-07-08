export type ConfidenceLevel = "high" | "medium" | "low";

export type FarmerIntent =
  | "crop-health"
  | "pests"
  | "diseases"
  | "planting"
  | "fertilizer"
  | "weather-decisions"
  | "harvest"
  | "crop-planning";

export type SustainabilityPriority =
  | "prevention"
  | "good-farming-practice"
  | "natural-low-cost-solution"
  | "chemical-recommendation-if-appropriate";

export type FollowUpQuestion = {
  id: string;
  question: string;
  requiredForConfidence: boolean;
};

export type RequiredInformation = {
  crop?: string;
  region?: string;
  growthStage?: string;
  recentWeather?: string;
  visibleSymptoms?: string[];
  farmPracticeContext?: string[];
};

export type ReasoningStep = {
  id: string;
  observation: string;
  interpretation: string;
};

export type NextBestAction = {
  id: string;
  label: string;
  instruction: string;
  actionType: "ask-follow-up" | "use-crop-doctor" | "take-farm-action" | "contact-extension-officer" | "monitor";
};

export type Recommendation = {
  summary: string;
  confidence: ConfidenceLevel;
  reasoning: ReasoningStep[];
  sustainabilityPriority: SustainabilityPriority[];
  guidance: string[];
  nextBestAction: NextBestAction;
};

export type SafetyRule = {
  id: string;
  appliesToIntents: FarmerIntent[];
  trigger: string;
  requiredResponse: string;
  blocksRecommendation: boolean;
};

export type DecisionFlow = {
  id: string;
  question: string;
  intent: FarmerIntent;
  requiredInformation: RequiredInformation;
  followUpQuestions: FollowUpQuestion[];
  recommendation: Recommendation;
  safetyRules: SafetyRule[];
};
