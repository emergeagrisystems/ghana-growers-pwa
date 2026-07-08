import { FarmMateReasoningRule } from "./types";

export const farmMateReasoningRules: FarmMateReasoningRule[] = [
  {
    id: "leaf-yellowing",
    questionType: "crop-health",
    possibleCauses: ["Water stress", "Nitrogen deficiency", "Early disease", "Root damage"],
    followUpQuestions: [
      "Is the yellowing starting from older lower leaves or new leaves?",
      "Has the crop received heavy rain or daily watering recently?",
      "Do you see spots, curling or insects under the leaves?"
    ],
    recommendedNextAction: "Ask for crop, leaf position and recent watering pattern; recommend Crop Doctor if symptoms are visible.",
    confidenceLevel: "medium",
    safetyActions: ["ask-follow-up-question", "recommend-crop-doctor", "handle-uncertainty"]
  },
  {
    id: "spraying-weather-check",
    questionType: "spraying-safety",
    possibleCauses: ["Rain may wash spray away", "Wind drift risk", "Leaf burn risk in strong heat"],
    followUpQuestions: [
      "Is rain expected within the next 4-6 hours?",
      "Are leaves dry now?",
      "Is the wind calm enough for safe spraying?"
    ],
    recommendedNextAction: "Recommend waiting if rain, strong wind or very hot conditions are likely.",
    confidenceLevel: "high",
    safetyActions: ["avoid-unsafe-chemical-advice", "ask-follow-up-question"]
  },
  {
    id: "planting-date-check",
    questionType: "planting-advice",
    possibleCauses: ["Rainfall timing", "Soil moisture", "Crop-region suitability"],
    followUpQuestions: [
      "Which crop are you planting?",
      "Which region or district is the farm in?",
      "Have you had two or more steady rains?"
    ],
    recommendedNextAction: "Match crop, region and rainfall pattern before recommending planting timing.",
    confidenceLevel: "medium",
    safetyActions: ["ask-follow-up-question"]
  },
  {
    id: "fertilizer-guidance",
    questionType: "soil-fertility",
    possibleCauses: ["Low nitrogen", "Low phosphorus", "Low potassium", "Poor soil organic matter", "Leaching after rain"],
    followUpQuestions: [
      "What crop and growth stage is it?",
      "What signs do you see on older and younger leaves?",
      "Has fertilizer already been applied?"
    ],
    recommendedNextAction: "Give general nutrient guidance and suggest local extension advice for exact fertilizer rates.",
    confidenceLevel: "medium",
    safetyActions: ["ask-follow-up-question", "handle-uncertainty", "recommend-extension-officer"]
  },
  {
    id: "harvest-readiness",
    questionType: "harvest-timing",
    possibleCauses: ["Crop maturity", "Buyer preference", "Weather risk", "Post-harvest handling needs"],
    followUpQuestions: [
      "Which crop are you harvesting?",
      "What size or colour does your buyer prefer?",
      "Is rain expected before harvest?"
    ],
    recommendedNextAction: "Compare crop harvest indicators with market preference and weather risk.",
    confidenceLevel: "medium",
    safetyActions: ["ask-follow-up-question"]
  }
];
