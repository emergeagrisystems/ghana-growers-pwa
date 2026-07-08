import { SafetyRule } from "./types";

export const decisionEngineSafetyRules: SafetyRule[] = [
  {
    id: "uncertain-symptom-description",
    appliesToIntents: ["crop-health", "pests", "diseases", "fertilizer"],
    trigger: "The farmer describes symptoms without enough visible detail to distinguish disease, pest damage or nutrient stress.",
    requiredResponse: "State uncertainty clearly and ask for the most useful follow-up observation before giving a firm diagnosis.",
    blocksRecommendation: false
  },
  {
    id: "photo-needed-for-visual-diagnosis",
    appliesToIntents: ["crop-health", "pests", "diseases"],
    trigger: "The farmer mentions spots, leaf colour change, wilting, holes, rot or unknown visible damage.",
    requiredResponse: "Recommend Crop Doctor for a photo-based check before treating the crop.",
    blocksRecommendation: false
  },
  {
    id: "chemical-advice-guardrail",
    appliesToIntents: ["pests", "diseases", "fertilizer", "weather-decisions"],
    trigger: "The recommendation could involve pesticide, fungicide, herbicide or exact fertilizer dose advice.",
    requiredResponse: "Do not invent product rates. Prioritize prevention and good farming practice, then refer to product labels or extension officers for chemical use.",
    blocksRecommendation: false
  },
  {
    id: "rapid-spread-escalation",
    appliesToIntents: ["crop-health", "pests", "diseases"],
    trigger: "The farmer reports fast spread, many affected plants or severe crop loss risk.",
    requiredResponse: "Recommend contacting a local extension officer as the next best action.",
    blocksRecommendation: true
  }
];
